/**
 * Normalisation des numéros de téléphone en E.164 (§8.6).
 *
 * Google veut `+33243123456`, pas `02 43 12 34 56`. Un numéro national sans
 * indicatif est **ambigu** : on refuse plutôt que de deviner.
 *
 * Ce n'est pas `libphonenumber` et ça n'essaie pas de l'être : pas de validation
 * de plan de numérotation, pas de formatage régional. Juste « rendre l'entrée
 * exploitable, ou dire pourquoi c'est impossible ». Zéro dépendance oblige.
 */

/** Numéro impossible à convertir en E.164 sans deviner. */
export class InvalidPhoneError extends Error {
  /** Le numéro refusé, tel que fourni. */
  readonly input: string;

  constructor(message: string, input: string) {
    super(message);
    this.name = "InvalidPhoneError";
    this.input = input;
  }
}

/**
 * Indicatifs pays, table curée : UE/EEE, Suisse, Royaume-Uni, plus les
 * destinations courantes des PME françaises. Un pays absent n'est pas un bug —
 * il suffit d'écrire le numéro directement en E.164.
 */
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

/**
 * Pays où le zéro de tête fait partie du numéro et **ne doit pas** être retiré.
 * L'Italie est le cas d'école : `02 1234567` (Milan) devient `+39021234567`.
 */
const KEEPS_TRUNK_ZERO = new Set(["IT"]);

/** E.164 : 15 chiffres maximum, indicatif compris. */
const MAX_E164_DIGITS = 15;
/** En dessous, ce n'est pas un numéro d'établissement mais une faute de frappe. */
const MIN_E164_DIGITS = 8;

/** Sépateurs tolérés : espaces (y compris insécables), points, tirets, barres. */
const SEPARATORS = /[\s.\-/]/g;

function assertDigitCount(digits: string, input: string): void {
  if (digits.length < MIN_E164_DIGITS || digits.length > MAX_E164_DIGITS) {
    throw new InvalidPhoneError(
      `Téléphone « ${input} » : ${digits.length} chiffres, hors des bornes E.164 (${MIN_E164_DIGITS} à ${MAX_E164_DIGITS}).`,
      input,
    );
  }
}

/**
 * Normalise un téléphone en E.164.
 *
 * ```ts
 * normalizePhone("02 43 12 34 56", "FR"); // "+33243123456"
 * normalizePhone("+33 (0)2 43 12 34 56"); // "+33243123456"
 * ```
 *
 * @param input numéro tel que saisi
 * @param defaultCountry code ISO 3166-1 alpha-2 utilisé si le numéro est national
 * @throws {InvalidPhoneError} numéro vide, non numérique, hors bornes, ou
 *   national sans indicatif exploitable
 */
export function normalizePhone(input: string, defaultCountry?: string): string {
  const raw = input.trim();
  if (raw === "") {
    throw new InvalidPhoneError("Téléphone vide.", input);
  }

  // `+33 (0)2 43 …` : notation mixte où le (0) est le préfixe national, à jeter.
  const cleaned = raw.replace(/\(0\)/g, "").replace(SEPARATORS, "");

  const international = cleaned.startsWith("+")
    ? cleaned.slice(1)
    : cleaned.startsWith("00")
      ? cleaned.slice(2)
      : null;

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
