import { formatCommunicationCode } from '@nacif/shared';
import { sql } from 'drizzle-orm';
import { db } from '../../../db/client';
import { communicationCounters } from '../../../db/schema';
import { communicationsRepository } from './communications.repository';

const MAX_ATTEMPTS = 50;

/**
 * Incrementa o contador do ano num único statement atômico (upsert + RETURNING) e devolve o código.
 * Se o código já existir (contador defasado por seed/importação), avança até um livre.
 * A corrida entre duas requisições é resolvida pelo unique de `(year, sequence)`/`code` na inserção.
 */
export async function allocateCode(year: number): Promise<{ code: string; sequence: number }> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const [counter] = await db()
      .insert(communicationCounters)
      .values({ year, lastSequence: 1 })
      .onConflictDoUpdate({
        target: communicationCounters.year,
        set: { lastSequence: sql`${communicationCounters.lastSequence} + 1` },
      })
      .returning();
    if (!counter) throw new Error(`Contador de ${year} não devolveu a sequência`);
    const code = formatCommunicationCode(year, counter.lastSequence);
    const taken = await communicationsRepository.findByCode(code);
    if (!taken) return { code, sequence: counter.lastSequence };
  }
  throw new Error(`Não foi possível alocar um código para ${year}`);
}
