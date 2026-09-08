#!/usr/bin/env python3
from pathlib import Path
import sys

path = Path(sys.argv[1] if len(sys.argv) > 1 else "runtime/server.js")
text = path.read_text(encoding="utf-8")

old = '''        function showHostMode() {
          els.playerLanding.classList.add("hidden");
          els.heroBox.classList.remove("hidden");
          els.mainGrid.classList.remove("hidden");
          els.boardShopBox.classList.add("hidden");
          els.waitingBox.classList.add("hidden");
          els.playerBox.classList.add("hidden");
        }'''

new = '''        function showHostMode() {
          els.playerLanding.classList.add("hidden");
          els.heroBox.classList.remove("hidden");
          els.mainGrid.classList.remove("hidden");
          els.mainGrid.style.gridTemplateColumns = "minmax(0, 1fr)";
          els.playerView.classList.add("hidden");
          els.hostView.classList.remove("hidden");
          els.boardShopBox.classList.add("hidden");
          els.waitingBox.classList.add("hidden");
          els.playerBox.classList.add("hidden");
        }'''

count = text.count(old)
if count == 0 and text.count(new) == 1:
    print(f"Banko host layout patch already applied: {path}")
    raise SystemExit(0)
if count != 1:
    raise SystemExit(f"Patch fejl (host layout): forventede 1 match, fandt {count}")

path.write_text(text.replace(old, new, 1), encoding="utf-8")
print(f"Banko host layout patch applied: {path}")
