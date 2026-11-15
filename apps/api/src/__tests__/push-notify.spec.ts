import { addDays, APP_TIMEZONE, todayIso } from '@nacif/shared';
import { afterEach, describe, expect, it } from 'vitest';
import { db } from '../db/client';
import { pushSubscriptions } from '../db/schema';
import { drainBackground } from '../infra/http/background';
import { accrualService } from '../modules/disponibilidade/balance/accrual.service';
import { buildTestApp } from '../test/app';
import { loginAs } from '../test/auth';
import { createSettings, createUser, seedTeam } from '../test/factories';
import { PUSH_ORIGIN, recordPushes, subscribeFake } from '../test/push';

// Segunda a sexta, bem depois da antecedência mínima (o 'hoje' do servidor é o de São Paulo).
function nextMonday(minDays: number): string {
  let d = addDays(todayIso(APP_TIMEZONE), minDays);
  while (new Date(`${d}T00:00:00Z`).getUTCDay() !== 1) d = addDays(d, 1);
  return d;
}
const monday = nextMonday(30);
const COMM = { startDate: monday, endDate: addDays(monday, 4), notes: '' };

let pushes: ReturnType<typeof recordPushes> | null = null;
afterEach(() => pushes?.restore());

describe('push: avisos', () => {
  it('avisa o aprovador endereçado na comunicação nova, e só ele, com VAPID e aes128gcm', async () => {
    const { julia } = await seedTeam();
    const pedro = buildTestApp();
    const { user: pedroUser } = await loginAs(pedro, 'pedro@nacif.xyz');
    const marina = buildTestApp();
    const { user: marinaUser } = await loginAs(marina, 'marina@nacif.xyz');
    await subscribeFake(marinaUser.id, 'marina');
    await subscribeFake(pedroUser.id, 'pedro');
    pushes = recordPushes();

    const res = await pedro
      .post('/api/disponibilidade/communications')
      .send({ ...COMM, coverId: julia.id, approverId: marinaUser.id });
    expect(res.status).toBe(201);
    await drainBackground();

    expect(pushes.to('pedro')).toHaveLength(0);
    const [sent] = pushes.to('marina');
    expect(sent).toBeDefined();
    expect(sent?.headers['content-encoding']).toBe('aes128gcm');
    expect(sent?.headers.authorization).toMatch(/^vapid t=.+, k=.+/);
    expect(sent?.headers.ttl).toBe('86400');
    expect(sent?.headers.topic).toMatch(/^comm-[0-9a-f-]+$/);
    expect(sent?.headers.topic?.length).toBeLessThanOrEqual(32);
    // o envio aceito marca a assinatura como usada
    const [row] = await db().select().from(pushSubscriptions);
    expect(row).toBeDefined();
  });

  it('avisa o autor na recusa e apaga a assinatura que o serviço de push diz ter expirado', async () => {
    const { julia } = await seedTeam();
    const pedro = buildTestApp();
    const { user: pedroUser } = await loginAs(pedro, 'pedro@nacif.xyz');
    const marina = buildTestApp();
    const { user: marinaUser } = await loginAs(marina, 'marina@nacif.xyz');
    const created = await pedro
      .post('/api/disponibilidade/communications')
      .send({ ...COMM, coverId: julia.id, approverId: marinaUser.id });
    await drainBackground();

    await subscribeFake(pedroUser.id, 'pedro-ok');
    await subscribeFake(pedroUser.id, 'pedro-gone');
    pushes = recordPushes((endpoint) => (endpoint.endsWith('/pedro-gone') ? 410 : 201));

    const rejected = await marina
      .post(`/api/disponibilidade/approvals/${created.body.id}/reject`)
      .send({ justification: 'Sobreposição com a entrega do projeto, infelizmente.' });
    expect(rejected.status).toBe(200);
    await drainBackground();

    expect(pushes.to('pedro-ok')).toHaveLength(1);
    expect(pushes.to('pedro-gone')).toHaveLength(1);
    const rows = await db().select().from(pushSubscriptions);
    expect(rows.map((r) => r.endpoint)).toEqual([`${PUSH_ORIGIN}/pedro-ok`]);
  });

  it('avisa quem recebeu crédito anual pelo cron e crédito manual do administrador', async () => {
    await createSettings();
    const bruna = await createUser({
      name: 'Bruna Lima',
      email: 'bruna@nacif.xyz',
      creditBaseDate: '2025-02-10',
    });
    await subscribeFake(bruna.id, 'bruna');
    pushes = recordPushes();

    const result = await accrualService.runCatchUp(new Date('2026-02-11T12:00:00Z'));
    expect(result.created).toBe(1);
    await drainBackground();
    expect(pushes.to('bruna')).toHaveLength(1);

    await createUser({ name: 'Caio Admin', email: 'caio@nacif.xyz', role: 'ADMIN' });
    const admin = buildTestApp();
    await loginAs(admin, 'caio@nacif.xyz');
    const entry = await admin.post(`/api/disponibilidade/balance/${bruna.id}/entries`).send({
      type: 'GRANT',
      days: 5,
      referenceDate: '2026-03-01',
      note: 'Crédito de ajuste combinado.',
    });
    expect(entry.status).toBe(201);
    await drainBackground();
    expect(pushes.to('bruna')).toHaveLength(2);
    expect(pushes.to('bruna')[1]?.headers.topic).toBe('balance-grant');
  });

  it('sem assinatura, nada é enviado e a operação segue normal', async () => {
    const { julia } = await seedTeam();
    const pedro = buildTestApp();
    await loginAs(pedro, 'pedro@nacif.xyz');
    const marina = buildTestApp();
    const { user: marinaUser } = await loginAs(marina, 'marina@nacif.xyz');
    pushes = recordPushes();
    const res = await pedro
      .post('/api/disponibilidade/communications')
      .send({ ...COMM, coverId: julia.id, approverId: marinaUser.id });
    expect(res.status).toBe(201);
    await drainBackground();
    expect(pushes.sent).toHaveLength(0);
  });
});
