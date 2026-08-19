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
const END_OF_DAY = MINUTES_PER_DAY - 1;
const ALWAYS_OPEN = /^24\s*\/\s*7$/;
const CLOSED_RULE = /^(.*?)\s*off$/i;
const TIME = /^(\d{1,2}):(\d{2})$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

interface Fragment {
  value: string;
  position: number;
}

function splitFragments(text: string, separator: string, offset: number): Fragment[] {
  const fragments: Fragment[] = [];
  let cursor = offset;

  for (const part of text.split(separator)) {
    const leading = part.length - part.trimStart().length;
    fragments.push({ value: part.trim(), position: cursor + leading });
    cursor += part.length + separator.length;
  }

  return fragments;
}

function parseTime(fragment: Fragment): number {
  const match = TIME.exec(fragment.value);
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

function parseSlot(fragment: Fragment): TimeSlot {
  const [from, to, ...extra] = splitFragments(fragment.value, "-", fragment.position);
  if (!from || !to || extra.length > 0) {
    throw new InvalidTimeError(
      `Créneau invalide « ${fragment.value} » à la position ${fragment.position}. Format attendu : HH:MM-HH:MM.`,
      fragment.value,
      fragment.position,
    );
  }

  const opens = parseTime(from);
  const closes = parseTime(to);

  if (opens === closes) {
    throw new InvalidTimeError(
      `Créneau de durée nulle « ${fragment.value} » à la position ${fragment.position}. Pour une ouverture continue, écrire « 00:00-24:00 » ou « 24/7 ».`,
      fragment.value,
      fragment.position,
    );
  }

  return { opens, closes };
}

function parseDaySpec(daySpec: Fragment): number[] {
  const [from, to, ...extra] = splitFragments(daySpec.value, "-", daySpec.position);
  if (!from || extra.length > 0) {
    throw new InvalidDayError(
      `Plage de jours invalide « ${daySpec.value} » à la position ${daySpec.position}. Format attendu : Mo-Fr.`,
      daySpec.value,
      daySpec.position,
    );
  }

  const first = dayIndex(from.value, from.position);
  if (!to) return [first];

  return expandDayRange(first, dayIndex(to.value, to.position));
}

function parseDays(fragment: Fragment): number[] {
  if (fragment.value === "") {
    throw new InvalidDayError(
      `Règle sans jour à la position ${fragment.position}. Préfixer par des jours, par exemple « Mo-Su 09:00-18:00 ».`,
      "",
      fragment.position,
    );
  }

  return splitFragments(fragment.value, ",", fragment.position).flatMap(parseDaySpec);
}

function applyRule(week: WeekSlots, rule: Fragment): void {
  if (ALWAYS_OPEN.test(rule.value)) {
    for (let day = 0; day < DAYS_IN_WEEK; day += 1) {
      week.set(day, [{ opens: 0, closes: END_OF_DAY }]);
    }
    return;
  }

  const firstDigit = rule.value.search(/\d/);

  if (firstDigit === -1) {
    const closed = CLOSED_RULE.exec(rule.value);
    if (!closed || closed[1] === undefined) {
      throw new OpeningHoursError(
        `Règle incomplète « ${rule.value} » à la position ${rule.position}. Attendu : des jours suivis de créneaux (« Mo-Fr 09:00-18:00 ») ou de « off ».`,
        rule.position,
      );
    }
    for (const day of parseDays({ value: closed[1].trim(), position: rule.position })) {
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
 * Traduit le DSL d'horaires en `OpeningHoursSpecification[]`, en heure locale de
 * l'établissement. Chaque règle remplace les créneaux des jours qu'elle nomme.
 */
export function parseOpeningHours(
  input: string | readonly string[],
): OpeningHoursSpecificationNode[] {
  const source = typeof input === "string" ? input : input.join("; ");
  if (source.trim() === "") return [];

  const week: WeekSlots = new Map();
  for (const rule of splitFragments(source, ";", 0)) {
    if (rule.value !== "") applyRule(week, rule);
  }

  return mergeWeekSlots(week);
}

function assertIsoDate(value: string, label: string): string {
  if (!ISO_DATE.test(value)) {
    throw new InvalidDateError(
      `Date invalide « ${value} » pour ${label}. Format attendu : YYYY-MM-DD.`,
      value,
    );
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new InvalidDateError(`Date inexistante « ${value} » pour ${label}.`, value);
  }
  return value;
}

function normalizeSpecialTime(value: string): string {
  return formatMinutes(parseTime({ value, position: 0 }));
}

function resolvePeriod(entry: SpecialHoursInput): { from: string; through: string | undefined } {
  const { date, from, to } = entry;

  if (date !== undefined && (from !== undefined || to !== undefined)) {
    throw new OpeningHoursError(
      `Horaire exceptionnel ambigu : « date » et « from »/« to » sont exclusifs (date = ${date}).`,
    );
  }

  if (date !== undefined) {
    const day = assertIsoDate(date, "date");
    return { from: day, through: day };
  }

  if (from === undefined) {
    throw new OpeningHoursError(
      "Horaire exceptionnel sans date : fournir « date », ou « from » (et « to »).",
    );
  }

  const start = assertIsoDate(from, "from");
  const end = to === undefined ? undefined : assertIsoDate(to, "to");

  if (end !== undefined && end < start) {
    throw new InvalidDateError(
      `Période inversée : « to » (${end}) précède « from » (${start}).`,
      end,
    );
  }

  return { from: start, through: end };
}

/**
 * Traduit les fermetures et horaires exceptionnels en specs datées. `closed`
 * produit `00:00`–`00:00`, la convention Google pour « fermé ce jour-là ».
 */
export function parseSpecialOpeningHours(
  entries: readonly SpecialHoursInput[],
): OpeningHoursSpecificationNode[] {
  return entries.map((entry) => {
    const { closed, opens, closes } = entry;
    const { from, through } = resolvePeriod(entry);

    if (closed === true) {
      if (opens !== undefined || closes !== undefined) {
        throw new OpeningHoursError(
          `Horaire exceptionnel contradictoire (${from}) : « closed: true » exclut « opens »/« closes ».`,
        );
      }
      return {
        "@type": "OpeningHoursSpecification",
        opens: "00:00",
        closes: "00:00",
        validFrom: from,
        validThrough: through,
      };
    }

    if (opens === undefined || closes === undefined) {
      throw new OpeningHoursError(
        `Horaire exceptionnel incomplet (${from}) : fournir « opens » et « closes », ou « closed: true ».`,
      );
    }

    return {
      "@type": "OpeningHoursSpecification",
      opens: normalizeSpecialTime(opens),
      closes: normalizeSpecialTime(closes),
      validFrom: from,
      validThrough: through,
    };
  });
}
