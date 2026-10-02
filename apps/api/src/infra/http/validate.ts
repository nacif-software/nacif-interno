import type { RequestHandler } from 'express';
import type { z } from 'zod';
import { ValidationError } from './errors';

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

/**
 * Valida body/query/params com zod e guarda o resultado em `res.locals.input`.
 * Erros viram 422 com a lista de campos.
 */
export function validate<B = unknown, Q = unknown, P = unknown>(
  schemas: Schemas<B, Q, P>,
): RequestHandler {
  return (req, res, next) => {
    const issues: { path: string; message: string }[] = [];
    const input: ValidatedInput = { body: req.body, query: req.query, params: req.params };

    for (const key of ['body', 'query', 'params'] as const) {
      const schema = schemas[key];
      if (!schema) continue;
      const result = schema.safeParse(req[key]);
      if (result.success) {
        input[key] = result.data;
      } else {
        for (const issue of result.error.issues) {
          issues.push({ path: [key, ...issue.path].join('.'), message: issue.message });
        }
      }
    }
    if (issues.length > 0) {
      next(new ValidationError(issues[0]?.message ?? 'Dados inválidos.', issues));
      return;
    }
    res.locals.input = input;
    next();
  };
}

export function getInput<B = unknown, Q = unknown, P = unknown>(res: {
  locals: Record<string, unknown>;
}): ValidatedInput<B, Q, P> {
  return res.locals.input as ValidatedInput<B, Q, P>;
}
