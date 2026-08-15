#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

for cmd in node npm unzip; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "FEJL: $cmd er ikke installeret."
    exit 1
  fi
done

if [ ! -f pubbanko_linux_latest.zip ]; then
  echo "FEJL: pubbanko_linux_latest.zip mangler."
  exit 1
fi

PORT="${BANKO_TEST_PORT:-3001}"
TEST_DIR="${TMPDIR:-/tmp}/pubbanko-clean-test-${USER:-user}"
LAN_IP="$(hostname -I 2>/dev/null | tr ' ' '\n' | awk '/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/{print; exit}')"

rm -rf "$TEST_DIR"
mkdir -p "$TEST_DIR"
unzip -oq pubbanko_linux_latest.zip -d "$TEST_DIR"

cd "$TEST_DIR"

echo "Installerer kun den originale Banko-pakkes afhaengigheder..."
npm install --omit=dev

echo
echo "=== REN BANKO-TEST ==="
echo "Ingen integration-, Pub-ID-, inactive-, name- eller board-shop-patches bliver anvendt."
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
