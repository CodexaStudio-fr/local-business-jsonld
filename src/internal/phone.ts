/** Numéro impossible à convertir en E.164 sans deviner. */
export class InvalidPhoneError extends Error {
  readonly input: string;

  constructor(message: string, input: string) {
    super(message);
    this.name = "InvalidPhoneError";
    this.input = input;
  }
}

const DIAL_CODES: Record<string, string> = {
  AT: "43",
  BE: "32",
  BG: "359",
  CA: "1",
  CH: "41",
  CY: "357",
  CZ: "420",
  DE: "49",
  DK: "45",
  DZ: "213",
  EE: "372",
  ES: "34",
  FI: "358",
  FR: "33",
  GB: "44",
  GR: "30",
  HR: "385",
  HU: "36",
  IE: "353",
  IS: "354",
  IT: "39",
  LT: "370",
  LU: "352",
  LV: "371",
  MA: "212",
  MC: "377",
  MT: "356",
  NL: "31",
  NO: "47",
  PL: "48",
  PT: "351",
  RO: "40",
  SE: "46",
  SI: "386",
  SK: "421",
  SN: "221",
  TN: "216",
  US: "1",
};

const KEEPS_TRUNK_ZERO = new Set(["IT"]);

const MIN_E164_DIGITS = 8;
const MAX_E164_DIGITS = 15;
const SEPARATORS = /[\s.\-/]/g;

function assertDigitCount(digits: string, input: string): void {
  if (digits.length < MIN_E164_DIGITS || digits.length > MAX_E164_DIGITS) {
    throw new InvalidPhoneError(
      `Téléphone « ${input} » : ${digits.length} chiffres, hors des bornes E.164 (${MIN_E164_DIGITS} à ${MAX_E164_DIGITS}).`,
      input,
    );
  }
}

function stripFormatting(raw: string): string {
  return raw.replace(/\(0\)/g, "").replace(SEPARATORS, "");
}

function withoutDialPrefix(cleaned: string): string | null {
  if (cleaned.startsWith("+")) return cleaned.slice(1);
  if (cleaned.startsWith("00")) return cleaned.slice(2);
  return null;
}

/**
 * Normalise un téléphone en E.164. Un numéro national exige `defaultCountry`,
 * sans quoi il est refusé plutôt que deviné.
 */
export function normalizePhone(input: string, defaultCountry?: string): string {
  const raw = input.trim();
  if (raw === "") {
    throw new InvalidPhoneError("Téléphone vide.", input);
  }

  const cleaned = stripFormatting(raw);
  const international = withoutDialPrefix(cleaned);

  if (international !== null) {
    if (!/^\d+$/.test(international)) {
      throw new InvalidPhoneError(
        `Téléphone « ${input} » : caractères non numériques après l'indicatif. Attendu du format E.164, par exemple +33243123456.`,
        input,
      );
    }
    assertDigitCount(international, input);
    return `+${international}`;
  }

  if (!/^\d+$/.test(cleaned)) {
    throw new InvalidPhoneError(
      `Téléphone « ${input} » : caractères non numériques. Attendu du format E.164, par exemple +33243123456.`,
      input,
    );
  }

  if (defaultCountry === undefined) {
    throw new InvalidPhoneError(
      `Téléphone « ${input} » ambigu : pas d'indicatif pays. Écrire le numéro au format E.164 (+33243123456), ou fournir « defaultCountry ».`,
      input,
    );
  }

  const country = defaultCountry.toUpperCase();
  const dial = DIAL_CODES[country];
  if (dial === undefined) {
    throw new InvalidPhoneError(
      `Téléphone « ${input} » : indicatif inconnu pour le pays « ${defaultCountry} ». Écrire le numéro au format E.164 (+33243123456).`,
      input,
    );
  }

  const national =
    cleaned.startsWith("0") && !KEEPS_TRUNK_ZERO.has(country) ? cleaned.slice(1) : cleaned;

  const digits = `${dial}${national}`;
  assertDigitCount(digits, input);
  return `+${digits}`;
}
