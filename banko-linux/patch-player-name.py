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
    '''            <div id="joinBox" style="display:none !important">\n              <input id="nameInput" autocomplete="off" tabindex="-1" aria-hidden="true" />\n              <button id="joinBtn" type="button" tabindex="-1" aria-hidden="true">TILMELD</button>\n            </div>''',
    "hidden automatic join form",
)

rep(
    '''        function joinWithPubId() {\n          const code = String(els.nameInput.value || "").replace(/\\D/g, "").slice(0, 4);\n          els.nameInput.value = code;\n          if (!/^\\d{4}$/.test(code)) return;\n          const name = "Pub-ID " + code;\n          localStorage.setItem("pubbanko_name", name);\n          localStorage.setItem("pubbanko_pub_id", code);\n          socket.emit("player:join", { name, sessionId: currentSessionId });\n          showWaitingMode();\n        }\n\n        els.nameInput?.addEventListener("input", () => {\n          els.nameInput.value = els.nameInput.value.replace(/\\D/g, "").slice(0, 4);\n        });\n        els.joinBtn?.addEventListener("click", joinWithPubId);''',
    '''        function joinWithName() {\n          if (!pubIdFromUrl) return;\n          const name = "Pub-ID " + pubIdFromUrl;\n          els.nameInput.value = name;\n          sessionStorage.setItem("pubbanko_name", name);\n          sessionStorage.setItem("pubbanko_pub_id", pubIdFromUrl);\n          socket.emit("player:join", { name, sessionId: currentSessionId });\n          showWaitingMode();\n        }\n\n        els.joinBtn?.addEventListener("click", joinWithName);\n        els.nameInput?.addEventListener("keydown", (event) => {\n          if (event.key === "Enter") joinWithName();\n        });''',
    "automatic Pub-ID join handler",
)

rep(
    '''        socket.on("connect", () => {\n          if (isHost) return;\n          const savedName = localStorage.getItem("pubbanko_name");\n          const savedPubId = localStorage.getItem("pubbanko_pub_id");\n\n          if (pubIdFromUrl) {\n            els.nameInput.value = pubIdFromUrl;\n            if (savedName && savedPubId === pubIdFromUrl) {\n              socket.emit("player:resume", { sessionId: currentSessionId });\n            } else {\n              localStorage.removeItem("pubbanko_name");\n              localStorage.setItem("pubbanko_pub_id", pubIdFromUrl);\n              joinWithPubId();\n            }\n            return;\n          }\n\n          if (savedName) socket.emit("player:resume", { sessionId: currentSessionId });\n        });''',
    '''        socket.on("connect", () => {\n          if (isHost || !pubIdFromUrl) return;\n          joinWithName();\n        });''',
    "automatic join on connect",
)

rep(
    '''              const savedName = localStorage.getItem("pubbanko_name");\n              if (savedName) {\n                els.playerLanding.classList.add("hidden");\n                els.mainGrid.classList.remove("hidden");\n              }''',
    '''              if (pubIdFromUrl) {\n                els.playerLanding.classList.add("hidden");\n                els.mainGrid.classList.remove("hidden");\n              }''',
    "render automatic Pub-ID player",
)

rep(
    '''        const savedName = localStorage.getItem("pubbanko_name");\n        const savedPubId = localStorage.getItem("pubbanko_pub_id");\n        if (!isHost && /^\\d{4}$/.test(pubIdFromUrl || savedPubId || "")) {\n          els.nameInput.value = pubIdFromUrl || savedPubId;\n        } else if (savedName && !isHost) {\n          els.nameInput.value = savedName.replace(/^Pub-ID\\s+/, "");\n        }''',
    '''        if (!isHost && pubIdFromUrl) {\n          els.nameInput.value = "Pub-ID " + pubIdFromUrl;\n        }''',
    "prepare automatic Pub-ID name",
)

path.write_text(text, encoding="utf-8")
print(f"Banko automatic Pub-ID join patch applied: {path}")
