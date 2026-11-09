import { addDays, APP_TIMEZONE, todayIso } from '@nacif/shared';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { availabilityLedgerEntries, communications, users } from '../db/schema';
import { db } from '../db/client';
import { accrualService } from '../modules/disponibilidade/balance/accrual.service';
import { balanceRepository } from '../modules/disponibilidade/balance/balance.repository';
import { approvalsService } from '../modules/disponibilidade/approvals/approvals.service';
import { findConflicts } from '../modules/disponibilidade/communications/conflict.service';
import { buildTestApp } from '../test/app';
import { loginAs } from '../test/auth';
import { countRows } from '../test/db';
import {
  createCommunication,
  createLedgerEntry,
  createProject,
  createUser,
  seedTeam,
} from '../test/factories';

const today = todayIso(APP_TIMEZONE);
const start = addDays(today, 14);

describe('saldo de dias', () => {
  it('saldo = créditos − vendas − dias descontados das aprovadas; só aprovadas debitam', async () => {
    const { pedro, julia, caio } = await seedTeam();
    await createLedgerEntry({
      userId: pedro.id,
      type: 'GRANT',
      days: 15,
      referenceDate: '2025-08-22',
    });
    await createLedgerEntry({
      userId: pedro.id,
      type: 'ACCRUAL',
      days: 10,
      referenceDate: '2026-08-22',
      referenceYear: 2026,
    });
    await createLedgerEntry({
      userId: pedro.id,
      type: 'SALE',
      days: 7,
      referenceDate: '2025-10-15',
    });
    await createCommunication({
      authorId: pedro.id,
      coverId: julia.id,
      approverId: caio.id,
      startDate: '2026-02-02',
      endDate: '2026-02-06',
      status: 'APPROVED',
    }); // 5 dias úteis
    await createCommunication({
      authorId: pedro.id,
      coverId: julia.id,
      approverId: caio.id,
      startDate: '2026-03-02',
      endDate: '2026-03-06',
      status: 'APPROVED',
      deductedDays: 0,
    }); // ajuste: 0
    await createCommunication({
      authorId: pedro.id,
      coverId: julia.id,
      approverId: caio.id,
      startDate: start,
      endDate: addDays(start, 4),
    }); // em análise: não debita
    await createCommunication({
      authorId: pedro.id,
      coverId: julia.id,
      approverId: caio.id,
      startDate: '2026-04-06',
      endDate: '2026-04-10',
      status: 'REJECTED',
    });

    expect(await balanceRepository.balanceOf(pedro.id)).toBe(15 + 10 - 7 - 5 - 0);
    expect(await balanceRepository.balanceOf(julia.id)).toBe(0);

    const agent = buildTestApp();
    await loginAs(agent, 'pedro@nacif.xyz');
    const mine = await agent.get('/api/disponibilidade/balance');
    expect(mine.status).toBe(200);
    expect(mine.body.balance).toBe(13);
    expect(mine.body.credits).toBe(25);
    expect(mine.body.sales).toBe(7);
    expect(mine.body.deducted).toBe(5);
    // extrato do mais recente para o mais antigo, com saldo acumulado
    expect(
      mine.body.entries.map((e: { kind: string; days: number; runningBalance: number }) => [
        e.kind,
        e.days,
        e.runningBalance,
      ]),
    ).toEqual([
      ['ACCRUAL', 10, 13],
      ['COMMUNICATION', 0, 3],
      ['COMMUNICATION', -5, 3],
      ['SALE', -7, 8],
      ['GRANT', 15, 15],
    ]);
    const dashboard = await agent.get('/api/disponibilidade/dashboard');
    expect(dashboard.body.balance).toBe(13);
    // membro não vê o saldo dos outros
    expect((await agent.get(`/api/disponibilidade/balance/${julia.id}`)).status).toBe(403);
  });

  it('admin lança crédito e venda com nota; nota curta é recusada', async () => {
    const { pedro } = await seedTeam();
    const admin = buildTestApp();
    await loginAs(admin, 'caio@nacif.xyz');
    const grant = await admin.post(`/api/disponibilidade/balance/${pedro.id}/entries`).send({
      type: 'GRANT',
      days: 15,
      referenceDate: '2025-08-22',
      note: 'Concedido para todos com mais de 2 anos de casa',
    });
    expect(grant.status).toBe(201);
    expect(grant.body.balance).toBe(15);
    const sale = await admin.post(`/api/disponibilidade/balance/${pedro.id}/entries`).send({
      type: 'SALE',
      days: 7,
      referenceDate: '2025-10-15',
      note: 'Venda acordada em outubro',
    });
    expect(sale.body.balance).toBe(8);
    expect(sale.body.entries[0].createdBy.name).toBe('Caio Bertelli');
    const short = await admin
      .post(`/api/disponibilidade/balance/${pedro.id}/entries`)
      .send({ type: 'GRANT', days: 1, referenceDate: '2026-01-01', note: 'curta' });
    expect(short.status).toBe(422);

    const overview = await admin.get('/api/disponibilidade/balance/overview');
    expect(overview.status).toBe(200);
    const row = overview.body.find((r: { user: { id: string } }) => r.user.id === pedro.id);
    expect(row).toMatchObject({ balance: 8, lastEntryDate: '2025-10-15' });
    // ativos primeiro
    const actives = overview.body.map((r: { user: { active: boolean } }) => r.user.active);
    expect(actives.indexOf(false)).toBeGreaterThan(actives.lastIndexOf(true));
  });

  it('crédito anual: só a partir do 1º aniversário, com catch-up, 29/02 e sem duplicar', async () => {
    const { caio } = await seedTeam();
    const old = await createUser({ name: 'Antiga', creditBaseDate: '2023-02-29' }); // base inválida? não: 2023 não é bissexto
    const base = await createUser({ name: 'Base ontem', creditBaseDate: addDays(today, -1) });
    const leap = await createUser({ name: 'Bissexto', creditBaseDate: '2024-02-29' });
    const inactive = await createUser({
      name: 'Inativa',
      active: false,
      creditBaseDate: '2020-01-01',
    });
    await createUser({ name: 'Sem data base' });
    void caio;

    const first = await accrualService.runCatchUp(new Date());
    const years = (id: string) =>
      db()
        .select({
          year: availabilityLedgerEntries.referenceYear,
          date: availabilityLedgerEntries.referenceDate,
        })
        .from(availabilityLedgerEntries)
        .where(eq(availabilityLedgerEntries.userId, id));
    const thisYear = Number(today.slice(0, 4));
    // Antiga: aniversários de 2024..hoje (ou até o ano anterior se 28/02 ainda não chegou)
    const oldYears = (await years(old.id)).map((r) => r.year);
    expect(oldYears[0]).toBe(2024);
    expect(await balanceRepository.balanceOf(old.id)).toBe(oldYears.length * 10);
    // Base ontem: nenhum crédito (o primeiro aniversário é daqui a um ano)
    expect(await years(base.id)).toEqual([]);
    // Bissexto: 2025 cai em 28/02
    const leapRows = await years(leap.id);
    expect(leapRows.find((r) => r.year === 2025)?.date).toBe('2025-02-28');
    // Inativa: nada
    expect(await years(inactive.id)).toEqual([]);
    expect(first.created).toBe(oldYears.length + leapRows.length);

    // segunda execução não cria nada; reativar a pessoa recupera os anos perdidos
    expect((await accrualService.runCatchUp(new Date())).created).toBe(0);
    await db().update(users).set({ active: true }).where(eq(users.id, inactive.id));
    const third = await accrualService.runCatchUp(new Date());
    expect(third.created).toBe(thisYear - 2020 - (today < `${thisYear}-01-01` ? 1 : 0));

    // endpoint manual só para admin
    const admin = buildTestApp();
    await loginAs(admin, 'caio@nacif.xyz');
    expect((await admin.post('/api/disponibilidade/balance/accrual/run')).body).toEqual({
      created: 0,
    });
  });

  it('aprovador ajusta os dias descontados com nota; sem nota é 422; lote usa dias úteis', async () => {
    const { marina, pedro, julia, caio } = await seedTeam();
    await createLedgerEntry({
      userId: pedro.id,
      type: 'GRANT',
      days: 10,
      referenceDate: '2025-08-22',
    });
    const holidaySwap = await createCommunication({
      authorId: pedro.id,
      coverId: julia.id,
      approverId: marina.id,
      startDate: start,
      endDate: addDays(start, 1),
    });
    const other = await createCommunication({
      authorId: pedro.id,
      coverId: julia.id,
      approverId: marina.id,
      startDate: addDays(start, 7),
      endDate: addDays(start, 11),
    });

    const agent = buildTestApp();
    await loginAs(agent, 'marina@nacif.xyz');
    const detail = await agent.get(`/api/disponibilidade/communications/${holidaySwap.id}`);
    expect(detail.body.authorBalance).toBe(10);
    expect(detail.body.deductedDays).toBeNull();

    const noNote = await agent
      .post(`/api/disponibilidade/approvals/${holidaySwap.id}/approve`)
      .send({ deductedDays: 0 });
    expect(noNote.status).toBe(422);

    const approved = await agent
      .post(`/api/disponibilidade/approvals/${holidaySwap.id}/approve`)
      .send({ deductedDays: 0, deductionNote: 'Troca do feriado de 16 e 17 pelos dias 23 e 24' });
    expect(approved.status).toBe(200);
    expect(approved.body.deductedDays).toBe(0);
    expect(approved.body.decision.justification).toContain('Troca do feriado');
    const decisionEvent = approved.body.flow.find((e: { type: string }) => e.type === 'DECISION');
    expect(decisionEvent.description).toBe('Aprovada por Marina Duarte (0 dias descontados)');
    expect(decisionEvent.metadata.deductedDays).toBe(0);
    expect(await balanceRepository.balanceOf(pedro.id)).toBe(10);

    // aprovação simples desconta os dias úteis; lote idem
    const plain = await agent.post(`/api/disponibilidade/approvals/${other.id}/approve`);
    expect(plain.status).toBe(200);
    expect(plain.body.deductedDays).toBe(5);
    expect(await balanceRepository.balanceOf(pedro.id)).toBe(5);

    const third = await createCommunication({
      authorId: pedro.id,
      coverId: julia.id,
      approverId: caio.id,
      startDate: addDays(start, 14),
      endDate: addDays(start, 15),
    });
    const batch = await approvalsService.batchApprove(caio, [third.id]);
    expect(await balanceRepository.balanceOf(pedro.id)).toBe(3);
    await approvalsService.undoBatch(caio, batch.batchId);
    expect(await balanceRepository.balanceOf(pedro.id)).toBe(5);
    expect(await countRows(communications, eq(communications.status, 'APPROVED'))).toBe(2);
  });
});

describe('conflitos com projetos N:N', () => {
  it('conflito quando divide ao menos um projeto; limite por projeto; sem projeto não há conflito', async () => {
    const { caio, marina } = await seedTeam();
    const lovell = await createProject({ name: 'Lovell' });
    const roadway = await createProject({ name: 'Roadway' });
    const brian = await createUser({ name: 'Brian', projectIds: [lovell.id, roadway.id] });
    const geraldo = await createUser({ name: 'Geraldo', projectIds: [lovell.id] });
    const pedro = await createUser({ name: 'Pedro M', projectIds: [roadway.id] });
    const solo = await createUser({ name: 'Solo' });
    const range = { startDate: start, endDate: addDays(start, 4) };
    await createCommunication({
      authorId: geraldo.id,
      coverId: caio.id,
      approverId: marina.id,
      ...range,
      status: 'APPROVED',
    });
    await createCommunication({
      authorId: pedro.id,
      coverId: caio.id,
      approverId: marina.id,
      ...range,
      status: 'APPROVED',
    });

    const forBrian = await findConflicts({
      authorId: brian.id,
      projectIds: [lovell.id, roadway.id],
      range,
      maxSimultaneousPerProject: 1,
    });
    expect(forBrian.conflicts.map((c) => [c.name, c.projectNames])).toEqual([
      ['Geraldo', ['Lovell']],
      ['Pedro M', ['Roadway']],
    ]);
    expect(forBrian.limitReached).toBe(true);
    expect(forBrian.limitReachedProjects.map((p) => p.name)).toEqual(['Lovell', 'Roadway']);

    const forGeraldo = await findConflicts({
      authorId: geraldo.id,
      projectIds: [lovell.id],
      range,
      maxSimultaneousPerProject: 2,
    });
    expect(forGeraldo.conflicts).toEqual([]);
    expect(forGeraldo.limitReached).toBe(false);

    const forSolo = await findConflicts({
      authorId: solo.id,
      projectIds: [],
      range,
      maxSimultaneousPerProject: 2,
    });
    expect(forSolo).toEqual({ conflicts: [], limitReached: false, limitReachedProjects: [] });

    // pessoa sem projeto comunica normalmente
    const agent = buildTestApp();
    await loginAs(agent, solo.email);
    const created = await agent.post('/api/disponibilidade/communications').send({
      startDate: addDays(start, 30),
      endDate: addDays(start, 31),
      coverId: brian.id,
      approverId: marina.id,
    });
    expect(created.status).toBe(201);
    expect(created.body.projects).toEqual([]);
    expect(created.body.authorBalance).toBe(0);
  });
});
