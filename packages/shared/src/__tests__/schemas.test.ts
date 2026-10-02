import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../labels/pt-br';
import {
  createCommunicationBodySchema,
  loginBodySchema,
  nacifEmailSchema,
  rejectBodySchema,
} from '../schemas';

describe('schemas', () => {
  it('normaliza e-mail e restringe domínio', () => {
    expect(nacifEmailSchema.parse('  Marina@Nacif.xyz ')).toBe('marina@nacif.xyz');
    const res = nacifEmailSchema.safeParse('rafael@gmail.com');
    expect(res.success).toBe(false);
    expect(res.error?.issues[0]?.message).toBe(MESSAGES.onlyNacifAccounts);
  });
  it('login aceita qualquer domínio (domínio é checado no service)', () => {
    expect(loginBodySchema.safeParse({ email: 'rafael@gmail.com', password: 'x' }).success).toBe(
      true,
    );
  });
  it('justificativa exige 20 caracteres', () => {
    const short = rejectBodySchema.safeParse({ justification: '1234567890123456789' });
    expect(short.success).toBe(false);
    expect(short.error?.issues[0]?.message).toBe(MESSAGES.rejectionTooShort);
    expect(rejectBodySchema.safeParse({ justification: '12345678901234567890' }).success).toBe(
      true,
    );
  });
  it('período precisa de dia útil e ordem correta', () => {
    const base = { coverId: 'c', approverId: 'a' };
    expect(
      createCommunicationBodySchema.safeParse({
        ...base,
        startDate: '2026-10-09',
        endDate: '2026-10-05',
      }).success,
    ).toBe(false);
    expect(
      createCommunicationBodySchema.safeParse({
        ...base,
        startDate: '2026-10-03',
        endDate: '2026-10-04',
      }).success,
    ).toBe(false);
    expect(
      createCommunicationBodySchema.safeParse({
        ...base,
        startDate: '2026-10-05',
        endDate: '2026-10-09',
      }).success,
    ).toBe(true);
  });
});
