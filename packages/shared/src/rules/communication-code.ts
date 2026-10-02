export const COMMUNICATION_CODE_RE = /^(\d{4})-(\d{4,})$/;

/** (2026, 184) → '2026-0184'. A UI exibe com '#' na frente. */
export function formatCommunicationCode(year: number, sequence: number): string {
  if (!Number.isInteger(year) || year < 1000 || year > 9999) throw new Error('Ano inválido');
  if (!Number.isInteger(sequence) || sequence < 1) throw new Error('Sequência inválida');
  return `${year}-${String(sequence).padStart(4, '0')}`;
}

export function parseCommunicationCode(code: string): { year: number; sequence: number } | null {
  const match = COMMUNICATION_CODE_RE.exec(code.replace(/^#/, ''));
  if (!match) return null;
  return { year: Number(match[1]), sequence: Number(match[2]) };
}

export function isCommunicationCode(value: string): boolean {
  return parseCommunicationCode(value) !== null;
}

export function displayCommunicationCode(code: string): string {
  return `#${code}`;
}
