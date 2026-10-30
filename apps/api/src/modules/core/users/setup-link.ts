/**
 * Regras do link de definição de senha compartilhadas entre o service de convites (Worker) e
 * `scripts/create-admin.ts` (Node). Sem dependência de `config()`/`db()` de propósito.
 */

/** Validade do token de definição de senha: 7 dias. */
export const SETUP_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Caminho da tela "Definir senha" no web. */
export function setupPath(token: string): string {
  return `/definir-senha/${token}`;
}

/** Nome provisório a partir do e-mail: "marina.duarte@" → "Marina Duarte". */
export function provisionalName(email: string): string {
  const local = email.split('@')[0] ?? '';
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}
