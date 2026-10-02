import type { ApiErrorBody } from '@nacif/shared';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '../../generated/prisma/client';
import { logger } from '../logger';
import { AppError } from './errors';

export const notFoundHandler: RequestHandler = (_req, res) => {
  const body: ApiErrorBody = { error: { code: 'NOT_FOUND', message: 'Rota não encontrada.' } };
  res.status(404).json(body);
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    const body: ApiErrorBody = {
      error: { code: err.code, message: err.message, details: err.details },
    };
    res.status(err.status).json(body);
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    const body: ApiErrorBody = {
      error: { code: 'CONFLICT', message: 'Registro duplicado.', details: err.meta },
    };
    res.status(409).json(body);
    return;
  }
  if (err instanceof ZodError) {
    const body: ApiErrorBody = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dados inválidos.',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    };
    res.status(422).json(body);
    return;
  }
  if (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    (err as { type?: string }).type === 'entity.parse.failed'
  ) {
    const body: ApiErrorBody = { error: { code: 'VALIDATION_ERROR', message: 'JSON inválido.' } };
    res.status(400).json(body);
    return;
  }
  logger.error({ err }, 'Erro não tratado');
  const body: ApiErrorBody = { error: { code: 'INTERNAL', message: 'Erro interno.' } };
  res.status(500).json(body);
};
