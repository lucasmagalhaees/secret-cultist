#!/usr/bin/env bash
# Claude Code Stop hook: the agent cannot end a turn while the quick checks fail.
# Exit 2 sends stderr back to the agent and keeps the turn going; after three failed attempts in a row it lets go,
# so a problem the agent cannot fix reaches the user instead of looping.
cat >/dev/null                       # hook input arrives on stdin; not needed here
dir="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$dir" || exit 0
count_file=".claude/.stop-blocks"

out="$(scripts/verify.sh --quick 2>&1)"; code=$?
if [ "$code" -eq 0 ]; then rm -f "$count_file"; exit 0; fi
if [ "$code" -eq 3 ]; then echo "verify pulado: $out" >&2; exit 1; fi

n=$(( $(cat "$count_file" 2>/dev/null || echo 0) + 1 ))
echo "$n" > "$count_file"
if [ "$n" -gt 3 ]; then
  rm -f "$count_file"
  echo "scripts/verify.sh --quick continua falhando depois de 3 tentativas. Avise o usuário do que falhou; não diga que está funcionando." >&2
  exit 1
fi
{
  echo "scripts/verify.sh --quick falhou (tentativa $n de 3). Corrija antes de encerrar."
  echo "Se não der para corrigir, pare e diga ao usuário exatamente o que falhou. Não declare que funciona."
  echo "$out"
} >&2
exit 2
