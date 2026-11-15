import { describe, expect, it } from 'vitest';
import { db } from '../db/client';
import { pushSubscriptions } from '../db/schema';
import { buildTestApp } from '../test/app';
import { loginAs } from '../test/auth';
import { seedTeam } from '../test/factories';
import { fakeClientKeys } from '../test/push';

describe('push: assinaturas', () => {
  it('config devolve a chave pública quando o ambiente tem as chaves', async () => {
    await seedTeam();
    const agent = buildTestApp();
    await loginAs(agent, 'pedro@nacif.xyz');
    const res = await agent.get('/api/push/config');
    expect(res.status).toBe(200);
    expect(res.body.enabled).toBe(true);
    expect(res.body.publicKey).toHaveLength(87);
  });

  it('exige login', async () => {
    const res = await buildTestApp().get('/api/push/config');
    expect(res.status).toBe(401);
  });

  it('assina (upsert por endpoint), substitui a antiga e remove só a própria', async () => {
    await seedTeam();
    const pedro = buildTestApp();
    await loginAs(pedro, 'pedro@nacif.xyz');
    const keys = await fakeClientKeys();
    const sub = (endpoint: string) => ({ endpoint, expirationTime: null, keys, userAgent: 'ua' });

    expect(
      (await pedro.post('/api/push/subscriptions').send(sub('https://p.example/a'))).status,
    ).toBe(201);
    expect(
      (await pedro.post('/api/push/subscriptions').send(sub('https://p.example/a'))).status,
    ).toBe(201);
    expect(await db().select().from(pushSubscriptions)).toHaveLength(1);

    // o navegador trocou a assinatura: a nova entra e a antiga sai
    const replaced = await pedro
      .post('/api/push/subscriptions')
      .send({ ...sub('https://p.example/b'), replaces: 'https://p.example/a' });
    expect(replaced.status).toBe(201);
    const rows = await db().select().from(pushSubscriptions);
    expect(rows.map((r) => r.endpoint)).toEqual(['https://p.example/b']);

    // outra pessoa não remove
    const julia = buildTestApp();
    await loginAs(julia, 'julia@nacif.xyz');
    const foreign = await julia
      .delete('/api/push/subscriptions')
      .send({ endpoint: 'https://p.example/b' });
    expect(foreign.status).toBe(404);

    const removed = await pedro
      .delete('/api/push/subscriptions')
      .send({ endpoint: 'https://p.example/b' });
    expect(removed.status).toBe(204);
    expect(await db().select().from(pushSubscriptions)).toHaveLength(0);
  });

  it('valida o corpo', async () => {
    await seedTeam();
    const pedro = buildTestApp();
    await loginAs(pedro, 'pedro@nacif.xyz');
    const res = await pedro.post('/api/push/subscriptions').send({ endpoint: 'nope', keys: {} });
    expect(res.status).toBe(422);
  });
});
