import { describe, expect, it } from 'vitest';
import { buildTestApp } from '../test/app';
import { seedTeam } from '../test/factories';

describe('camada HTTP', () => {
  it('rota desconhecida em /api devolve 404 no contrato de erro', async () => {
    const res = await buildTestApp().get('/api/nada');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Rota não encontrada.' } });
  });

  it('JSON malformado devolve 400', async () => {
    const res = await buildTestApp().post('/api/auth/login').send('{');
    expect(res.status).toBe(400);
    expect(res.body.error).toEqual({ code: 'VALIDATION_ERROR', message: 'JSON inválido.' });
  });

  it('corpo acima de 256 kB devolve 413', async () => {
    const res = await buildTestApp()
      .post('/api/auth/login')
      .send({ email: 'a@nacif.xyz', password: 'x'.repeat(300 * 1024) });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('guard de prefixo exige sessão uma única vez e cobre os filhos', async () => {
    await seedTeam();
    const agent = buildTestApp();
    expect((await agent.get('/api/users')).status).toBe(401);
    expect((await agent.get('/api/users/options?purpose=cover')).status).toBe(401);
    expect((await agent.post('/api/users/invites').send({})).status).toBe(401);
  });
});
