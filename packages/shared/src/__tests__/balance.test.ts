import { describe, expect, it } from 'vitest';
import {
  anniversaryOn,
  defaultApproverFor,
  pendingAnniversaryYears,
  signedLedgerDays,
  withRunningBalance,
} from '../index';

describe('aniversário da data base', () => {
  it('mantém mês e dia', () => {
    expect(anniversaryOn('2025-08-22', 2026)).toBe('2026-08-22');
  });
  it('29/02 vira 28/02 em ano comum e volta a 29/02 em bissexto', () => {
    expect(anniversaryOn('2024-02-29', 2025)).toBe('2025-02-28');
    expect(anniversaryOn('2024-02-29', 2028)).toBe('2028-02-29');
  });
  it('não credita na própria data base, só a partir do primeiro aniversário', () => {
    expect(pendingAnniversaryYears('2025-08-22', '2025-08-22')).toEqual([]);
    expect(pendingAnniversaryYears('2025-08-22', '2026-08-21')).toEqual([]);
    expect(pendingAnniversaryYears('2025-08-22', '2026-08-22')).toEqual([2026]);
  });
  it('recupera anos perdidos e pula os já creditados', () => {
    expect(pendingAnniversaryYears('2023-03-10', '2026-11-09', [2024])).toEqual([2025, 2026]);
  });
});

describe('saldo de dias', () => {
  it('vendas subtraem, créditos somam', () => {
    expect(signedLedgerDays('ACCRUAL', 10)).toBe(10);
    expect(signedLedgerDays('GRANT', 15)).toBe(15);
    expect(signedLedgerDays('SALE', 7)).toBe(-7);
  });
  it('extrato com saldo acumulado, do mais recente para o mais antigo', () => {
    const rows = withRunningBalance([
      { date: '2025-10-15', days: -7, order: 'b' },
      { date: '2025-08-22', days: 10, order: 'a' },
      { date: '2026-02-06', days: -2, order: 'c' },
    ]);
    expect(rows.map((r) => [r.date, r.runningBalance])).toEqual([
      ['2026-02-06', 1],
      ['2025-10-15', 3],
      ['2025-08-22', 10],
    ]);
  });
});

describe('aprovador padrão', () => {
  const ricardo = { id: 'r', name: 'Ricardo' };
  const lucca = { id: 'l', name: 'Lucca' };
  it('usa o aprovador do projeto quando todos os projetos apontam para o mesmo', () => {
    expect(
      defaultApproverFor([{ defaultApprover: lucca }, { defaultApprover: lucca }], {
        defaultApprovers: [ricardo],
      }),
    ).toEqual(lucca);
  });
  it('cai no aprovador global quando não há projeto, ou quando divergem', () => {
    expect(defaultApproverFor([], { defaultApprovers: [ricardo, lucca] })).toEqual(ricardo);
    expect(
      defaultApproverFor([{ defaultApprover: lucca }, { defaultApprover: ricardo }], {
        defaultApprovers: [ricardo],
      }),
    ).toEqual(ricardo);
    expect(defaultApproverFor([{ defaultApprover: null }], { defaultApprovers: [] })).toBeNull();
  });
});
