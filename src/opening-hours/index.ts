/**
 * Sous-export `local-business-jsonld/opening-hours` : le DSL d'horaires seul,
 * pour qui veut le parseur sans les builders.
 */

export { DAY_NAMES, dayName } from "./days.js";
export {
  InvalidDateError,
  InvalidDayError,
  InvalidTimeError,
  OpeningHoursError,
} from "./errors.js";
export { mergeWeekSlots, type TimeSlot, type WeekSlots } from "./merge.js";
export { parseOpeningHours, parseSpecialOpeningHours } from "./parse.js";
