#!/usr/bin/env bash
# Falha se encontrar vocabulário proibido (ver AGENTS.md) em copy de UI, shared ou docs.
set -euo pipefail
cd "$(dirname "$0")/.."

PATTERN='f[ée]rias|\bfolga|saldo de f|funcion[áa]ri|colaborador|\bRH\b|\babono'
PATHS=(apps/web/src packages/shared/src docs README.md CLAUDE.md)

if grep -rniE "$PATTERN" "${PATHS[@]}" --include='*.ts' --include='*.tsx' --include='*.md' --include='*.css' \
  | grep -v 'vocab-check' | grep -v 'design-spec.md' ; then
  echo "vocab-check: vocabulário proibido encontrado (ver AGENTS.md)." >&2
  exit 1
fi
echo "vocab-check: ok"
