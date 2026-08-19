import type { OpeningHoursSpecificationNode } from "../types/output.js";
import { toDayNames } from "./days.js";

/** Créneau exprimé en minutes depuis minuit. */
export interface TimeSlot {
  opens: number;
  closes: number;
}

/** Table jour (0 = lundi) vers créneaux. Un tableau vide signifie fermé. */
export type WeekSlots = Map<number, TimeSlot[]>;

interface DayGroup {
  days: number[];
  slots: TimeSlot[];
}

export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function slotKey(slot: TimeSlot): string {
  return `${slot.opens}-${slot.closes}`;
}

function dedupeAndSort(slots: TimeSlot[]): TimeSlot[] {
  const unique = new Map(slots.map((slot) => [slotKey(slot), slot]));
  return [...unique.values()].sort((a, b) => a.opens - b.opens || a.closes - b.closes);
}

function groupBySlots(week: WeekSlots): DayGroup[] {
  const groups = new Map<string, DayGroup>();

  for (const [day, rawSlots] of week) {
    const slots = dedupeAndSort(rawSlots);
    if (slots.length === 0) continue;

    const key = slots.map(slotKey).join("|");
    const group = groups.get(key);
    if (group) {
      group.days.push(day);
    } else {
      groups.set(key, { days: [day], slots });
    }
  }

  return [...groups.values()].sort((a, b) => Math.min(...a.days) - Math.min(...b.days));
}

/**
 * Regroupe les jours qui partagent exactement les mêmes créneaux, puis émet une
 * `OpeningHoursSpecification` par créneau du groupe.
 */
export function mergeWeekSlots(week: WeekSlots): OpeningHoursSpecificationNode[] {
  const specs: OpeningHoursSpecificationNode[] = [];

  for (const group of groupBySlots(week)) {
    const dayOfWeek = toDayNames(group.days);
    for (const slot of group.slots) {
      specs.push({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [...dayOfWeek],
        opens: formatMinutes(slot.opens),
        closes: formatMinutes(slot.closes),
      });
    }
  }

  return specs;
}
