#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

for cmd in node npm base64 sha256sum; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "FEJL: $cmd er ikke installeret."
    exit 1
  fi
done

parts=(
  server.js.b64.part01
  server.js.b64.part02_01 server.js.b64.part02_02 server.js.b64.part02_03
  server.js.b64.part02_04 server.js.b64.part02_05 server.js.b64.part02_06
  server.js.b64.part02_07 server.js.b64.part02_08 server.js.b64.part02_09
  server.js.b64.part03
  server.js.b64.part04a server.js.b64.part04b server.js.b64.part04c
  server.js.b64.part05 server.js.b64.part06 server.js.b64.part07
  server.js.b64.part08 server.js.b64.part09
)

for part in "${parts[@]}"; do
  if [ ! -f "$part" ]; then
    echo "FEJL: Mangler kildefragment: $part"
    exit 1
  fi
done

if [ ! -f package.json ]; then
  echo "FEJL: package.json mangler."
  exit 1
fi

PORT="${BANKO_LEGACY_PORT:-3002}"
TEST_DIR="${TMPDIR:-/tmp}/pubbanko-legacy-test-${USER:-user}"
LAN_IP="$(hostname -I 2>/dev/null | tr ' ' '\n' | awk '/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/{print; exit}')"

rm -rf "$TEST_DIR"
mkdir -p "$TEST_DIR"

: > "$TEST_DIR/server.js"
for part in "${parts[@]}"; do
  tr -d '\n\r ' < "$part" | base64 -d >> "$TEST_DIR/server.js"
done

expected_sha256="7eb2cdbc23e9b7a0da51d4546bcdb8d073d812a0e54142d111c7a6cb89d5a432"
actual_sha256="$(sha256sum "$TEST_DIR/server.js" | awk '{print $1}')"
if [ "$actual_sha256" != "$expected_sha256" ]; then
  echo "FEJL: Legacy server.js har forkert checksum."
  echo "Forventet: $expected_sha256"
  echo "Faktisk:   $actual_sha256"
  exit 1
fi

cp package.json "$TEST_DIR/package.json"
cd "$TEST_DIR"

node --check server.js
npm install --omit=dev

echo
echo "=== LEGACY BANKO-TEST ==="
echo "Kilde: de oprindelige server.js.b64-fragmenter fra foer ZIP-skiftet."
echo "Checksum: $actual_sha256"
echo "Ingen integrationspatches anvendes."
echo "Port: $PORT"
if [ -n "$LAN_IP" ]; then
  echo "Spiller: http://${LAN_IP}:${PORT}/"
  echo "Host:    http://${LAN_IP}:${PORT}/?host=1"
else
  echo "Spiller: http://localhost:${PORT}/"
  echo "Host:    http://localhost:${PORT}/?host=1"
fi
echo "Stop testen med Ctrl+C i DENNE terminal."
echo

export PORT
exec node server.js
