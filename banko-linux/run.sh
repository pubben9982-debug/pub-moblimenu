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
if [ ! -f patch-integration.py ] || [ ! -f patch-player-inactive.py ] || [ ! -f patch-player-name.py ] || [ ! -f patch-player-board-shop.py ] || [ ! -f patch-flex-controls.py ] || [ ! -f patch-giftcard-prizes.py ] || [ ! -f giftcard-prizes.js ] || [ ! -f giftcard-prizes-client.js ] || [ ! -f giftcard-stores.example.json ]; then
  echo "FEJL: Banko-integrationspatch mangler. Koer git pull."
  exit 1
fi

BANKO_ROOT="$(pwd)"
mkdir -p "$BANKO_ROOT/data"
if [ ! -f "$BANKO_ROOT/data/giftcard-stores.json" ]; then
  cp giftcard-stores.example.json "$BANKO_ROOT/data/giftcard-stores.json"
fi

SOURCE_HASH="$(sha256sum pubbanko_linux_latest.zip | awk '{print $1}')"
PATCH_HASH="$(cat patch-integration.py patch-player-inactive.py patch-player-name.py patch-player-board-shop.py patch-flex-controls.py patch-giftcard-prizes.py giftcard-prizes.js giftcard-prizes-client.js giftcard-stores.example.json | sha256sum | awk '{print $1}')"
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
  cp giftcard-prizes.js giftcard-prizes-client.js runtime/
  python3 patch-giftcard-prizes.py runtime/server.js
  node --check runtime/server.js
  node --check runtime/giftcard-prizes.js
  node --check runtime/giftcard-prizes-client.js
  (
    cd runtime
    npm install --omit=dev
  )
  printf '%s' "$BUILD_STAMP" > runtime/.build-stamp
  echo "Banko er klar."
fi

cd runtime
export PORT="${BANKO_PORT:-3000}"
export BARTENDER_PIN="${BARTENDER_PIN:-}"
export BANKO_GIFTCARD_DATA_FILE="${BANKO_GIFTCARD_DATA_FILE:-$BANKO_ROOT/data/giftcard-prizes.json}"
export BANKO_GIFTCARD_CONFIG_FILE="${BANKO_GIFTCARD_CONFIG_FILE:-$BANKO_ROOT/data/giftcard-stores.json}"
export BANKO_GIFTCARD_AUDIT_FILE="${BANKO_GIFTCARD_AUDIT_FILE:-$BANKO_ROOT/data/giftcard-prizes-audit.jsonl}"
export BANKO_GIFTCARD_PILOT="${BANKO_GIFTCARD_PILOT:-0}"

if [ -z "$BARTENDER_PIN" ]; then
  echo "Banko kræver at BARTENDER_PIN er sat." >&2
  exit 1
fi

exec node server.js
