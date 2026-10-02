import { addDays, APP_TIMEZONE, todayIso } from '@nacif/shared';
import { describe, expect, it } from 'vitest';
import { db } from '../infra/prisma/client';
import { buildTestApp } from '../test/app';
import { loginAs } from '../test/auth';
import { createCommunication, seedTeam } from '../test/factories';

const today = todayIso(APP_TIMEZONE);
/** Próxima segunda-feira com pelo menos 7 dias de antecedência. */
function nextMonday(minDays: number): string {
  let d = addDays(today, minDays);
  while (new Date(`${d}T00:00:00Z`).getUTCDay() !== 1) d = addDays(d, 1);
  return d;
}
const monday = nextMonday(7);
const friday = addDays(monday, 4);

describe('communications', () => {
  it('cria em análise com código sequencial e dois eventos no mesmo instante', async () => {
    const { caio, julia, pedro } = await seedTeam();
    const agent = buildTestApp();
    await loginAs(agent, 'pedro@nacif.xyz');
    const res = await agent.post('/api/disponibilidade/communications').send({
      startDate: monday,
      endDate: friday,
      coverId: julia.id,
      approverId: caio.id,
      notes: 'Handoff documentado.',
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      code: `${today.slice(0, 4)}-0001`,
      status: 'IN_REVIEW',
      businessDays: 5,
      author: { id: pedro.id },
      permissions: { canCancel: true, canEditPeriod: true, canDecide: false },
    });
    expect(res.body.flow.map((e: { type: string }) => e.type)).toEqual(['SUBMITTED', 'IN_REVIEW']);
    expect(res.body.flow[0].occurredAt).toBe(res.body.flow[1].occurredAt);
    expect(res.body.flow[1].description).toBe('Encaminhada a Caio Bertelli');

    const second = await agent.post('/api/disponibilidade/communications').send({
      startDate: addDays(monday, 14),
      endDate: addDays(friday, 14),
      coverId: julia.id,
      approverId: caio.id,
    });
    expect(second.body.code).toBe(`${today.slice(0, 4)}-0002`);
  });

  it('rejeita antecedência insuficiente, cobertura = autor e período sem dia útil', async () => {
    const { caio, julia, pedro } = await seedTeam();
    const agent = buildTestApp();
    await loginAs(agent, 'pedro@nacif.xyz');
    const base = { coverId: julia.id, approverId: caio.id };

    const soon = await agent
      .post('/api/disponibilidade/communications')
      .send({ ...base, startDate: addDays(today, 6), endDate: addDays(today, 6) });
    expect(soon.status).toBe(422);
    expect(soon.body.error.message).toBe('O início deve ser pelo menos 7 dias após hoje.');

    const self = await agent
      .post('/api/disponibilidade/communications')
      .send({ ...base, coverId: pedro.id, startDate: monday, endDate: friday });
    expect(self.status).toBe(422);

    const weekend = await agent
      .post('/api/disponibilidade/communications')
      .send({ ...base, startDate: addDays(monday, 5), endDate: addDays(monday, 6) });
    expect(weekend.status).toBe(422);
  });

  it('sinaliza conflito com aprovada de outra pessoa no mesmo projeto e registra no fluxo', async () => {
    const { caio, marina, julia, pedro, orion } = await seedTeam();
    await createCommunication({
      authorId: marina.id,
      projectId: orion.id,
      coverId: pedro.id,
      approverId: caio.id,
      startDate: addDays(monday, 1),
      endDate: addDays(monday, 3),
      status: 'APPROVED',
    });
    const agent = buildTestApp();
    await loginAs(agent, 'pedro@nacif.xyz');

    const preview = await agent
      .get('/api/disponibilidade/communications/conflicts')
      .query({ startDate: monday, endDate: friday });
    expect(preview.status).toBe(200);
    expect(preview.body.conflicts).toHaveLength(1);
    expect(preview.body.conflicts[0].name).toBe('Marina Duarte');
    expect(preview.body.limitReached).toBe(false);
    expect(preview.body.projectName).toBe('Órion');

    const res = await agent
      .post('/api/disponibilidade/communications')
      .send({ startDate: monday, endDate: friday, coverId: julia.id, approverId: caio.id });
    expect(res.status).toBe(201);
    expect(res.body.conflicts).toHaveLength(1);
    const inReview = res.body.flow.find((e: { type: string }) => e.type === 'IN_REVIEW');
    expect(inReview.metadata.conflictNotes[0]).toMatch(/^Conflito sinalizado com Marina Duarte \(/);
  });

  it('detalhe por código; não-autor sem relação recebe 403; aprovador e admin podem ver', async () => {
    const { caio, marina, julia, pedro, orion } = await seedTeam();
    const c = await createCommunication({
      authorId: pedro.id,
      projectId: orion.id,
      coverId: julia.id,
      approverId: marina.id,
      startDate: monday,
      endDate: friday,
    });

    const author = buildTestApp();
    await loginAs(author, 'pedro@nacif.xyz');
    expect((await author.get(`/api/disponibilidade/communications/${c.code}`)).status).toBe(200);
    expect((await author.get(`/api/disponibilidade/communications/%23${c.code}`)).status).toBe(200);

    const other = buildTestApp();
    await loginAs(other, 'julia@nacif.xyz');
    expect((await other.get(`/api/disponibilidade/communications/${c.id}`)).status).toBe(403);

    const approver = buildTestApp();
    await loginAs(approver, 'marina@nacif.xyz');
    const asApprover = await approver.get(`/api/disponibilidade/communications/${c.id}`);
    expect(asApprover.body.permissions.canDecide).toBe(true);

    const admin = buildTestApp();
    await loginAs(admin, 'caio@nacif.xyz');
    expect((await admin.get(`/api/disponibilidade/communications/${c.id}`)).status).toBe(200);
    expect(caio.role).toBe('ADMIN');
  });

  it('edita período mantendo o código e cancela em análise; não-autor recebe 403', async () => {
    const { marina, julia, pedro, orion } = await seedTeam();
    const c = await createCommunication({
      authorId: pedro.id,
      projectId: orion.id,
      coverId: julia.id,
      approverId: marina.id,
      startDate: monday,
      endDate: friday,
    });
    const author = buildTestApp();
    await loginAs(author, 'pedro@nacif.xyz');

    const edited = await author
      .patch(`/api/disponibilidade/communications/${c.id}/period`)
      .send({ startDate: addDays(monday, 7), endDate: addDays(monday, 8) });
    expect(edited.status).toBe(200);
    expect(edited.body.code).toBe(c.code);
    expect(edited.body.businessDays).toBe(2);
    expect(edited.body.flow.map((e: { type: string }) => e.type)).toEqual([
      'SUBMITTED',
      'IN_REVIEW',
      'EDITED',
      'IN_REVIEW',
    ]);

    const other = buildTestApp();
    await loginAs(other, 'marina@nacif.xyz');
    expect((await other.post(`/api/disponibilidade/communications/${c.id}/cancel`)).status).toBe(
      403,
    );

    const cancelled = await author.post(`/api/disponibilidade/communications/${c.id}/cancel`);
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.status).toBe('CANCELLED');
    expect(cancelled.body.permissions).toEqual({
      canCancel: false,
      canEditPeriod: false,
      canDecide: false,
    });
    expect((await author.post(`/api/disponibilidade/communications/${c.id}/cancel`)).status).toBe(
      409,
    );
    expect(await db.flowEvent.count({ where: { communicationId: c.id, type: 'CANCELLED' } })).toBe(
      1,
    );
  });

  it('lista minhas comunicações paginadas e dashboard com métricas', async () => {
    const { marina, julia, pedro, orion } = await seedTeam();
    await createCommunication({
      authorId: pedro.id,
      projectId: orion.id,
      coverId: julia.id,
      approverId: marina.id,
      startDate: monday,
      endDate: friday,
      status: 'APPROVED',
    });
    await createCommunication({
      authorId: pedro.id,
      projectId: orion.id,
      coverId: julia.id,
      approverId: marina.id,
      startDate: addDays(monday, 14),
      endDate: addDays(monday, 15),
    });
    await createCommunication({
      authorId: julia.id,
      projectId: orion.id,
      coverId: pedro.id,
      approverId: marina.id,
      startDate: monday,
      endDate: friday,
    });

    const agent = buildTestApp();
    await loginAs(agent, 'pedro@nacif.xyz');
    const list = await agent.get('/api/disponibilidade/communications?pageSize=1');
    expect(list.body.total).toBe(2);
    expect(list.body.items).toHaveLength(1);

    const dash = await agent.get('/api/disponibilidade/dashboard');
    expect(dash.status).toBe(200);
    expect(dash.body.daysCommunicatedInYear).toBe(7);
    expect(dash.body.inReviewCount).toBe(1);
    expect(dash.body.inReviewApproverName).toBe('Marina Duarte');
    expect(dash.body.nextUnavailability.startDate).toBe(monday);
    expect(dash.body.recent).toHaveLength(2);
  });
});
