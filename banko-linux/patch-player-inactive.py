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

rep(
    '''        socket.on("connect", () => {\n          if (isHost) return;\n          const savedName = localStorage.getItem("pubbanko_name");\n          if (savedName) socket.emit("player:resume", { sessionId: currentSessionId });\n          else if (pubIdFromUrl) {\n            els.nameInput.value = pubIdFromUrl;\n            joinWithPubId();\n          }\n        });''',
    '''        socket.on("connect", () => {\n          if (isHost) return;\n          const savedName = localStorage.getItem("pubbanko_name");\n          const savedPubId = localStorage.getItem("pubbanko_pub_id");\n\n          if (pubIdFromUrl) {\n            els.nameInput.value = pubIdFromUrl;\n            if (savedName && savedPubId === pubIdFromUrl) {\n              socket.emit("player:resume", { sessionId: currentSessionId });\n            } else {\n              localStorage.removeItem("pubbanko_name");\n              localStorage.setItem("pubbanko_pub_id", pubIdFromUrl);\n              joinWithPubId();\n            }\n            return;\n          }\n\n          if (savedName) socket.emit("player:resume", { sessionId: currentSessionId });\n        });''',
    "automatic Pub-ID join",
)

rep(
    '''              <strong>⚠️ Regler før Banko startes</strong><br>\n              Denne version er til test. Slå ikke betaling eller præmier til, før den konkrete Banko-model og de nødvendige tilladelser er afklaret. Bartenderen er ansvarlig for kun at starte Banko efter pubbens gældende regler og instruktioner.''',
    '''              <strong>⚠️ Regler før Banko startes</strong>\n              <ul style="text-align:left;margin:9px 0 0;padding-left:22px;line-height:1.5">\n                <li><strong>TEST KUN:</strong> Ingen betaling, ID-kredit/klip eller præmier med økonomisk værdi.</li>\n                <li>Hvis et Banko-spil senere kombinerer indskud, tilfældighed og gevinstchance, kræver det som udgangspunkt tilladelse fra Spillemyndigheden.</li>\n                <li>Vores model bruger telefonen som spilleplade. Den konkrete juridiske klassifikation skal afklares, før økonomi eller gevinster kobles på.</li>\n                <li>Er du i tvivl: start kun gratis testspil og spørg den ansvarlige.</li>\n              </ul>''',
    "visible bartender rules",
)

path.write_text(text, encoding="utf-8")
print(f"Banko inactive-player/rules/Pub-ID patch applied: {path}")
