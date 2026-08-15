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
    '''            <div id="joinBox">\n              <input id="nameInput" inputmode="numeric" placeholder="Pub-ID" maxlength="4" />\n              <button id="joinBtn">TILMELD</button>\n            </div>''',
    '''            <div id="joinBox">\n              <div class="muted" style="margin-bottom:8px">Dit Pub-ID er allerede hentet fra mobilmenuen.</div>\n              <input id="nameInput" autocomplete="name" placeholder="Dit navn" maxlength="30" />\n              <button id="joinBtn">TILMELD</button>\n            </div>''',
    "name-only join form",
)

rep(
    '''        function joinWithPubId() {\n          const code = String(els.nameInput.value || "").replace(/\\D/g, "").slice(0, 4);\n          els.nameInput.value = code;\n          if (!/^\\d{4}$/.test(code)) return;\n          const name = "Pub-ID " + code;\n          localStorage.setItem("pubbanko_name", name);\n          localStorage.setItem("pubbanko_pub_id", code);\n          socket.emit("player:join", { name, sessionId: currentSessionId });\n          showWaitingMode();\n        }\n\n        els.nameInput?.addEventListener("input", () => {\n          els.nameInput.value = els.nameInput.value.replace(/\\D/g, "").slice(0, 4);\n        });\n        els.joinBtn?.addEventListener("click", joinWithPubId);''',
    '''        function joinWithName() {\n          const name = String(els.nameInput.value || "").trim().slice(0, 30);\n          if (!pubIdFromUrl || !name) return;\n          els.nameInput.value = name;\n          localStorage.setItem("pubbanko_name", name);\n          localStorage.setItem("pubbanko_pub_id", pubIdFromUrl);\n          socket.emit("player:join", { name, sessionId: currentSessionId });\n          showWaitingMode();\n        }\n\n        els.joinBtn?.addEventListener("click", joinWithName);\n        els.nameInput?.addEventListener("keydown", (event) => {\n          if (event.key === "Enter") joinWithName();\n        });''',
    "name-only join handler",
)

rep(
    '''        socket.on("connect", () => {\n          if (isHost) return;\n          const savedName = localStorage.getItem("pubbanko_name");\n          if (savedName) socket.emit("player:resume", { sessionId: currentSessionId });\n          else if (pubIdFromUrl) {\n            els.nameInput.value = pubIdFromUrl;\n            joinWithPubId();\n          }\n        });''',
    '''        socket.on("connect", () => {\n          if (isHost) return;\n          const savedName = localStorage.getItem("pubbanko_name");\n          const savedPubId = localStorage.getItem("pubbanko_pub_id");\n          if (savedName && pubIdFromUrl && savedPubId === pubIdFromUrl) {\n            socket.emit("player:resume", { sessionId: currentSessionId });\n          }\n        });''',
    "resume only same Pub-ID",
)

rep(
    '''              const savedName = localStorage.getItem("pubbanko_name");\n              if (savedName) {\n                els.playerLanding.classList.add("hidden");\n                els.mainGrid.classList.remove("hidden");\n              }''',
    '''              const savedName = localStorage.getItem("pubbanko_name");\n              const savedPubId = localStorage.getItem("pubbanko_pub_id");\n              if (savedName && pubIdFromUrl && savedPubId === pubIdFromUrl) {\n                els.playerLanding.classList.add("hidden");\n                els.mainGrid.classList.remove("hidden");\n              }''',
    "render only same Pub-ID",
)

rep(
    '''        const savedName = localStorage.getItem("pubbanko_name");\n        const savedPubId = localStorage.getItem("pubbanko_pub_id");\n        if (!isHost && /^\\d{4}$/.test(pubIdFromUrl || savedPubId || "")) {\n          els.nameInput.value = pubIdFromUrl || savedPubId;\n        } else if (savedName && !isHost) {\n          els.nameInput.value = savedName.replace(/^Pub-ID\\s+/, "");\n        }''',
    '''        const savedName = localStorage.getItem("pubbanko_name");\n        const savedPubId = localStorage.getItem("pubbanko_pub_id");\n        if (!isHost && savedName && pubIdFromUrl && savedPubId === pubIdFromUrl) {\n          els.nameInput.value = savedName;\n        } else if (!isHost) {\n          els.nameInput.value = "";\n        }''',
    "prefill saved name only",
)

path.write_text(text, encoding="utf-8")
print(f"Banko name/Pub-ID patch applied: {path}")
