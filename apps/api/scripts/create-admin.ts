/**
 * Primeiro administrador (ou recuperação de acesso): cria a pessoa com papel ADMIN, ou promove a
 * existente, e gera um link de definição de senha. Único script que escreve no D1 remoto.
 *
 *   pnpm --filter @nacif/api create-admin <e-mail>          # D1 remoto (produção)
 *   pnpm --filter @nacif/api create-admin <e-mail> --local  # D1 local, para testar
 *
 * Tudo acontece por e-mail e num único `wrangler d1 execute`: rodar de novo não duplica a pessoa,
 * invalida os links anteriores e gera um novo. Ver `docs/deploy.md`.
 */
import { nacifEmailSchema } from '@nacif/shared';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { passwordSetupTokens, users } from '../src/db/schema';
import { generateToken, sha256 } from '../src/modules/core/auth/password';
import {
  provisionalName,
  SETUP_TOKEN_TTL_MS,
  setupPath,
} from '../src/modules/core/users/setup-link';
import { apiDir, d1Execute, literal, qb, toStatement, type D1Target } from './lib/sql';
import { devVars, productionVars } from './lib/wrangler-vars';

interface ExistingUser {
  name: string;
  role: string;
  active: number;
  has_password: number;
}

function usage(message?: string): never {
  if (message) console.error(message);
  console.error('Uso: pnpm --filter @nacif/api create-admin <e-mail> [--local]');
  process.exit(1);
}

function parseArgs(argv: string[]): { email: string; target: D1Target } {
  const flags = argv.filter((a) => a.startsWith('--'));
  const unknown = flags.filter((f) => f !== '--local' && f !== '--remote');
  if (unknown.length) usage(`Opção desconhecida: ${unknown.join(' ')}`);
  const positional = argv.filter((a) => !a.startsWith('--'));
  if (positional.length !== 1) usage();
  const parsed = nacifEmailSchema.safeParse(positional[0]);
  if (!parsed.success) usage(parsed.error.issues[0]?.message ?? 'E-mail inválido.');
  return { email: parsed.data, target: flags.includes('--local') ? 'local' : 'remote' };
}

/** `APP_URL` de produção vem das `vars` do wrangler.jsonc; a local, de `.dev.vars`. */
function appUrl(target: D1Target): string {
  if (target === 'local') return devVars().APP_URL ?? 'http://localhost:5173';
  const url = productionVars().APP_URL;
  if (!url) throw new Error('APP_URL não está nas vars do wrangler.jsonc.');
  return url;
}

function findExisting(target: D1Target, email: string): ExistingUser | null {
  const query = `select name, role, active, password_hash is not null as has_password from users where email = ${literal(email)}`;
  const output = d1Execute(target, ['--json', '--command', query], 'pipe');
  const results = JSON.parse(output) as { results: ExistingUser[] }[];
  return results[0]?.results[0] ?? null;
}

async function buildStatements(email: string, now: Date): Promise<{ token: string; sql: string }> {
  const token = generateToken(32);
  const tokenHash = await sha256(token);
  const expiresAt = new Date(now.getTime() + SETUP_TOKEN_TTL_MS);
  const byEmail = sql`(select ${users.id} from ${users} where ${users.email} = ${email})`;
  const statements = [
    toStatement(
      qb
        .insert(users)
        .values({
          id: crypto.randomUUID(),
          email,
          name: provisionalName(email),
          role: 'ADMIN',
          active: true,
          invitedAt: now,
        })
        .onConflictDoUpdate({
          target: users.email,
          set: { role: 'ADMIN', active: true, invitedAt: now, updatedAt: now },
        }),
    ),
    toStatement(
      qb
        .update(passwordSetupTokens)
        .set({ usedAt: now })
        .where(and(eq(passwordSetupTokens.userId, byEmail), isNull(passwordSetupTokens.usedAt))),
    ),
    // Colunas na ordem da tabela em `schema.ts`.
    toStatement(
      qb.insert(passwordSetupTokens).select(
        sql`select ${crypto.randomUUID()}, ${tokenHash}, ${users.id}, ${expiresAt.toISOString()}, null, ${now.toISOString()}
          from ${users} where ${users.email} = ${email}`,
      ),
    ),
  ];
  return { token, sql: `${statements.join('\n')}\n` };
}

const { email, target } = parseArgs(process.argv.slice(2));
const now = new Date();
const where = target === 'local' ? 'D1 local' : 'D1 remoto (produção)';

const existing = findExisting(target, email);
if (existing) {
  const state = [
    existing.role,
    existing.active ? 'ativo' : 'inativo',
    existing.has_password ? 'com senha' : 'sem senha',
  ].join(', ');
  console.log(`${email} já existe no ${where} (${state}): passa a ADMIN e ativo, nome mantido.`);
  if (existing.has_password) {
    console.log('A senha atual continua valendo até o link abaixo ser usado.');
  }
} else {
  console.log(
    `Criando ${email} como ADMIN no ${where} (nome provisório "${provisionalName(email)}").`,
  );
}

const { token, sql: script } = await buildStatements(email, now);
const file = path.join(apiDir, '.wrangler', 'create-admin.sql');
mkdirSync(path.dirname(file), { recursive: true });
writeFileSync(file, script);
try {
  d1Execute(target, ['--file', file, '--yes'], 'pipe');
} finally {
  rmSync(file, { force: true });
}

const days = Math.round(SETUP_TOKEN_TTL_MS / 86_400_000);
console.log(
  `\nLink de definição de senha (válido por ${days} dias, links anteriores invalidados):`,
);
console.log(`${appUrl(target)}${setupPath(token)}`);
