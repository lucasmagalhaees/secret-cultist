#!/usr/bin/env bash
# One command that answers "is this still correct?".
#   scripts/verify.sh           types + build + docs + core + unit + contract + production-check self-test + end-to-end (dark theme) + offline and update (service worker) + code coverage minimums
#   scripts/verify.sh --quick   types + build + docs + core + unit + contract + production-check self-test (a few seconds; what the Stop hook runs)
# Every test runs against dist/, what the build produces and what ships. The one exception is `core`: the same cases as
# `unit`, run in Node against src/core built by itself, to show the core stands without a page.
# Exit: 0 all passed, 1 something failed, 3 test dependencies missing.
set -u
cd "$(dirname "$0")/.."

if ! python3 - <<'PY' 2>/dev/null
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    p.chromium.launch().close()
PY
then
  echo "verify: Playwright ou o Chromium dele não estão instalados (pip install -r tests/requirements.txt && playwright install chromium)" >&2
  exit 3
fi

if [ ! -x node_modules/.bin/vite ] || [ ! -x node_modules/.bin/tsc ]; then
  echo "verify: faltam as dependências do build (npm ci)" >&2
  exit 3
fi

full=1; [ "${1:-}" = "--quick" ] && full=0
if [ "$full" -eq 1 ]; then
  rm -rf tests/.coverage
  export APP_COVERAGE=1          # the browser records which code each suite executes
fi

fail=0
run() {
  local name="$1"; shift
  local out
  if out="$("$@" 2>&1)"; then
    printf 'ok     %-10s %s\n' "$name" "$(printf '%s\n' "$out" | tail -n 1)"
  else
    fail=1
    printf 'FALHA  %-10s\n' "$name"
    printf '%s\n' "$out" | tail -n 25 | sed 's/^/         /'
    # on GitHub Actions the tail of the failing output also becomes an annotation, readable without opening the log
    if [ "${GITHUB_ACTIONS:-}" = "true" ]; then
      printf '::error title=verify %s::%s\n' "$name" "$(printf '%s\n' "$out" | tail -n 12 | tr '\n' '|' | cut -c1-1800)"
    fi
  fi
}

run types    npm run --silent typecheck
run build    npm run --silent build
if [ "$fail" -ne 0 ]; then echo "verify: HÁ FALHAS no código ou no build; os testes não rodaram. Não declare que funciona."; exit 1; fi
run docs     python3 tests/docs_check.py
run core     node tests/core.mjs
run unit     python3 tests/unit.py
run contract python3 tests/contract.py
run guard    python3 tests/guard.py
run affected python3 scripts/affected.py
run prod     python3 scripts/check_production.py --selftest
if [ "$full" -eq 1 ]; then
  run e2e-dark  python3 tests/e2e.py dark
  run iphone    python3 tests/iphone.py chromium
  run social    python3 tests/social.py
  run pwa       python3 tests/pwa.py
  run coverage  python3 tests/cov.py --min-functions 95 --min-chars 90
fi

if [ "$fail" -eq 0 ]; then echo "verify: tudo passou"; else echo "verify: HÁ FALHAS. Não declare que funciona."; fi
exit "$fail"
