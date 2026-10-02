import { describe, expect, it } from 'vitest';
import {
  canCancel,
  canDecideOn,
  canTransition,
  formatCommunicationCode,
  findOverlaps,
  parseCommunicationCode,
  rangesOverlap,
  validateMinimumNotice,
} from '../rules';

describe('validateMinimumNotice', () => {
  const today = '2026-09-23';
  it('aceita exatamente 7 dias depois', () => {
    expect(validateMinimumNotice({ startDate: '2026-09-30', today, minNoticeDays: 7 })).toEqual({
      ok: true,
    });
  });
  it('rejeita 6 dias depois e informa a data mínima', () => {
    expect(validateMinimumNotice({ startDate: '2026-09-29', today, minNoticeDays: 7 })).toEqual({
      ok: false,
      earliestStart: '2026-09-30',
      minNoticeDays: 7,
    });
  });
  it('respeita configuração diferente', () => {
    expect(validateMinimumNotice({ startDate: '2026-09-25', today, minNoticeDays: 2 }).ok).toBe(
      true,
    );
  });
});

describe('overlap', () => {
  it('detecta sobreposição inclusiva', () => {
    expect(
      rangesOverlap(
        { startDate: '2026-10-05', endDate: '2026-10-09' },
        { startDate: '2026-10-09', endDate: '2026-10-12' },
      ),
    ).toBe(true);
    expect(
      rangesOverlap(
        { startDate: '2026-10-05', endDate: '2026-10-09' },
        { startDate: '2026-10-10', endDate: '2026-10-12' },
      ),
    ).toBe(false);
  });
  it('filtra candidatos', () => {
    const found = findOverlaps({ startDate: '2026-10-05', endDate: '2026-10-09' }, [
      { id: 'a', startDate: '2026-10-06', endDate: '2026-10-08' },
      { id: 'b', startDate: '2026-10-12', endDate: '2026-10-16' },
    ]);
    expect(found.map((f) => f.id)).toEqual(['a']);
  });
});

describe('communication code', () => {
  it('formata e parseia', () => {
    expect(formatCommunicationCode(2026, 184)).toBe('2026-0184');
    expect(parseCommunicationCode('#2026-0184')).toEqual({ year: 2026, sequence: 184 });
    expect(parseCommunicationCode('2026-10184')).toEqual({ year: 2026, sequence: 10184 });
    expect(parseCommunicationCode('abc')).toBeNull();
  });
});

describe('transições e permissões', () => {
  it('só permite decidir/cancelar em análise', () => {
    expect(canTransition('IN_REVIEW', 'APPROVED')).toBe(true);
    expect(canTransition('APPROVED', 'IN_REVIEW')).toBe(false);
    expect(canTransition('APPROVED', 'IN_REVIEW', { allowUndo: true })).toBe(true);
    expect(canCancel('APPROVED')).toBe(false);
  });
  it('define quem decide', () => {
    const comm = { authorId: 'u1', approverId: 'u2' };
    expect(canDecideOn({ id: 'u2', role: 'APPROVER' }, comm)).toBe(true);
    expect(canDecideOn({ id: 'u3', role: 'APPROVER' }, comm)).toBe(false);
    expect(canDecideOn({ id: 'u3', role: 'ADMIN' }, comm)).toBe(true);
    expect(canDecideOn({ id: 'u1', role: 'ADMIN' }, comm)).toBe(false);
  });
});
