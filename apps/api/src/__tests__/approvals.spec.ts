import { addDays, APP_TIMEZONE, BATCH_UNDO_WINDOW_MS, todayIso } from '@nacif/shared';
import { describe, expect, it } from 'vitest';
import { db } from '../infra/prisma/client';
import { approvalsService } from '../modules/disponibilidade/approvals/approvals.service';
import { buildTestApp } from '../test/app';
import { loginAs } from '../test/auth';
import { createCommunication, seedTeam } from '../test/factories';

const today = todayIso(APP_TIMEZONE);
const start = addDays(today, 14);
const end = addDays(start, 2);

async function scenario() {
  const team = await seedTeam();
  const { marina, caio, julia, pedro, orion, atlas } = team;
  const forMarina = await createCommunication({
    authorId: pedro.id,
    projectId: orion.id,
    coverId: julia.id,
    approverId: marina.id,
    startDate: start,
    endDate: end,
  });
  const forCaio = await createCommunication({
    authorId: julia.id,
    projectId: atlas.id,
    coverId: pedro.id,
    approverId: caio.id,
    startDate: start,
    endDate: end,
  });
  const forMarina2 = await createCommunication({
    authorId: julia.id,
    projectId: atlas.id,
    coverId: pedro.id,
    approverId: marina.id,
    startDate: addDays(start, 7),
    endDate: addDays(end, 7),
  });
  return { ...team, forMarina, forCaio, forMarina2 };
}

describe('approvals', () => {
  it('aprovador vê só a própria fila; admin vê todas; membro recebe 403', async () => {
    await scenario();
    const marina = buildTestApp();
    await loginAs(marina, 'marina@nacif.xyz');
    const mine = await marina.get('/api/disponibilidade/approvals');
    expect(mine.status).toBe(200);
    expect(mine.body.total).toBe(2);
    expect(mine.body.counts).toEqual({ inReview: 2, approved: 0, rejected: 0 });

    const caio = buildTestApp();
    await loginAs(caio, 'caio@nacif.xyz');
    expect((await caio.get('/api/disponibilidade/approvals')).body.total).toBe(3);

    const pedro = buildTestApp();
    await loginAs(pedro, 'pedro@nacif.xyz');
    expect((await pedro.get('/api/disponibilidade/approvals')).status).toBe(403);
  });

  it('aprova; aprovador não decide o que não é dele nem a própria', async () => {
    const { forMarina, forCaio } = await scenario();
    const marina = buildTestApp();
    await loginAs(marina, 'marina@nacif.xyz');
    const ok = await marina.post(`/api/disponibilidade/approvals/${forMarina.id}/approve`);
    expect(ok.status).toBe(200);
    expect(ok.body.status).toBe('APPROVED');
    expect(ok.body.decision).toMatchObject({
      type: 'APPROVED',
      decider: { name: 'Marina Duarte' },
    });
    expect((await marina.post(`/api/disponibilidade/approvals/${forCaio.id}/approve`)).status).toBe(
      403,
    );
    expect(
      (await marina.post(`/api/disponibilidade/approvals/${forMarina.id}/approve`)).status,
    ).toBe(409);
  });

  it('recusa exige 20 caracteres e notifica no fluxo', async () => {
    const { forMarina } = await scenario();
    const marina = buildTestApp();
    await loginAs(marina, 'marina@nacif.xyz');
    const short = await marina
      .post(`/api/disponibilidade/approvals/${forMarina.id}/reject`)
      .send({ justification: '1234567890123456789' });
    expect(short.status).toBe(422);
    expect(short.body.error.message).toBe('Informe uma justificativa com ao menos 20 caracteres.');
    const ok = await marina
      .post(`/api/disponibilidade/approvals/${forMarina.id}/reject`)
      .send({ justification: 'Coincide com a virada de release do Órion.' });
    expect(ok.status).toBe(200);
    expect(ok.body.status).toBe('REJECTED');
    expect(ok.body.decision.justification).toBe('Coincide com a virada de release do Órion.');
    expect(ok.body.flow.at(-1).description).toBe('Recusada por Marina Duarte');
  });

  it('aprovação em lote pula as não decidíveis e pode ser desfeita dentro da janela', async () => {
    const { forMarina, forMarina2, forCaio } = await scenario();
    const marina = buildTestApp();
    await loginAs(marina, 'marina@nacif.xyz');
    const batch = await marina
      .post('/api/disponibilidade/approvals/batch')
      .send({ communicationIds: [forMarina.id, forMarina2.id, forCaio.id] });
    expect(batch.status).toBe(200);
    expect(batch.body.approvedCount).toBe(2);
    expect(batch.body.skipped).toEqual([forCaio.id]);
    expect(await db.communication.count({ where: { status: 'APPROVED' } })).toBe(2);

    const other = buildTestApp();
    await loginAs(other, 'caio@nacif.xyz');
    expect(
      (await other.post(`/api/disponibilidade/approvals/batch/${batch.body.batchId}/undo`)).status,
    ).toBe(403);

    const undo = await marina.post(
      `/api/disponibilidade/approvals/batch/${batch.body.batchId}/undo`,
    );
    expect(undo.status).toBe(200);
    expect(undo.body.revertedCount).toBe(2);
    expect(await db.communication.count({ where: { status: 'IN_REVIEW' } })).toBe(3);
    expect(await db.decision.count({ where: { revertedAt: null } })).toBe(0);
    expect(
      (await marina.post(`/api/disponibilidade/approvals/batch/${batch.body.batchId}/undo`)).status,
    ).toBe(409);
  });

  it('undo fora da janela devolve UNDO_WINDOW_EXPIRED', async () => {
    const { marina, forMarina } = await scenario();
    const actor = { ...marina, project: null };
    const past = new Date(Date.now() - BATCH_UNDO_WINDOW_MS - 1000);
    const batch = await approvalsService.batchApprove(actor, [forMarina.id], past);
    await expect(approvalsService.undoBatch(actor, batch.batchId)).rejects.toMatchObject({
      code: 'UNDO_WINDOW_EXPIRED',
    });
  });

  it('calendário recorta períodos ao mês, ignora recusadas, canceladas e inativos, filtra por projeto', async () => {
    const { marina, caio, julia, pedro, thiago, orion, atlas } = await seedTeam();
    await createCommunication({
      authorId: pedro.id,
      projectId: orion.id,
      coverId: julia.id,
      approverId: marina.id,
      startDate: '2026-10-28',
      endDate: '2026-11-03',
      status: 'APPROVED',
    });
    await createCommunication({
      authorId: julia.id,
      projectId: atlas.id,
      coverId: pedro.id,
      approverId: caio.id,
      startDate: '2026-10-05',
      endDate: '2026-10-09',
    });
    await createCommunication({
      authorId: julia.id,
      projectId: atlas.id,
      coverId: pedro.id,
      approverId: caio.id,
      startDate: '2026-10-12',
      endDate: '2026-10-13',
      status: 'REJECTED',
    });
    await createCommunication({
      authorId: thiago.id,
      projectId: atlas.id,
      coverId: pedro.id,
      approverId: caio.id,
      startDate: '2026-10-13',
      endDate: '2026-10-15',
      status: 'APPROVED',
    });

    const agent = buildTestApp();
    await loginAs(agent, 'pedro@nacif.xyz');
    const res = await agent.get('/api/disponibilidade/calendar?month=2026-10');
    expect(res.status).toBe(200);
    expect(res.body.days).toHaveLength(31);
    expect(res.body.days[2]).toEqual({ date: '2026-10-03', weekend: true });
    const names = res.body.rows.map((r: { user: { name: string } }) => r.user.name);
    expect(names).not.toContain('Thiago Lemos');
    const pedroRow = res.body.rows.find(
      (r: { user: { name: string } }) => r.user.name === 'Pedro Nakano',
    );
    expect(pedroRow.bars[0]).toMatchObject({
      status: 'APPROVED',
      clampedStart: '2026-10-28',
      clampedEnd: '2026-10-31',
      endDate: '2026-11-03',
    });
    const juliaRow = res.body.rows.find(
      (r: { user: { name: string } }) => r.user.name === 'Júlia Reis',
    );
    expect(juliaRow.bars).toHaveLength(1);
    expect(juliaRow.bars[0].status).toBe('IN_REVIEW');

    const filtered = await agent.get(
      `/api/disponibilidade/calendar?month=2026-10&projectId=${orion.id}`,
    );
    expect(
      filtered.body.rows.every((r: { project: { name: string } }) => r.project.name === 'Órion'),
    ).toBe(true);
  });

  it('settings: leitura por qualquer um, escrita só admin com aprovadores válidos', async () => {
    const { marina, pedro } = await seedTeam();
    const member = buildTestApp();
    await loginAs(member, 'pedro@nacif.xyz');
    const read = await member.get('/api/disponibilidade/settings');
    expect(read.body).toMatchObject({ minNoticeDays: 7, maxSimultaneousPerProject: 2 });
    expect(
      (
        await member
          .put('/api/disponibilidade/settings')
          .send({ minNoticeDays: 3, maxSimultaneousPerProject: 1, defaultApproverIds: [] })
      ).status,
    ).toBe(403);

    const admin = buildTestApp();
    await loginAs(admin, 'caio@nacif.xyz');
    expect(
      (
        await admin
          .put('/api/disponibilidade/settings')
          .send({ minNoticeDays: 3, maxSimultaneousPerProject: 1, defaultApproverIds: [pedro.id] })
      ).status,
    ).toBe(422);
    const ok = await admin
      .put('/api/disponibilidade/settings')
      .send({ minNoticeDays: 3, maxSimultaneousPerProject: 1, defaultApproverIds: [marina.id] });
    expect(ok.status).toBe(200);
    expect(ok.body.defaultApprovers).toEqual([{ id: marina.id, name: 'Marina Duarte' }]);
  });
});
