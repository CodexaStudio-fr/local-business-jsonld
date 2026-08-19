/** Racine de toutes les erreurs du parseur d'horaires. */
export class OpeningHoursError extends Error {
  /** Index du fragment fautif dans la chaîne d'entrée. */
  readonly position: number | undefined;

  constructor(message: string, position?: number) {
    super(message);
    this.name = "OpeningHoursError";
    this.position = position;
  }
}

/** Jour inconnu, plage de jours invalide, ou règle sans jour. */
export class InvalidDayError extends OpeningHoursError {
  readonly token: string;

  constructor(message: string, token: string, position: number) {
    super(message, position);
    this.name = "InvalidDayError";
    this.token = token;
  }
}

/** Heure hors bornes, mal formée, ou créneau de durée nulle. */
export class InvalidTimeError extends OpeningHoursError {
  readonly token: string;

  constructor(message: string, token: string, position: number) {
    super(message, position);
    this.name = "InvalidTimeError";
    this.token = token;
  }
}

/** Date d'horaire exceptionnel mal formée, impossible, ou période inversée. */
export class InvalidDateError extends OpeningHoursError {
  readonly token: string;

  constructor(message: string, token: string) {
    super(message);
    this.name = "InvalidDateError";
    this.token = token;
  }
}
