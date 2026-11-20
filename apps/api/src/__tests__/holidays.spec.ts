import { addDays, APP_TIMEZONE, MESSAGES, todayIso } from '@nacif/shared';
import { describe, expect, it } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { communications, flowEvents, holidays } from '../db/schema';
import { recountService } from '../modules/disponibilidade/holidays/recount.service';
import { buildTestApp } from '../test/app';
import { loginAs } from '../test/auth';
import { countRows } from '../test/db';
import { createCommunication, createHoliday, seedTeam } from '../test/factories';

const today = todayIso(APP_TIMEZONE);
/** Próxima segunda-feira com pelo menos `minDays` de antecedência. */
function nextMonday(minDays: number): string {
  let d = addDays(today, minDays);
  while (new Date(`${d}T00:00:00Z`).getUTCDay() !== 1) d = addDays(d, 1);
  return d;
}

describe('feriados', () => {
  it('qualquer pessoa autenticada lista, em ordem de data', async () => {
    await seedTeam();
    await createHoliday({ date: '2026-12-25', name: 'Natal' });
    await createHoliday({ date: '2026-11-20', name: 'Dia da Consciência Negra' });
    const agent = buildTestApp();
    await loginAs(agent, 'pedro@nacif.xyz');
    const res = await agent.get('/api/disponibilidade/holidays');
    expect(res.status).toBe(200);
    expect(res.body.map((h: { date: string }) => h.date)).toEqual(['2026-11-20', '2026-12-25']);
    expect(res.body[0]).toMatchObject({ name: 'Dia da Consciência Negra' });
  });

  it('só administrador cria e remove', async () => {
    await seedTeam();
    const member = buildTestApp();
    await loginAs(member, 'pedro@nacif.xyz');
    const denied = await member
      .post('/api/disponibilidade/holidays')
      .send({ date: '2026-12-25', name: 'Natal' });
    expect(denied.status).toBe(403);

    const admin = buildTestApp();
    await loginAs(admin, 'caio@nacif.xyz');
    const created = await admin
      .post('/api/disponibilidade/holidays')
      .send({ date: '2026-12-25', name: 'Natal' });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ date: '2026-12-25', name: 'Natal' });

    const removed = await admin.delete(`/api/disponibilidade/holidays/${created.body.id}`);
    expect(removed.status).toBe(204);
    expect(await countRows(holidays)).toBe(0);
  });

  it('protege as rotas: anônimo 401, membro não remove (403), corpo inválido 422', async () => {
    await seedTeam();
    const holiday = await createHoliday({ date: '2026-12-25', name: 'Natal' });
    const anon = buildTestApp();
    expect((await anon.get('/api/disponibilidade/holidays')).status).toBe(401);

    const member = buildTestApp();
    await loginAs(member, 'pedro@nacif.xyz');
    expect((await member.delete(`/api/disponibilidade/holidays/${holiday.id}`)).status).toBe(403);

    const admin = buildTestApp();
    await loginAs(admin, 'caio@nacif.xyz');
    const invalid = await admin
      .post('/api/disponibilidade/holidays')
      .send({ date: '2026-13-01', name: 'X' });
    expect(invalid.status).toBe(422);
    expect(await countRows(holidays)).toBe(1);
  });

  it('data repetida devolve 409 e id inexistente devolve 404', async () => {
    await seedTeam();
    await createHoliday({ date: '2026-12-25', name: 'Natal' });
    const admin = buildTestApp();
    await loginAs(admin, 'caio@nacif.xyz');
    const dup = await admin
      .post('/api/disponibilidade/holidays')
      .send({ date: '2026-12-25', name: 'Outro' });
    expect(dup.status).toBe(409);
    expect(dup.body.error).toMatchObject({ code: 'CONFLICT', message: MESSAGES.holidayExists });

    const missing = await admin.delete('/api/disponibilidade/holidays/nao-existe');
    expect(missing.status).toBe(404);
  });

  it('comunicação desconta o feriado ao criar e ao editar o período', async () => {
    const { caio, julia } = await seedTeam();
    const monday = nextMonday(14);
    await createHoliday({ date: addDays(monday, 2) });
    const agent = buildTestApp();
    await loginAs(agent, 'pedro@nacif.xyz');
    const created = await agent.post('/api/disponibilidade/communications').send({
      startDate: monday,
      endDate: addDays(monday, 4),
      coverId: julia.id,
      approverId: caio.id,
    });
    expect(created.status).toBe(201);
    expect(created.body.businessDays).toBe(4);

    const next = addDays(monday, 7);
    await createHoliday({ date: next });
    const edited = await agent
      .patch(`/api/disponibilidade/communications/${created.body.id}/period`)
      .send({ startDate: next, endDate: addDays(next, 4) });
    expect(edited.status).toBe(200);
    expect(edited.body.businessDays).toBe(4);
  });

  it('período só com feriado é recusado', async () => {
    const { caio, julia } = await seedTeam();
    const monday = nextMonday(14);
    await createHoliday({ date: monday });
    const agent = buildTestApp();
    await loginAs(agent, 'pedro@nacif.xyz');
    const res = await agent.post('/api/disponibilidade/communications').send({
      startDate: monday,
      endDate: monday,
      coverId: julia.id,
      approverId: caio.id,
    });
    expect(res.status).toBe(422);
    expect(res.body.error.message).toBe(MESSAGES.noBusinessDays);
  });

  it('calendário do time traz o nome do feriado no dia', async () => {
    await seedTeam();
    const monday = nextMonday(14);
    await createHoliday({ date: monday, name: 'Recesso Nacif' });
    const agent = buildTestApp();
    await loginAs(agent, 'pedro@nacif.xyz');
    const res = await agent
      .get('/api/disponibilidade/calendar')
      .query({ month: monday.slice(0, 7) });
    expect(res.status).toBe(200);
    const day = res.body.days.find((d: { date: string }) => d.date === monday);
    expect(day.holiday).toBe('Recesso Nacif');
    const others = res.body.days.filter((d: { date: string }) => d.date !== monday);
    expect(others.every((d: { holiday: string | null }) => d.holiday === null)).toBe(true);
  });

  describe('recontagem das comunicações que ainda não começaram', () => {
    async function reload(id: string) {
      const row = await db().query.communications.findFirst({ where: eq(communications.id, id) });
      if (!row) throw new Error('sumiu');
      return row;
    }
    async function recountEvents(id: string) {
      return countRows(
        flowEvents,
        and(eq(flowEvents.communicationId, id), eq(flowEvents.type, 'EDITED')),
      );
    }

    it('feriado novo reconta aprovada futura sem ajuste e registra o evento', async () => {
      const { caio, pedro } = await seedTeam();
      const monday = nextMonday(14);
      const c = await createCommunication({
        authorId: pedro.id,
        approverId: caio.id,
        startDate: monday,
        endDate: addDays(monday, 4),
        status: 'APPROVED',
      });
      const admin = buildTestApp();
      await loginAs(admin, 'caio@nacif.xyz');
      const created = await admin
        .post('/api/disponibilidade/holidays')
        .send({ date: addDays(monday, 1), name: 'Feriado' });
      expect(created.status).toBe(201);

      const after = await reload(c.id);
      expect(after.businessDays).toBe(4);
      expect(after.deductedDays).toBe(4);
      const [event] = await db()
        .select()
        .from(flowEvents)
        .where(and(eq(flowEvents.communicationId, c.id), eq(flowEvents.type, 'EDITED')));
      expect(event?.actorId).toBeNull();
      expect(event?.description).toBe(MESSAGES.holidayRecountEvent(5, 4));
      expect(event?.metadata).toEqual({ recount: { previousBusinessDays: 5, businessDays: 4 } });

      const removed = await admin.delete(`/api/disponibilidade/holidays/${created.body.id}`);
      expect(removed.status).toBe(204);
      const restored = await reload(c.id);
      expect(restored.businessDays).toBe(5);
      expect(restored.deductedDays).toBe(5);
    });

    it('preserva o desconto ajustado pelo aprovador', async () => {
      const { caio, pedro } = await seedTeam();
      const monday = nextMonday(14);
      const c = await createCommunication({
        authorId: pedro.id,
        approverId: caio.id,
        startDate: monday,
        endDate: addDays(monday, 4),
        status: 'APPROVED',
        deductedDays: 2,
      });
      await createHoliday({ date: addDays(monday, 1) });
      await recountService.recountUpcoming();
      const after = await reload(c.id);
      expect(after.businessDays).toBe(4);
      expect(after.deductedDays).toBe(2);
    });

    it('não mexe em comunicação que já começou', async () => {
      const { caio, pedro } = await seedTeam();
      const c = await createCommunication({
        authorId: pedro.id,
        approverId: caio.id,
        startDate: addDays(today, -3),
        endDate: addDays(today, 10),
        status: 'APPROVED',
      });
      const before = await reload(c.id);
      await createHoliday({ date: nextMonday(1) });
      await recountService.recountUpcoming();
      const after = await reload(c.id);
      expect(after.businessDays).toBe(before.businessDays);
      expect(await recountEvents(c.id)).toBe(0);
    });

    it('ajuste do aprovador sobrevive a feriado adicionado e depois removido', async () => {
      const { caio, pedro } = await seedTeam();
      const monday = nextMonday(14);
      const c = await createCommunication({
        authorId: pedro.id,
        approverId: caio.id,
        startDate: monday,
        endDate: addDays(monday, 4),
      });
      const admin = buildTestApp();
      await loginAs(admin, 'caio@nacif.xyz');
      const approved = await admin
        .post(`/api/disponibilidade/approvals/${c.id}/approve`)
        .send({ deductedDays: 4, deductionNote: 'Um dia trabalhado no período.' });
      expect(approved.status).toBe(200);

      const holiday = await admin
        .post('/api/disponibilidade/holidays')
        .send({ date: addDays(monday, 1), name: 'Feriado' });
      expect((await reload(c.id)).deductedDays).toBe(4);
      await admin.delete(`/api/disponibilidade/holidays/${holiday.body.id}`);
      const after = await reload(c.id);
      expect(after.businessDays).toBe(5);
      expect(after.deductedDays).toBe(4);
    });

    it('reconta período que começa hoje (o cron das 00:00 alcança quem começa no dia)', async () => {
      const { caio, pedro } = await seedTeam();
      const c = await createCommunication({
        authorId: pedro.id,
        approverId: caio.id,
        startDate: today,
        endDate: addDays(today, 6),
        status: 'APPROVED',
      });
      const before = (await reload(c.id)).businessDays;
      let weekday = addDays(today, 1);
      while ([0, 6].includes(new Date(`${weekday}T00:00:00Z`).getUTCDay()))
        weekday = addDays(weekday, 1);
      await createHoliday({ date: weekday });
      await recountService.recountUpcoming();
      expect((await reload(c.id)).businessDays).toBe(before - 1);
    });

    it('dois feriados adicionados ao mesmo tempo no mesmo período descontam os dois', async () => {
      const { caio, pedro } = await seedTeam();
      const monday = nextMonday(14);
      const c = await createCommunication({
        authorId: pedro.id,
        approverId: caio.id,
        startDate: monday,
        endDate: addDays(monday, 4),
        status: 'APPROVED',
      });
      const admin = buildTestApp();
      await loginAs(admin, 'caio@nacif.xyz');
      const [a, b] = await Promise.all([
        admin.post('/api/disponibilidade/holidays').send({ date: monday, name: 'Um' }),
        admin
          .post('/api/disponibilidade/holidays')
          .send({ date: addDays(monday, 1), name: 'Dois' }),
      ]);
      expect([a.status, b.status]).toEqual([201, 201]);
      const after = await reload(c.id);
      expect(after.businessDays).toBe(3);
      expect(after.deductedDays).toBe(3);
    });

    it('reconta mais de 100 aprovadas sem estourar o limite de parâmetros do D1', async () => {
      const { caio, pedro } = await seedTeam();
      const monday = nextMonday(14);
      for (let i = 0; i < 105; i++) {
        await createCommunication({
          authorId: pedro.id,
          approverId: caio.id,
          startDate: monday,
          endDate: addDays(monday, 4),
          status: 'APPROVED',
        });
      }
      await createHoliday({ date: monday });
      expect(await recountService.recountUpcoming()).toEqual({ recounted: 105 });
    });

    it('duas recontagens simultâneas registram um evento só', async () => {
      const { caio, pedro } = await seedTeam();
      const monday = nextMonday(14);
      const c = await createCommunication({
        authorId: pedro.id,
        approverId: caio.id,
        startDate: monday,
        endDate: addDays(monday, 4),
        status: 'APPROVED',
      });
      await createHoliday({ date: monday });
      await Promise.all([recountService.recountUpcoming(), recountService.recountUpcoming()]);
      expect((await reload(c.id)).businessDays).toBe(4);
      expect(await recountEvents(c.id)).toBe(1);
    });

    it('período só com feriados passa a ter 0 dias úteis e 0 descontados', async () => {
      const { caio, pedro } = await seedTeam();
      const monday = nextMonday(14);
      const c = await createCommunication({
        authorId: pedro.id,
        approverId: caio.id,
        startDate: monday,
        endDate: monday,
        status: 'APPROVED',
      });
      await createHoliday({ date: monday });
      await recountService.recountUpcoming();
      const after = await reload(c.id);
      expect(after.businessDays).toBe(0);
      expect(after.deductedDays).toBe(0);
    });

    it('é idempotente', async () => {
      const { caio, pedro } = await seedTeam();
      const monday = nextMonday(14);
      const c = await createCommunication({
        authorId: pedro.id,
        approverId: caio.id,
        startDate: monday,
        endDate: addDays(monday, 4),
      });
      await createHoliday({ date: monday });
      expect(await recountService.recountUpcoming()).toEqual({ recounted: 1 });
      expect(await recountService.recountUpcoming()).toEqual({ recounted: 0 });
      expect(await recountEvents(c.id)).toBe(1);
      expect((await reload(c.id)).deductedDays).toBeNull();
    });
  });
});
