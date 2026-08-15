#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo
echo "=== Pubbanko Unlimited - Linux setup ==="
echo

if [ ! -f "pubbanko_linux_latest.zip" ]; then
  echo "Mangler pubbanko_linux_latest.zip"
  echo "Koer git pull og proev igen."
  exit 1
fi

if ! command -v unzip >/dev/null 2>&1; then
  echo "unzip er ikke installeret."
  echo "Installer unzip og koer setup.sh igen."
  exit 1
fi

rm -rf runtime
mkdir -p runtime
unzip -oq pubbanko_linux_latest.zip -d runtime
chmod +x runtime/setup.sh

echo "Seneste Banko-version er pakket ud."
echo
cd runtime
exec ./setup.sh
