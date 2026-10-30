/**
 * Leitura das `vars` do Worker fora do runtime: produção vem do `wrangler.jsonc`, dev de `.dev.vars`.
 * (A API programática do wrangler não tem tipos resolvíveis aqui, por isso o parse é próprio.)
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { apiDir } from './sql';

/** Remove comentários e vírgulas finais (fora de strings) e faz o `JSON.parse`. */
export function parseJsonc(text: string): unknown {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const ch = text.charAt(i);
    const next = text.charAt(i + 1);
    if (ch === '"') {
      let j = i + 1;
      while (j < text.length && text.charAt(j) !== '"') {
        if (text.charAt(j) === '\\') j++;
        j++;
      }
      out += text.slice(i, j + 1);
      i = j + 1;
    } else if (ch === '/' && next === '/') {
      while (i < text.length && text.charAt(i) !== '\n') i++;
    } else if (ch === '/' && next === '*') {
      const end = text.indexOf('*/', i + 2);
      i = end === -1 ? text.length : end + 2;
    } else if (ch === ',' && /^\s*[}\]]/.test(text.slice(i + 1))) {
      i++;
    } else {
      out += ch;
      i++;
    }
  }
  return JSON.parse(out) as unknown;
}

/** `vars` de produção declaradas no `wrangler.jsonc`. */
export function productionVars(): Record<string, string> {
  const config = parseJsonc(readFileSync(path.join(apiDir, 'wrangler.jsonc'), 'utf8')) as {
    vars?: Record<string, unknown>;
  };
  return Object.fromEntries(Object.entries(config.vars ?? {}).map(([k, v]) => [k, String(v)]));
}

/** Variáveis de `.dev.vars` (as que o `wrangler dev` usa); vazio se o arquivo não existir. */
export function devVars(): Record<string, string> {
  const file = path.join(apiDir, '.dev.vars');
  if (!existsSync(file)) return {};
  const entries = readFileSync(file, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const at = line.indexOf('=');
      const value = line.slice(at + 1).trim();
      return [line.slice(0, at).trim(), value.replace(/^(["'])(.*)\1$/, '$2')] as const;
    });
  return Object.fromEntries(entries);
}
