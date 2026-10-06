import { describe, expect, it } from 'vitest';
import { buildTestApp } from '../test/app';
import { loginAs } from '../test/auth';
import { createUser, seedTeam, TEST_PASSWORD } from '../test/factories';

describe('users e projects', () => {
  it('admin lista todos, membro só ativos', async () => {
    await seedTeam();
    const admin = buildTestApp();
    await loginAs(admin, 'caio@nacif.xyz');
    const all = await admin.get('/api/users');
    expect(all.status).toBe(200);
    expect(all.body).toHaveLength(5);

    const member = buildTestApp();
    await loginAs(member, 'pedro@nacif.xyz');
    const active = await member.get('/api/users');
    expect(active.body.map((u: { name: string }) => u.name)).not.toContain('Thiago Lemos');
  });

  it('opções de aprovador só incluem APPROVER/ADMIN e excluem o próprio usuário', async () => {
    await seedTeam();
    const agent = buildTestApp();
    await loginAs(agent, 'pedro@nacif.xyz');
    const approvers = await agent.get('/api/users/options?purpose=approver');
    expect(approvers.body.map((u: { name: string }) => u.name).sort()).toEqual([
      'Caio Bertelli',
      'Marina Duarte',
    ]);
    const covers = await agent.get('/api/users/options?purpose=cover');
    expect(covers.body.map((u: { name: string }) => u.name)).not.toContain('Pedro Nakano');
    expect(covers.body.map((u: { name: string }) => u.name)).not.toContain('Thiago Lemos');
  });

  it('não-admin recebe 403 ao convidar; admin cria convite com link', async () => {
    await seedTeam();
    const member = buildTestApp();
    await loginAs(member, 'pedro@nacif.xyz');
    expect((await member.post('/api/users/invites').send({ email: 'x@nacif.xyz' })).status).toBe(
      403,
    );

    const admin = buildTestApp();
    await loginAs(admin, 'caio@nacif.xyz');
    const res = await admin.post('/api/users/invites').send({ email: 'ana.lima@nacif.xyz' });
    expect(res.status).toBe(201);
    expect(res.body.user.name).toBe('Ana Lima');
    expect(res.body.setupLink).toContain('/definir-senha/');
    expect((await admin.post('/api/users/invites').send({ email: 'ana@gmail.com' })).status).toBe(
      422,
    );
  });

  it('redefinição de senha: só admin, só para pessoa ativa com senha', async () => {
    const { pedro, thiago } = await seedTeam();
    const member = buildTestApp();
    await loginAs(member, 'pedro@nacif.xyz');
    expect((await member.post(`/api/users/${pedro.id}/password-reset`)).status).toBe(403);

    const admin = buildTestApp();
    await loginAs(admin, 'caio@nacif.xyz');
    expect((await admin.post(`/api/users/${thiago.id}/password-reset`)).status).toBe(409);
    const pending = await createUser({ withPassword: false });
    expect((await admin.post(`/api/users/${pending.id}/password-reset`)).status).toBe(409);
    expect((await admin.post('/api/users/nao-existe/password-reset')).status).toBe(404);

    const res = await admin.post(`/api/users/${pedro.id}/password-reset`);
    expect(res.status).toBe(200);
    expect(res.body.setupLink).toContain('/definir-senha/');
  });

  it('redefinição: senha antiga vale até usar o link; depois cai e as sessões encerram', async () => {
    const { pedro } = await seedTeam();
    const oldSession = buildTestApp();
    await loginAs(oldSession, 'pedro@nacif.xyz');
    const admin = buildTestApp();
    await loginAs(admin, 'caio@nacif.xyz');
    const { setupLink } = (await admin.post(`/api/users/${pedro.id}/password-reset`)).body;
    const token = setupLink.split('/').pop() ?? '';

    // link gerado não derruba ninguém
    expect((await oldSession.get('/api/auth/me')).status).toBe(200);
    expect((await loginAs(buildTestApp(), 'pedro@nacif.xyz')).user.name).toBe('Pedro Nakano');

    const agent = buildTestApp();
    const info = await agent.get(`/api/auth/set-password/${token}`);
    expect(info.body).toEqual({ email: 'pedro@nacif.xyz', name: 'Pedro Nakano', mode: 'reset' });

    // nome enviado é ignorado: o link só troca a senha
    const set = await agent
      .post('/api/auth/set-password')
      .send({ token, name: 'Outro Nome', password: 'senha-nova-123' });
    expect(set.status).toBe(200);
    expect(set.body.user.name).toBe('Pedro Nakano');
    expect((await agent.get('/api/auth/me')).status).toBe(200);

    expect((await oldSession.get('/api/auth/me')).status).toBe(401);
    expect((await agent.get(`/api/auth/set-password/${token}`)).status).toBe(404);
    const oldLogin = await buildTestApp()
      .post('/api/auth/login')
      .send({ email: 'pedro@nacif.xyz', password: TEST_PASSWORD });
    expect(oldLogin.status).toBe(401);
    expect((await loginAs(buildTestApp(), 'pedro@nacif.xyz', 'senha-nova-123')).user.id).toBe(
      pedro.id,
    );
  });

  it('redefinição: link deixa de valer se a pessoa for desativada antes de usar', async () => {
    const { pedro } = await seedTeam();
    const admin = buildTestApp();
    await loginAs(admin, 'caio@nacif.xyz');
    const { setupLink } = (await admin.post(`/api/users/${pedro.id}/password-reset`)).body;
    const token = setupLink.split('/').pop() ?? '';
    await admin.patch(`/api/users/${pedro.id}`).send({ active: false });

    const agent = buildTestApp();
    expect((await agent.get(`/api/auth/set-password/${token}`)).status).toBe(403);
    const set = await agent
      .post('/api/auth/set-password')
      .send({ token, password: 'senha-nova-123' });
    expect(set.status).toBe(403);
    expect(set.body.error.code).toBe('USER_INACTIVE');
  });

  it('desativar revoga sessões; admin não desativa a si mesmo', async () => {
    const { pedro } = await seedTeam();
    const member = buildTestApp();
    await loginAs(member, 'pedro@nacif.xyz');
    const admin = buildTestApp();
    const { user: caio } = await loginAs(admin, 'caio@nacif.xyz');

    expect((await admin.patch(`/api/users/${caio.id}`).send({ active: false })).status).toBe(409);
    const res = await admin
      .patch(`/api/users/${pedro.id}`)
      .send({ active: false, role: 'APPROVER' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ active: false, role: 'APPROVER' });
    expect((await member.get('/api/auth/me')).status).toBe(401);
  });

  it('projects: cria e atualiza com aprovador padrão válido', async () => {
    const { marina, pedro } = await seedTeam();
    const admin = buildTestApp();
    await loginAs(admin, 'caio@nacif.xyz');
    const created = await admin
      .post('/api/projects')
      .send({ name: 'Vega', defaultApproverId: marina.id });
    expect(created.status).toBe(201);
    expect(created.body.defaultApprover.name).toBe('Marina Duarte');
    expect(
      (await admin.patch(`/api/projects/${created.body.id}`).send({ defaultApproverId: pedro.id }))
        .status,
    ).toBe(422);
    const list = await admin.get('/api/projects');
    expect(list.body.map((p: { name: string }) => p.name)).toEqual(['Atlas', 'Vega', 'Órion']);
  });

  it('services lista só os serviços que existem no portal', async () => {
    await seedTeam();
    const agent = buildTestApp();
    await loginAs(agent, 'pedro@nacif.xyz');
    const res = await agent.get('/api/services');
    expect(res.body).toEqual([
      expect.objectContaining({
        slug: 'disponibilidade',
        status: 'available',
        path: '/disponibilidade',
      }),
    ]);
  });
});
