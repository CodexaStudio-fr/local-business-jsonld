function readNodeEnv(): string | undefined {
  return (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV;
}

/** `true` hors production. */
export function isDev(): boolean {
  return readNodeEnv() !== "production";
}

/** Écrit un avertissement, sauf en production. */
export function warnInDev(message: string): void {
  if (isDev()) console.warn(`[@codexastudio/local-business-jsonld] ${message}`);
}
