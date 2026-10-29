const UNIQUE_VIOLATION = /UNIQUE constraint failed: ([\w.]+)/;

/** O D1 devolve violações de unicidade como `Error` genérico (às vezes em `cause`); extrai a coluna. */
export function uniqueViolation(err: unknown): string | null {
  let cursor: unknown = err;
  while (cursor instanceof Error) {
    const match = UNIQUE_VIOLATION.exec(cursor.message);
    if (match?.[1]) return match[1];
    cursor = cursor.cause;
  }
  return null;
}
