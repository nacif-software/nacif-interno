import { addDays, APP_TIMEZONE, MESSAGES, todayIso } from '@nacif/shared';
import { describe, expect, it } from 'vitest';
import { holidays } from '../db/schema';
import { buildTestApp } from '../test/app';
import { loginAs } from '../test/auth';
import { countRows } from '../test/db';
import { createHoliday, seedTeam } from '../test/factories';

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
});
