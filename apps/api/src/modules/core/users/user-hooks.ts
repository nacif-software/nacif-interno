/**
 * Ganchos do módulo core para outros módulos reagirem a mudanças em pessoas sem o core depender deles.
 * Hoje: a data base do crédito mudou (o módulo de saldo lança os créditos anuais pendentes).
 */
type CreditBaseDateHandler = (userId: string) => Promise<void>;

const creditBaseDateHandlers: CreditBaseDateHandler[] = [];

export function onCreditBaseDateChanged(handler: CreditBaseDateHandler): void {
  creditBaseDateHandlers.push(handler);
}

export async function emitCreditBaseDateChanged(userId: string): Promise<void> {
  for (const handler of creditBaseDateHandlers) await handler(userId);
}
