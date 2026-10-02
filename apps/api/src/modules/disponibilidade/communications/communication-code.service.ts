import { formatCommunicationCode } from '@nacif/shared';
import type { Tx } from '../../../infra/prisma/client';

const MAX_ATTEMPTS = 50;

/**
 * Incrementa o contador do ano de forma atômica dentro da transação e devolve o código.
 * Se o código já existir (contador defasado por seed/importação), avança até um livre.
 */
export async function allocateCode(
  tx: Tx,
  year: number,
): Promise<{ code: string; sequence: number }> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const counter = await tx.communicationCounter.upsert({
      where: { year },
      create: { year, lastSequence: 1 },
      update: { lastSequence: { increment: 1 } },
    });
    const code = formatCommunicationCode(year, counter.lastSequence);
    const taken = await tx.communication.findUnique({ where: { code }, select: { id: true } });
    if (!taken) return { code, sequence: counter.lastSequence };
  }
  throw new Error(`Não foi possível alocar um código para ${year}`);
}
