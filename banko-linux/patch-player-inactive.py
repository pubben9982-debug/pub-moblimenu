#!/usr/bin/env python3
from pathlib import Path
import sys

path = Path(sys.argv[1] if len(sys.argv) > 1 else "runtime/server.js")
text = path.read_text(encoding="utf-8")


def rep(old, new, label):
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"Patch fejl ({label}): forventede 1 match, fandt {count}")
    text = text.replace(old, new, 1)

rep(
    '''      approved: player.approved,\n      lastNumber: state.drawn[state.drawn.length - 1] || null,''',
    '''      approved: player.approved,\n      bankoActive: state.bankoActive,\n      lastNumber: state.drawn[state.drawn.length - 1] || null,''',
    "player boards active state",
)

rep(
    '''        socket.on("player:boards", ({ boards, approved, lastNumber, showBingoButton, showLastNumberOnPlayer }) => {\n          if (isHost) return;\n          if (!approved) { showWaitingMode(); return; }''',
    '''        socket.on("player:boards", ({ boards, approved, bankoActive, lastNumber, showBingoButton, showLastNumberOnPlayer }) => {\n          if (isHost) return;\n          if (!bankoActive) return;\n          if (!approved) { showWaitingMode(); return; }''',
    "player boards inactive guard",
)

path.write_text(text, encoding="utf-8")
print(f"Banko inactive-player patch applied: {path}")
