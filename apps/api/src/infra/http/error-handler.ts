import type { ApiErrorBody } from '@nacif/shared';
import type { ErrorHandler, NotFoundHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ZodError } from 'zod';
import { uniqueViolation } from '../../db/errors';
import { logger } from '../logger';
import type { AppEnv } from './context';
import { AppError } from './errors';

export const notFound: NotFoundHandler<AppEnv> = (c) => {
  const body: ApiErrorBody = { error: { code: 'NOT_FOUND', message: 'Rota não encontrada.' } };
  return c.json(body, 404);
};

export const onError: ErrorHandler<AppEnv> = (err, c) => {
  if (err instanceof AppError) {
    const body: ApiErrorBody = {
      error: { code: err.code, message: err.message, details: err.details },
    };
    return c.json(body, err.status as ContentfulStatusCode);
  }
  const constraint = uniqueViolation(err);
  if (constraint) {
    const body: ApiErrorBody = {
      error: { code: 'CONFLICT', message: 'Registro duplicado.', details: { constraint } },
    };
    return c.json(body, 409);
  }
  if (err instanceof ZodError) {
    const body: ApiErrorBody = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dados inválidos.',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    };
    return c.json(body, 422);
  }
  if (err instanceof HTTPException) {
    const body: ApiErrorBody = {
      error: {
        code: err.status >= 500 ? 'INTERNAL' : 'VALIDATION_ERROR',
        message: err.message || 'Requisição inválida.',
      },
    };
    return c.json(body, err.status);
  }
  logger.error({ err }, 'Erro não tratado');
  const body: ApiErrorBody = { error: { code: 'INTERNAL', message: 'Erro interno.' } };
  return c.json(body, 500);
};
