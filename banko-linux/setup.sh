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

parts=(server.js.b64.part01 server.js.b64.part02 server.js.b64.part03 server.js.b64.part04 server.js.b64.part05)
for part in "${parts[@]}"; do
  if [ ! -f "$part" ]; then
    echo "Mangler kildefragment: $part"
    exit 1
  fi
done

cat "${parts[@]}" | tr -d '\n\r ' | base64 -d > server.js

echo "server.js er samlet."
echo "Installerer pakker..."
npm install

echo
echo "Starter Pubbanko..."
echo "Spiller: http://DIN-IP:3000"
echo "Host:    http://DIN-IP:3000/?host=1"
echo
exec npm start
