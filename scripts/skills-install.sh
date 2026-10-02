#!/usr/bin/env bash
# Instala as skills listadas em scripts/skills.txt para o Claude Code (project-level).
set -euo pipefail
cd "$(dirname "$0")/.."
while read -r repo skills; do
  [[ -z "$repo" || "$repo" == \#* ]] && continue
  if [[ -n "${skills:-}" ]]; then
    # shellcheck disable=SC2086
    npx -y skills add "$repo" --skill $skills -a claude-code -y
  else
    npx -y skills add "$repo" -a claude-code -y
  fi
done < scripts/skills.txt
