#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo
echo "=== Pubbanko Unlimited - Linux setup ==="
echo

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js er ikke installeret."
  echo "Installer Node.js og npm via din Linux-distribution og kør setup.sh igen."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm er ikke installeret."
  echo "Installer npm og kør setup.sh igen."
  exit 1
fi

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
    echo "Mangler kildefragment: $part"
    exit 1
  fi
done

: > server.js
for part in "${parts[@]}"; do
  tr -d '\n\r ' < "$part" | base64 -d >> server.js
done

expected_sha256="7eb2cdbc23e9b7a0da51d4546bcdb8d073d812a0e54142d111c7a6cb89d5a432"
actual_sha256="$(sha256sum server.js | awk '{print $1}')"
if [ "$actual_sha256" != "$expected_sha256" ]; then
  echo "FEJL: server.js blev ikke samlet korrekt."
  echo "Forventet: $expected_sha256"
  echo "Faktisk:   $actual_sha256"
  exit 1
fi

echo "server.js er samlet og checksum er godkendt."
echo "Installerer pakker..."
npm install

echo
echo "Starter Pubbanko..."
echo "Spiller: http://DIN-IP:3000"
echo "Host:    http://DIN-IP:3000/?host=1"
echo
exec npm start
