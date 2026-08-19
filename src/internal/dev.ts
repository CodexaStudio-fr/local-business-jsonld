/**
 * Avertissements de développement. Un `@id` dupliqué dans un `@graph` est une
 * erreur de composition, mais pas de quoi faire tomber une page en production —
 * on le signale là où quelqu'un le lira.
 */

/**
 * Cast justifié : `process` n'existe pas partout (navigateur, runtime edge).
 * Passer par `globalThis` évite d'exiger `@types/node` chez les consommateurs.
 * La lecture est paresseuse : un bundler ou un test peut réécrire `NODE_ENV`
 * après le chargement du module.
 */
function readNodeEnv(): string | undefined {
  return (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV;
}

/** `true` hors production. */
export function isDev(): boolean {
  return readNodeEnv() !== "production";
}

/** Écrit un avertissement, sauf en production. */
export function warnInDev(message: string): void {
  if (isDev()) console.warn(`[local-business-jsonld] ${message}`);
}
