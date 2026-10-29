import type { MiddlewareHandler } from 'hono';
import type { z } from 'zod';
import type { AppContext, AppEnv } from './context';
import { AppError, ValidationError } from './errors';

interface Schemas<B, Q, P> {
  body?: z.ZodType<B>;
  query?: z.ZodType<Q>;
  params?: z.ZodType<P>;
}

export interface ValidatedInput<B = unknown, Q = unknown, P = unknown> {
  body: B;
  query: Q;
  params: P;
}

/** Lê o body como JSON. Vazio vira `{}`; JSON malformado vira 400. */
export async function readJsonBody(c: AppContext): Promise<unknown> {
  const text = await c.req.text();
  if (text.trim() === '') return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new AppError(400, 'VALIDATION_ERROR', 'JSON inválido.');
  }
}

/**
 * Valida body/query/params com zod e guarda o resultado em `c.get('input')`.
 * Erros viram 422 com a lista de campos.
 */
export function validate<B = unknown, Q = unknown, P = unknown>(
  schemas: Schemas<B, Q, P>,
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const issues: { path: string; message: string }[] = [];
    const raw: Record<keyof Schemas<B, Q, P>, unknown> = {
      body: schemas.body ? await readJsonBody(c) : undefined,
      query: c.req.query(),
      params: c.req.param(),
    };
    const input: ValidatedInput = { body: raw.body, query: raw.query, params: raw.params };

    for (const key of ['body', 'query', 'params'] as const) {
      const schema = schemas[key];
      if (!schema) continue;
      const result = schema.safeParse(raw[key]);
      if (result.success) {
        input[key] = result.data;
      } else {
        for (const issue of result.error.issues) {
          issues.push({ path: [key, ...issue.path].join('.'), message: issue.message });
        }
      }
    }
    if (issues.length > 0) {
      throw new ValidationError(issues[0]?.message ?? 'Dados inválidos.', issues);
    }
    c.set('input', input);
    await next();
  };
}

export function getInput<B = unknown, Q = unknown, P = unknown>(
  c: AppContext,
): ValidatedInput<B, Q, P> {
  return c.get('input') as ValidatedInput<B, Q, P>;
}
