import type { OpeningHoursSpecificationNode } from "../types/output.js";
import { toDayNames } from "./days.js";

/** Créneau normalisé, exprimé en minutes depuis minuit. */
export interface TimeSlot {
  opens: number;
  closes: number;
}

/** Table jour (0 = lundi) → créneaux du jour. Un tableau vide signifie « fermé ». */
export type WeekSlots = Map<number, TimeSlot[]>;

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

/** Trie par heure d'ouverture, puis par heure de fermeture, et dédoublonne. */
function normalizeSlots(slots: TimeSlot[]): TimeSlot[] {
  const seen = new Set<string>();
  const unique: TimeSlot[] = [];
  for (const slot of slots) {
    const key = `${slot.opens}-${slot.closes}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(slot);
  }
  return unique.sort((a, b) => a.opens - b.opens || a.closes - b.closes);
}

/** Signature d'un ensemble de créneaux : deux jours fusionnent si elle est identique. */
function slotsKey(slots: TimeSlot[]): string {
  return slots.map((slot) => `${slot.opens}-${slot.closes}`).join("|");
}

/**
 * Regroupe les jours qui partagent **exactement** le même ensemble de créneaux,
 * puis émet une `OpeningHoursSpecification` par créneau du groupe.
 *
 * `Mo-Fr 09:00-18:00` + `Sa 09:00-18:00` sort en **une** spec de six jours, pas
 * deux : c'est la forme que préfère le validateur Google (§2.3).
 *
 * Les groupes sortent triés par premier jour de la semaine, et les créneaux d'un
 * groupe par heure d'ouverture — la sortie est donc stable pour les snapshots.
 */
export function mergeWeekSlots(week: WeekSlots): OpeningHoursSpecificationNode[] {
  const groups = new Map<string, { days: number[]; slots: TimeSlot[] }>();

  for (const [day, rawSlots] of week) {
    const slots = normalizeSlots(rawSlots);
    // Un jour fermé n'a rien à dire : pas de spec vide en sortie.
    if (slots.length === 0) continue;

    const key = slotsKey(slots);
    const group = groups.get(key);
    if (group) {
      group.days.push(day);
    } else {
      groups.set(key, { days: [day], slots });
    }
  }

  const ordered = [...groups.values()].sort((a, b) => Math.min(...a.days) - Math.min(...b.days));

  const specs: OpeningHoursSpecificationNode[] = [];
  for (const group of ordered) {
    const dayOfWeek = toDayNames(group.days);
    for (const slot of group.slots) {
      specs.push({
        "@type": "OpeningHoursSpecification",
        // Copie par spec : deux nœuds ne doivent jamais partager le même tableau.
        dayOfWeek: [...dayOfWeek],
        opens: formatMinutes(slot.opens),
        closes: formatMinutes(slot.closes),
      });
    }
  }
  return specs;
}

export { formatMinutes };
