import { SESSION_COOKIE_NAME } from '@nacif/shared';
import { describe, expect, it } from 'vitest';
import { db } from '../infra/prisma/client';
import { invitesService } from '../modules/core/users/invites.service';
import { buildTestApp } from '../test/app';
import { loginAs } from '../test/auth';
import { TEST_PASSWORD, seedTeam } from '../test/factories';

describe('auth', () => {
  it('login com sucesso define cookie httpOnly e devolve o usuário', async () => {
    await seedTeam();
    const agent = buildTestApp();
    const res = await agent
      .post('/api/auth/login')
      .send({ email: 'Marina@nacif.xyz', password: TEST_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      name: 'Marina Duarte',
      role: 'APPROVER',
      initials: 'MD',
      project: { name: 'Órion' },
    });
    const cookie = res.headers['set-cookie']?.[0] ?? '';
    expect(cookie).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(cookie).toContain('HttpOnly');
    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe('marina@nacif.xyz');
  });

  it('domínio fora de nacif.xyz devolve 403 com o e-mail ecoado', async () => {
    await seedTeam();
    const res = await buildTestApp()
      .post('/api/auth/login')
      .send({ email: 'rafael@gmail.com', password: 'x' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('DOMAIN_NOT_ALLOWED');
    expect(res.body.error.details.email).toBe('rafael@gmail.com');
  });

  it('senha errada devolve 401', async () => {
    await seedTeam();
    const res = await buildTestApp()
      .post('/api/auth/login')
      .send({ email: 'marina@nacif.xyz', password: 'errada-123' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('usuário inativo devolve 403', async () => {
    await seedTeam();
    const res = await buildTestApp()
      .post('/api/auth/login')
      .send({ email: 'thiago@nacif.xyz', password: TEST_PASSWORD });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('USER_INACTIVE');
  });

  it('logout encerra a sessão', async () => {
    await seedTeam();
    const agent = buildTestApp();
    await loginAs(agent, 'marina@nacif.xyz');
    expect((await agent.post('/api/auth/logout')).status).toBe(204);
    expect((await agent.get('/api/auth/me')).status).toBe(401);
    expect(await db.session.count()).toBe(0);
  });

  it('convite → link → definir senha → login', async () => {
    const { atlas } = await seedTeam();
    const { setupLink, user } = await invitesService.invite({
      email: 'nova@nacif.xyz',
      projectId: atlas.id,
    });
    expect(user.invitePending).toBe(true);
    const token = setupLink.split('/').pop() ?? '';

    const agent = buildTestApp();
    const info = await agent.get(`/api/auth/set-password/${token}`);
    expect(info.status).toBe(200);
    expect(info.body.email).toBe('nova@nacif.xyz');
    expect(info.body.mode).toBe('invite');

    // no convite o nome é obrigatório
    expect(
      (await agent.post('/api/auth/set-password').send({ token, password: 'senha-nova-123' }))
        .status,
    ).toBe(422);

    const set = await agent
      .post('/api/auth/set-password')
      .send({ token, name: 'Nova Pessoa', password: 'senha-nova-123' });
    expect(set.status).toBe(200);
    expect(set.body.user.name).toBe('Nova Pessoa');
    expect((await agent.get('/api/auth/me')).status).toBe(200);

    // token não pode ser reutilizado
    expect((await agent.get(`/api/auth/set-password/${token}`)).status).toBe(404);
    const login = await buildTestApp()
      .post('/api/auth/login')
      .send({ email: 'nova@nacif.xyz', password: 'senha-nova-123' });
    expect(login.status).toBe(200);
  });
});
