import { addDays, APP_TIMEZONE, todayIso } from '@nacif/shared';
import { and, eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { decisions, flowEvents } from '../db/schema';
import { approvalsService } from '../modules/disponibilidade/approvals/approvals.service';
import { communicationsService } from '../modules/disponibilidade/communications/communications.service';
import { countRows } from '../test/db';
import { createCommunication, seedTeam } from '../test/factories';

/**
 * Sem transação interativa no D1, cada escrita composta é um batch com guard no UPDATE.
 * Estes testes garantem que a requisição que perde a corrida não deixa linhas órfãs.
 */
describe('corridas em decisões', () => {
  async function pending() {
    const team = await seedTeam();
    const start = addDays(todayIso(APP_TIMEZONE), 10);
    const row = await createCommunication({
      authorId: team.pedro.id,
      projectId: team.orion.id,
      coverId: team.marina.id,
      approverId: team.caio.id,
      startDate: start,
      endDate: addDays(start, 2),
    });
    return { ...team, row };
  }

  it('duas aprovações simultâneas: uma vence, a outra recebe 409 e nada fica duplicado', async () => {
    const { caio, row } = await pending();
    const results = await Promise.allSettled([
      approvalsService.approve(caio, row.id),
      approvalsService.approve(caio, row.id),
    ]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(await countRows(decisions, eq(decisions.communicationId, row.id))).toBe(1);
    expect(
      await countRows(
        flowEvents,
        and(eq(flowEvents.communicationId, row.id), eq(flowEvents.type, 'DECISION')),
      ),
    ).toBe(1);
  });

  it('cancelamento e aprovação simultâneos: só um dos dois efeitos fica registrado', async () => {
    const { caio, pedro, row } = await pending();
    const results = await Promise.allSettled([
      communicationsService.cancel(pedro, row.id),
      approvalsService.approve(caio, row.id),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const decisionCount = await countRows(decisions, eq(decisions.communicationId, row.id));
    const cancelledEvents = await countRows(
      flowEvents,
      and(eq(flowEvents.communicationId, row.id), eq(flowEvents.type, 'CANCELLED')),
    );
    const decisionEvents = await countRows(
      flowEvents,
      and(eq(flowEvents.communicationId, row.id), eq(flowEvents.type, 'DECISION')),
    );
    expect(decisionCount + cancelledEvents).toBe(1);
    expect(decisionEvents).toBe(decisionCount);
  });

  it('desfazer o mesmo lote duas vezes reverte uma única vez', async () => {
    const { caio, row } = await pending();
    const batch = await approvalsService.batchApprove(caio, [row.id]);
    const results = await Promise.allSettled([
      approvalsService.undoBatch(caio, batch.batchId),
      approvalsService.undoBatch(caio, batch.batchId),
    ]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    expect(fulfilled).toHaveLength(1);
    expect(
      await countRows(
        flowEvents,
        and(eq(flowEvents.communicationId, row.id), eq(flowEvents.type, 'DECISION_REVERTED')),
      ),
    ).toBe(1);
  });
});
