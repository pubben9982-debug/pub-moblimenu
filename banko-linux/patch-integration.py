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
    "  usedBoardKeys: new Set(),\n  autoDrawEnabled: false,",
    "  usedBoardKeys: new Set(),\n  bankoActive: false,\n  autoDrawEnabled: false,",
    "state bankoActive",
)

rep(
    "    claimPause: state.claimPause,\n    players: publicPlayers(),",
    "    claimPause: state.claimPause,\n    bankoActive: state.bankoActive,\n    players: publicPlayers(),",
    "emit bankoActive",
)

rep(
    "function drawNext() {\n  const remaining = state.numbers.filter((n) => !state.drawn.includes(n));",
    "function drawNext() {\n  if (!state.bankoActive) return null;\n  const remaining = state.numbers.filter((n) => !state.drawn.includes(n));",
    "draw requires active",
)

rep(
    "function startAutoDraw(seconds) {\n  const safeSeconds = normalizeAutoDrawSeconds(seconds);",
    "function startAutoDraw(seconds) {\n  if (!state.bankoActive) return;\n  const safeSeconds = normalizeAutoDrawSeconds(seconds);",
    "auto requires active",
)

rep(
    'io.on("connection", (socket) => {\n  socket.on("player:join", ({ name, sessionId }) => {',
    'io.on("connection", (socket) => {\n  const authHost = String(socket.handshake.query.host || "") === "1";\n  const authPin = String(socket.handshake.query.pin || "");\n  const configuredBartenderPin = String(process.env.BARTENDER_PIN || "");\n  socket.data.isHost = Boolean(configuredBartenderPin) && authHost && authPin === configuredBartenderPin;\n\n  socket.on("player:join", ({ name, sessionId }) => {',
    "socket host auth",
)

rep(
    '''  socket.on("host:draw", () => {\n    if (state.claimPause) return;\n    drawNext();\n  });\n  socket.on("host:reset", () => resetGame());\n  socket.on("host:setAutoDraw", ({ enabled, seconds }) => {\n    if (state.claimPause && enabled) return;\n    if (enabled) startAutoDraw(seconds);\n    else stopAutoDraw();\n  });''',
    '''  socket.on("host:setActive", ({ active }) => {\n    if (!socket.data.isHost) return;\n    state.bankoActive = !!active;\n    if (!state.bankoActive) {\n      stopAutoDraw(false);\n      clearClaimTimers();\n      state.claimPause = null;\n    }\n    emitState();\n  });\n\n  socket.on("host:draw", () => {\n    if (!socket.data.isHost || state.claimPause || !state.bankoActive) return;\n    drawNext();\n  });\n  socket.on("host:reset", () => {\n    if (!socket.data.isHost) return;\n    resetGame();\n  });\n  socket.on("host:setAutoDraw", ({ enabled, seconds }) => {\n    if (!socket.data.isHost) return;\n    if (state.claimPause && enabled) return;\n    if (enabled) startAutoDraw(seconds);\n    else stopAutoDraw();\n  });''',
    "host core events",
)

rep(
    '  socket.on("host:setBoardCount", ({ playerId, boardCount }) => {\n    const player = state.players.get(playerId);',
    '  socket.on("host:setBoardCount", ({ playerId, boardCount }) => {\n    if (!socket.data.isHost) return;\n    const player = state.players.get(playerId);',
    "host board count auth",
)

rep(
    '  socket.on("host:setUiOptions", ({ showBingoButton, showLastNumberOnPlayer }) => {\n    state.showBingoButton = !!showBingoButton;',
    '  socket.on("host:setUiOptions", ({ showBingoButton, showLastNumberOnPlayer }) => {\n    if (!socket.data.isHost) return;\n    state.showBingoButton = !!showBingoButton;',
    "host options auth",
)

rep(
    '  socket.on("player:bingo", () => {\n    const player = state.players.get(socket.id);\n    if (!player || !player.approved) return;',
    '  socket.on("player:bingo", () => {\n    const player = state.players.get(socket.id);\n    if (!state.bankoActive || !player || !player.approved) return;',
    "bingo requires active",
)

rep(
    'app.get("/", (_req, res) => res.send(html()));\napp.get("/health", (_req, res) => res.json({ ok: true, players: state.players.size, drawn: state.drawn.length }));',
    '''app.get("/", (req, res) => {\n  const configuredBartenderPin = String(process.env.BARTENDER_PIN || "");\n  if (String(req.query.host || "") === "1" && (!configuredBartenderPin || String(req.query.pin || "") !== configuredBartenderPin)) {\n    return res.status(403).send("Forkert bartenderkode");\n  }\n  res.send(html());\n});\napp.get("/health", (_req, res) => res.json({ ok: true, active: state.bankoActive, players: state.players.size, drawn: state.drawn.length }));\napp.get("/api/status", (_req, res) => {\n  res.set("Access-Control-Allow-Origin", "*");\n  res.json({ ok: true, active: state.bankoActive, players: state.players.size, drawn: state.drawn.length, gameId: state.gameId });\n});''',
    "routes and status",
)

rep(
    '''            <div id="joinBox">\n              <input id="nameInput" placeholder="Login" maxlength="30" />\n              <button id="joinBtn">Login</button>\n            </div>''',
    '''            <div id="inactiveBox" class="claim info hidden" style="margin:0 0 16px">\n              <strong>BANKO ER IKKE AKTIVT</strong><br>\n              Vent til bartenderen åbner spillet.\n            </div>\n            <div id="joinBox">\n              <input id="nameInput" inputmode="numeric" placeholder="Pub-ID" maxlength="4" />\n              <button id="joinBtn">TILMELD</button>\n            </div>''',
    "player login pubid",
)

rep(
    '''            <h2>Vært</h2>\n            <div class="claim info" style="margin:0 0 14px">''',
    '''            <h2>Banko-styring</h2>\n            <div class="toggle-box" style="margin-bottom:14px">\n              <div class="toggle-row">\n                <div><strong>Banko for gæster</strong><div id="bankoActiveText" class="muted">IKKE AKTIVT</div></div>\n                <label><input id="bankoActive" type="checkbox"> Åbn Banko</label>\n              </div>\n            </div>\n            <div class="claim info" style="margin:0 0 14px">''',
    "host active toggle html",
)

rep(
    '''        const socket = io({ reconnection: true, reconnectionAttempts: Infinity, reconnectionDelay: 500, reconnectionDelayMax: 3000 });\n        const params = new URLSearchParams(window.location.search);\n        const isHost = params.get("host") === "1";''',
    '''        const params = new URLSearchParams(window.location.search);\n        const isHost = params.get("host") === "1";\n        const hostPin = params.get("pin") || "";\n        const pubIdFromUrl = /^\\\\d{4}$/.test(params.get("id") || "") ? params.get("id") : "";\n        const socket = io({\n          reconnection: true,\n          reconnectionAttempts: Infinity,\n          reconnectionDelay: 500,\n          reconnectionDelayMax: 3000,\n          query: { host: isHost ? "1" : "0", pin: isHost ? hostPin : "" }\n        });''',
    "client socket auth",
)

rep(
    '          playerLanding: document.getElementById("playerLanding"),\n          heroBox: document.getElementById("heroBox"),',
    '          playerLanding: document.getElementById("playerLanding"),\n          inactiveBox: document.getElementById("inactiveBox"),\n          joinBox: document.getElementById("joinBox"),\n          heroBox: document.getElementById("heroBox"),',
    "els inactive",
)

rep(
    '          hostView: document.getElementById("hostView"),\n          lastNumber: document.getElementById("lastNumber"),',
    '          hostView: document.getElementById("hostView"),\n          bankoActive: document.getElementById("bankoActive"),\n          bankoActiveText: document.getElementById("bankoActiveText"),\n          lastNumber: document.getElementById("lastNumber"),',
    "els host active",
)

rep(
    '        els.toggleBingo?.addEventListener("change", sendUiOptions);\n        els.toggleLastNumber?.addEventListener("change", sendUiOptions);',
    '        els.toggleBingo?.addEventListener("change", sendUiOptions);\n        els.toggleLastNumber?.addEventListener("change", sendUiOptions);\n        els.bankoActive?.addEventListener("change", () => socket.emit("host:setActive", { active: els.bankoActive.checked }));',
    "active listener",
)

rep(
    '''        els.joinBtn?.addEventListener("click", () => {\n          const name = els.nameInput.value.trim() || "Spiller";\n          localStorage.setItem("pubbanko_name", name);\n          socket.emit("player:join", { name, sessionId: currentSessionId });\n          showWaitingMode();\n        });''',
    '''        function joinWithPubId() {\n          const code = String(els.nameInput.value || "").replace(/\\D/g, "").slice(0, 4);\n          els.nameInput.value = code;\n          if (!/^\\d{4}$/.test(code)) return;\n          const name = "Pub-ID " + code;\n          localStorage.setItem("pubbanko_name", name);\n          localStorage.setItem("pubbanko_pub_id", code);\n          socket.emit("player:join", { name, sessionId: currentSessionId });\n          showWaitingMode();\n        }\n\n        els.nameInput?.addEventListener("input", () => {\n          els.nameInput.value = els.nameInput.value.replace(/\\D/g, "").slice(0, 4);\n        });\n        els.joinBtn?.addEventListener("click", joinWithPubId);''',
    "join pub id",
)

rep(
    '''        socket.on("connect", () => {\n          if (isHost) return;\n          const savedName = localStorage.getItem("pubbanko_name");\n          if (savedName) socket.emit("player:resume", { sessionId: currentSessionId });\n        });''',
    '''        socket.on("connect", () => {\n          if (isHost) return;\n          const savedName = localStorage.getItem("pubbanko_name");\n          if (savedName) socket.emit("player:resume", { sessionId: currentSessionId });\n          else if (pubIdFromUrl) {\n            els.nameInput.value = pubIdFromUrl;\n            joinWithPubId();\n          }\n        });''',
    "auto join url pubid",
)

rep(
    '        socket.on("state:update", ({ drawn, lastNumber, remaining, playerCount, players, showBingoButton, showLastNumberOnPlayer, lastClaim, autoDrawEnabled, autoDrawSeconds, claimPause }) => {',
    '        socket.on("state:update", ({ drawn, lastNumber, remaining, playerCount, players, showBingoButton, showLastNumberOnPlayer, lastClaim, autoDrawEnabled, autoDrawSeconds, claimPause, bankoActive }) => {',
    "state callback banko active",
)

rep(
    '''          if (isHost) {\n            els.toggleBingo.checked = !!showBingoButton;\n            els.toggleLastNumber.checked = !!showLastNumberOnPlayer;''',
    '''          if (isHost) {\n            els.toggleBingo.checked = !!showBingoButton;\n            els.toggleLastNumber.checked = !!showLastNumberOnPlayer;\n            els.bankoActive.checked = !!bankoActive;\n            els.bankoActiveText.textContent = bankoActive ? "AKTIVT – gæster kan spille" : "IKKE AKTIVT";\n            els.drawBtn.disabled = !bankoActive;\n            els.autoDrawBtn.disabled = !bankoActive;''',
    "host render active",
)

rep(
    '''          } else {\n            if (showBingoButton) els.bingoBtn.classList.remove("hidden");''',
    '''          } else {\n            if (!bankoActive) {\n              els.playerLanding.classList.remove("hidden");\n              els.inactiveBox.classList.remove("hidden");\n              els.joinBox.classList.add("hidden");\n              els.mainGrid.classList.add("hidden");\n            } else {\n              els.inactiveBox.classList.add("hidden");\n              els.joinBox.classList.remove("hidden");\n              const savedName = localStorage.getItem("pubbanko_name");\n              if (savedName) {\n                els.playerLanding.classList.add("hidden");\n                els.mainGrid.classList.remove("hidden");\n              }\n            }\n            if (showBingoButton) els.bingoBtn.classList.remove("hidden");''',
    "player active rendering",
)

rep(
    '        const savedName = localStorage.getItem("pubbanko_name");\n        if (savedName && !isHost) els.nameInput.value = savedName;',
    '''        const savedName = localStorage.getItem("pubbanko_name");\n        const savedPubId = localStorage.getItem("pubbanko_pub_id");\n        if (!isHost && /^\\d{4}$/.test(pubIdFromUrl || savedPubId || "")) {\n          els.nameInput.value = pubIdFromUrl || savedPubId;\n        } else if (savedName && !isHost) {\n          els.nameInput.value = savedName.replace(/^Pub-ID\\s+/, "");\n        }''',
    "saved pub id",
)

path.write_text(text, encoding="utf-8")
print(f"Banko integration patch applied: {path}")
