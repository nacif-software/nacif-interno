import { logger } from '../logger';

type WaitUntil = (task: Promise<unknown>) => void;

let waitUntil: WaitUntil | null = null;
const pending = new Set<Promise<unknown>>();

/**
 * Vincula o `waitUntil` do Worker (requisição ou cron). Fora do Workers (testes, scripts) fica
 * null e as tarefas rodam soltas, com `drainBackground()` para esperá-las.
 */
export function bindBackground(fn: WaitUntil | null): void {
  waitUntil = fn;
}

/** Agenda uma tarefa para depois da resposta (ex.: enviar push). Erros só vão para o log. */
export function background(task: Promise<unknown>): void {
  const safe = task.catch((err: unknown) =>
    logger.error({ err }, 'Tarefa em segundo plano falhou'),
  );
  if (waitUntil) {
    waitUntil(safe);
    return;
  }
  pending.add(safe);
  void safe.finally(() => pending.delete(safe));
}

/** Espera as tarefas soltas terminarem (testes). */
export async function drainBackground(): Promise<void> {
  while (pending.size > 0) await Promise.all([...pending]);
}
