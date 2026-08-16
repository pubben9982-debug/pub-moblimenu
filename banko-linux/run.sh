#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "FEJL: Node.js er ikke installeret."
  exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
  echo "FEJL: npm er ikke installeret."
  exit 1
fi
if ! command -v unzip >/dev/null 2>&1; then
  echo "FEJL: unzip er ikke installeret."
  exit 1
fi
if ! command -v python3 >/dev/null 2>&1; then
  echo "FEJL: Python 3 er ikke installeret."
  exit 1
fi
if [ ! -f pubbanko_linux_latest.zip ]; then
  echo "FEJL: pubbanko_linux_latest.zip mangler. Koer git pull."
  exit 1
fi
if [ ! -f patch-integration.py ] || [ ! -f patch-player-inactive.py ] || [ ! -f patch-player-name.py ] || [ ! -f patch-player-board-shop.py ] || [ ! -f patch-flex-controls.py ]; then
  echo "FEJL: Banko-integrationspatch mangler. Koer git pull."
  exit 1
fi

SOURCE_HASH="$(sha256sum pubbanko_linux_latest.zip | awk '{print $1}')"
PATCH_HASH="$(cat patch-integration.py patch-player-inactive.py patch-player-name.py patch-player-board-shop.py patch-flex-controls.py | sha256sum | awk '{print $1}')"
BUILD_STAMP="${SOURCE_HASH}:${PATCH_HASH}"
CURRENT_STAMP=""
[ -f runtime/.build-stamp ] && CURRENT_STAMP="$(cat runtime/.build-stamp)"

if [ ! -f runtime/server.js ] || [ "$CURRENT_STAMP" != "$BUILD_STAMP" ]; then
  echo "Forbereder seneste Banko-version..."
  rm -rf runtime
  mkdir -p runtime
  unzip -oq pubbanko_linux_latest.zip -d runtime
  python3 patch-integration.py runtime/server.js
  python3 patch-player-inactive.py runtime/server.js
  python3 patch-player-name.py runtime/server.js
  python3 patch-player-board-shop.py runtime/server.js
  python3 patch-flex-controls.py runtime/server.js
  node --check runtime/server.js
  (
    cd runtime
    npm install --omit=dev
  )
  printf '%s' "$BUILD_STAMP" > runtime/.build-stamp
  echo "Banko er klar."
fi

cd runtime
export PORT="${BANKO_PORT:-3000}"
export BARTENDER_PIN="${BARTENDER_PIN:-4738}"
exec node server.js
