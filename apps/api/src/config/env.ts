import { z } from 'zod';

const configSchema = z.object({
  APP_ENV: z.enum(['development', 'test', 'production']).default('production'),
  APP_URL: z.string().url(),
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(30),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

export type Config = z.infer<typeof configSchema>;

const parsed = new WeakMap<object, Config>();

/** Valida as `vars` do Worker uma vez por objeto `env` (o mesmo em todas as requisições do isolate). */
export function parseConfig(bindings: Env): Config {
  let config = parsed.get(bindings);
  if (!config) {
    const result = configSchema.safeParse(bindings);
    if (!result.success) {
      const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      throw new Error(`Configuração inválida: ${issues}`);
    }
    config = result.data;
    parsed.set(bindings, config);
  }
  return config;
}

let current: Config | null = null;

/** Chamado no início de cada requisição (e no setup dos testes). */
export function bindConfig(bindings: Env): Config {
  current = parseConfig(bindings);
  return current;
}

/** Configuração da requisição atual. */
export function config(): Config {
  if (!current) throw new Error('Configuração não vinculada: chame bindConfig(env) antes.');
  return current;
}
