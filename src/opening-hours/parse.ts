import type { SpecialHoursInput } from "../types/input.js";
import type { OpeningHoursSpecificationNode } from "../types/output.js";
import { DAYS_IN_WEEK, dayIndex, expandDayRange } from "./days.js";
import {
  InvalidDateError,
  InvalidDayError,
  InvalidTimeError,
  OpeningHoursError,
} from "./errors.js";
import { formatMinutes, mergeWeekSlots, type TimeSlot, type WeekSlots } from "./merge.js";

const MINUTES_PER_DAY = 24 * 60;
/** Convention Google : « ouvert jusqu'à minuit » s'écrit `23:59`, jamais `24:00`. */
const END_OF_DAY = MINUTES_PER_DAY - 1;

/** Fragment de chaîne avec sa position d'origine, pour des erreurs localisables. */
interface Fragment {
  value: string;
  position: number;
}

/**
 * Découpe en conservant les positions dans la chaîne d'origine. Les fragments
 * sont trimés, et leur `position` pointe le premier caractère non blanc — donc
 * l'erreur désigne le jeton fautif, pas l'espace qui le précède.
 */
function splitFragments(text: string, separator: string, offset: number): Fragment[] {
  const fragments: Fragment[] = [];
  let start = 0;

  for (;;) {
    const found = text.indexOf(separator, start);
    const end = found === -1 ? text.length : found;
    const raw = text.slice(start, end);
    const leading = raw.length - raw.trimStart().length;
    fragments.push({ value: raw.trim(), position: offset + start + leading });
    if (found === -1) break;
    start = found + separator.length;
  }

  return fragments;
}

/** `"9:00"` → 540. Lève une {@link InvalidTimeError} sur tout ce qui n'est pas `HH:MM`. */
function parseTime(fragment: Fragment): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(fragment.value);
  if (!match?.[1] || !match[2]) {
    throw new InvalidTimeError(
      `Heure invalide « ${fragment.value} » à la position ${fragment.position}. Format attendu : HH:MM (00:00 à 24:00).`,
      fragment.value,
      fragment.position,
    );
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 24 || minutes > 59 || (hours === 24 && minutes > 0)) {
    throw new InvalidTimeError(
      `Heure hors bornes « ${fragment.value} » à la position ${fragment.position}. Bornes : 00:00 à 24:00.`,
      fragment.value,
      fragment.position,
    );
  }

  const total = hours * 60 + minutes;
  return total === MINUTES_PER_DAY ? END_OF_DAY : total;
}

/** `"09:00-18:00"` → créneau. Le chevauchement de minuit (`22:00-02:00`) est permis. */
function parseSlot(fragment: Fragment): TimeSlot {
  const bounds = splitFragments(fragment.value, "-", fragment.position);
  if (bounds.length !== 2 || !bounds[0] || !bounds[1]) {
    throw new InvalidTimeError(
      `Créneau invalide « ${fragment.value} » à la position ${fragment.position}. Format attendu : HH:MM-HH:MM.`,
      fragment.value,
      fragment.position,
    );
  }

  const opens = parseTime(bounds[0]);
  const closes = parseTime(bounds[1]);

  if (opens === closes) {
    throw new InvalidTimeError(
      `Créneau de durée nulle « ${fragment.value} » à la position ${fragment.position}. Pour une ouverture continue, écrire « 00:00-24:00 » ou « 24/7 ».`,
      fragment.value,
      fragment.position,
    );
  }

  return { opens, closes };
}

/** `"Mo-Fr"`, `"Mo,We,Fr"`, `"Fr-Mo"` → index de jours. */
function parseDays(fragment: Fragment): number[] {
  if (fragment.value === "") {
    throw new InvalidDayError(
      `Règle sans jour à la position ${fragment.position}. Préfixer par des jours, par exemple « Mo-Su 09:00-18:00 ».`,
      "",
      fragment.position,
    );
  }

  const days: number[] = [];
  for (const daySpec of splitFragments(fragment.value, ",", fragment.position)) {
    const bounds = splitFragments(daySpec.value, "-", daySpec.position);
    const first = bounds[0];
    if (!first) {
      throw new InvalidDayError(
        `Plage de jours invalide « ${daySpec.value} » à la position ${daySpec.position}.`,
        daySpec.value,
        daySpec.position,
      );
    }

    if (bounds.length === 1) {
      days.push(dayIndex(first.value, first.position));
      continue;
    }

    const last = bounds[1];
    if (bounds.length !== 2 || !last) {
      throw new InvalidDayError(
        `Plage de jours invalide « ${daySpec.value} » à la position ${daySpec.position}. Format attendu : Mo-Fr.`,
        daySpec.value,
        daySpec.position,
      );
    }

    const from = dayIndex(first.value, first.position);
    const to = dayIndex(last.value, last.position);
    days.push(...expandDayRange(from, to));
  }

  return days;
}

/**
 * Applique une règle à la semaine. La règle **remplace** les créneaux des jours
 * qu'elle nomme, elle ne s'y ajoute pas : c'est ce qui fait marcher
 * `"Mo-Fr 09:00-18:00; We off"` (mercredi retiré) autant que
 * `"Mo-Fr 09:00-18:00; Fr 09:00-12:00"` (vendredi raccourci).
 */
function applyRule(week: WeekSlots, rule: Fragment): void {
  // `24/7` est un raccourci, pas une règle jour + créneaux.
  if (/^24\s*\/\s*7$/.test(rule.value)) {
    for (let day = 0; day < DAYS_IN_WEEK; day += 1) {
      week.set(day, [{ opens: 0, closes: END_OF_DAY }]);
    }
    return;
  }

  const firstDigit = rule.value.search(/\d/);

  if (firstDigit === -1) {
    const off = /^(.*?)\s*off$/i.exec(rule.value);
    if (!off || off[1] === undefined) {
      throw new OpeningHoursError(
        `Règle incomplète « ${rule.value} » à la position ${rule.position}. Attendu : des jours suivis de créneaux (« Mo-Fr 09:00-18:00 ») ou de « off ».`,
        rule.position,
      );
    }
    for (const day of parseDays({ value: off[1].trim(), position: rule.position })) {
      week.set(day, []);
    }
    return;
  }

  const days = parseDays({
    value: rule.value.slice(0, firstDigit).trim(),
    position: rule.position,
  });

  const slots = splitFragments(rule.value.slice(firstDigit), ",", rule.position + firstDigit).map(
    parseSlot,
  );

  for (const day of days) week.set(day, slots);
}

/**
 * Traduit le DSL d'horaires en `OpeningHoursSpecification[]`.
 *
 * ```ts
 * parseOpeningHours("Mo-Fr 08:00-12:00,14:00-18:00; Sa 09:00-12:00");
 * ```
 *
 * Les horaires sont exprimés en **heure locale de l'établissement** : schema.org
 * ne porte pas de fuseau, et ce package n'en invente pas.
 *
 * @throws {InvalidDayError} jour inconnu ou règle sans jour
 * @throws {InvalidTimeError} heure hors bornes, mal formée, ou créneau nul
 * @throws {OpeningHoursError} règle incomplète
 */
export function parseOpeningHours(input: string | string[]): OpeningHoursSpecificationNode[] {
  const source = Array.isArray(input) ? input.join("; ") : input;
  if (source.trim() === "") return [];

  const week: WeekSlots = new Map();
  for (const rule of splitFragments(source, ";", 0)) {
    if (rule.value === "") continue;
    applyRule(week, rule);
  }

  return mergeWeekSlots(week);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function assertIsoDate(value: string, label: string): string {
  if (!ISO_DATE.test(value)) {
    throw new InvalidDateError(
      `Date invalide « ${value} » pour ${label}. Format attendu : YYYY-MM-DD.`,
      value,
    );
  }
  // Écarte les dates impossibles (2026-02-30) : le round-trip ne recolle pas.
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new InvalidDateError(`Date inexistante « ${value} » pour ${label}.`, value);
  }
  return value;
}

/** `"9:00"` → `"09:00"`, `"24:00"` → `"23:59"`, pour les horaires exceptionnels. */
function normalizeSpecialTime(value: string): string {
  return formatMinutes(parseTime({ value, position: 0 }));
}

/**
 * Traduit les fermetures et horaires exceptionnels en
 * `OpeningHoursSpecification` datées (`validFrom` / `validThrough`), à placer
 * dans `specialOpeningHoursSpecification`.
 *
 * Un jour fermé s'écrit `opens: "00:00", closes: "00:00"` — c'est la convention
 * Google pour « fermé ce jour-là ».
 *
 * L'ordre des entrées est conservé.
 */
export function parseSpecialOpeningHours(
  entries: SpecialHoursInput[],
): OpeningHoursSpecificationNode[] {
  const specs: OpeningHoursSpecificationNode[] = [];

  for (const entry of entries) {
    const { date, from, to, closed, opens, closes } = entry;

    if (date !== undefined && (from !== undefined || to !== undefined)) {
      throw new OpeningHoursError(
        `Horaire exceptionnel ambigu : « date » et « from »/« to » sont exclusifs (date = ${date}).`,
      );
    }

    let validFrom: string;
    let validThrough: string | undefined;

    if (date !== undefined) {
      validFrom = assertIsoDate(date, "date");
      validThrough = validFrom;
    } else if (from !== undefined) {
      validFrom = assertIsoDate(from, "from");
      validThrough = to === undefined ? undefined : assertIsoDate(to, "to");
      if (validThrough !== undefined && validThrough < validFrom) {
        throw new InvalidDateError(
          `Période inversée : « to » (${validThrough}) précède « from » (${validFrom}).`,
          validThrough,
        );
      }
    } else {
      throw new OpeningHoursError(
        "Horaire exceptionnel sans date : fournir « date », ou « from » (et « to »).",
      );
    }

    if (closed === true) {
      if (opens !== undefined || closes !== undefined) {
        throw new OpeningHoursError(
          `Horaire exceptionnel contradictoire (${validFrom}) : « closed: true » exclut « opens »/« closes ».`,
        );
      }
      specs.push({
        "@type": "OpeningHoursSpecification",
        // Convention Google pour « fermé ce jour-là ».
        opens: "00:00",
        closes: "00:00",
        validFrom,
        validThrough,
      });
      continue;
    }

    if (opens === undefined || closes === undefined) {
      throw new OpeningHoursError(
        `Horaire exceptionnel incomplet (${validFrom}) : fournir « opens » et « closes », ou « closed: true ».`,
      );
    }

    specs.push({
      "@type": "OpeningHoursSpecification",
      opens: normalizeSpecialTime(opens),
      closes: normalizeSpecialTime(closes),
      validFrom,
      validThrough,
    });
  }

  return specs;
}
