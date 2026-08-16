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


# Keep the player's requested board count separately from the bartender-approved count.
rep(
    '''      boardCount: 0,\n      approved: false,\n      boards: [],''',
    '''      boardCount: 0,\n      requestedBoardCount: 0,\n      approved: false,\n      boards: [],''',
    "player requested board count",
)

# A player may request 1-6 boards in the current test UI. This does not approve
# boards and does not perform any payment or Pub-ID credit debit.
rep(
    '''  socket.on("host:setActive", ({ active }) => {''',
    '''  socket.on("player:requestBoards", ({ boardCount }) => {\n    if (!state.bankoActive) return;\n    const player = state.players.get(socket.id);\n    if (!player || player.approved) return;\n    const requested = Math.max(1, Math.min(6, Math.floor(Number(boardCount) || 1)));\n    player.requestedBoardCount = requested;\n    emitState();\n  });\n\n  socket.on("host:setActive", ({ active }) => {''',
    "player board request event",
)

# Clear a pending request when the bartender approves/generates boards.
rep(
    '''    player.boardCount = safeCount;\n    player.approved = true;''',
    '''    player.requestedBoardCount = 0;\n    player.boardCount = safeCount;\n    player.approved = true;''',
    "clear request on approval",
)

# Let the bartender UI see what the guest requested.
rep(
    '''    boardCount: player.boardCount,\n    approved: player.approved,''',
    '''    boardCount: player.boardCount,\n    requestedBoardCount: player.requestedBoardCount || 0,\n    approved: player.approved,''',
    "public requested board count",
)

# Let the player's private state decide whether to show board selection or waiting.
rep(
    '''      approved: player.approved,\n      bankoActive: state.bankoActive,''',
    '''      approved: player.approved,\n      requestedBoardCount: player.requestedBoardCount || 0,\n      bankoActive: state.bankoActive,''',
    "private requested board count",
)

# Mobile board-selection and result-notice styling.
rep(
    '''        .login-box { width:100%; max-width:420px; margin:0 auto; }''',
    '''        .login-box { width:100%; max-width:420px; margin:0 auto; }\n        .board-shop { width:100%; max-width:520px; margin:0 auto; text-align:center; }\n        .board-choice-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin:18px 0; }\n        .board-choice { background:rgba(255,255,255,0.12); color:white; border:2px solid transparent; font-size:22px; font-weight:800; }\n        .board-choice.selected { border-color:var(--accent); background:rgba(245,158,11,0.22); }\n        .board-shop-note { margin-top:14px; font-size:14px; line-height:1.45; }\n        #bingoNotice { overflow-y:auto !important; -webkit-overflow-scrolling:touch; overscroll-behavior:contain; padding:16px; }\n        #bingoNoticeCard { box-sizing:border-box; width:min(100%,520px); max-height:calc(100vh - 32px); max-height:calc(100dvh - 32px); overflow-y:auto; -webkit-overflow-scrolling:touch; overscroll-behavior:contain; }''',
    "board shop and mobile result styles",
)

# Insert the board-selection step before the existing waiting screen.
rep(
    '''          <section class="panel" id="playerView">\n            <div id="waitingBox" class="hidden waiting">\n              <div class="waiting-card">\n                <h2>Venter på bartender…</h2>\n                <p>Dine plader bliver vist her, så snart bartenderen har godkendt og valgt antal plader.</p>\n              </div>\n            </div>''',
    '''          <section class="panel" id="playerView">\n            <div id="boardShopBox" class="hidden waiting">\n              <div class="waiting-card board-shop">\n                <h2>Vælg plader</h2>\n                <p>Hvor mange Banko-plader vil du spille med?</p>\n                <div class="board-choice-grid" id="boardChoiceGrid">\n                  <button type="button" class="board-choice selected" data-board-count="1">1</button>\n                  <button type="button" class="board-choice" data-board-count="2">2</button>\n                  <button type="button" class="board-choice" data-board-count="3">3</button>\n                  <button type="button" class="board-choice" data-board-count="4">4</button>\n                  <button type="button" class="board-choice" data-board-count="5">5</button>\n                  <button type="button" class="board-choice" data-board-count="6">6</button>\n                </div>\n                <p>Valgt: <strong id="selectedBoardCount">1 plade</strong></p>\n                <button type="button" id="requestBoardsBtn">BESTIL PLADER</button>\n                <p class="muted board-shop-note"><strong>TEST:</strong> Pris 0 kr. Der trækkes ikke penge, klip eller ID-kredit.</p>\n              </div>\n            </div>\n\n            <div id="waitingBox" class="hidden waiting">\n              <div class="waiting-card">\n                <h2>Venter på bartender…</h2>\n                <p id="waitingText">Din bestilling er sendt. Pladerne vises, når bartenderen har godkendt.</p>\n              </div>\n            </div>''',
    "board shop html",
)

# Register the new elements.
rep(
    '''          playerLanding: document.getElementById("playerLanding"),\n          inactiveBox: document.getElementById("inactiveBox"),\n          joinBox: document.getElementById("joinBox"),\n          heroBox: document.getElementById("heroBox"),''',
    '''          playerLanding: document.getElementById("playerLanding"),\n          inactiveBox: document.getElementById("inactiveBox"),\n          joinBox: document.getElementById("joinBox"),\n          boardShopBox: document.getElementById("boardShopBox"),\n          boardChoiceGrid: document.getElementById("boardChoiceGrid"),\n          selectedBoardCount: document.getElementById("selectedBoardCount"),\n          requestBoardsBtn: document.getElementById("requestBoardsBtn"),\n          waitingText: document.getElementById("waitingText"),\n          heroBox: document.getElementById("heroBox"),''',
    "board shop elements",
)

# Add a dedicated mode between name entry and bartender approval.
rep(
    '''        function showHostMode() {\n          els.playerLanding.classList.add("hidden");\n          els.heroBox.classList.remove("hidden");\n          els.mainGrid.classList.remove("hidden");\n          els.waitingBox.classList.add("hidden");\n          els.playerBox.classList.add("hidden");\n        }\n\n        function showWaitingMode() {\n          els.playerLanding.classList.add("hidden");\n          els.mainGrid.classList.remove("hidden");\n          els.playerView.classList.remove("hidden");\n          els.waitingBox.classList.remove("hidden");\n          els.playerBox.classList.add("hidden");\n          els.hostView.classList.add("hidden");\n        }''',
    '''        function showHostMode() {\n          els.playerLanding.classList.add("hidden");\n          els.heroBox.classList.remove("hidden");\n          els.mainGrid.classList.remove("hidden");\n          els.boardShopBox.classList.add("hidden");\n          els.waitingBox.classList.add("hidden");\n          els.playerBox.classList.add("hidden");\n        }\n\n        function showBoardShopMode() {\n          els.playerLanding.classList.add("hidden");\n          els.heroBox.classList.add("hidden");\n          els.mainGrid.classList.remove("hidden");\n          els.playerView.classList.remove("hidden");\n          els.boardShopBox.classList.remove("hidden");\n          els.waitingBox.classList.add("hidden");\n          els.playerBox.classList.add("hidden");\n          els.hostView.classList.add("hidden");\n        }\n\n        function showWaitingMode(requestedCount) {\n          els.playerLanding.classList.add("hidden");\n          els.mainGrid.classList.remove("hidden");\n          els.playerView.classList.remove("hidden");\n          els.boardShopBox.classList.add("hidden");\n          els.waitingBox.classList.remove("hidden");\n          els.playerBox.classList.add("hidden");\n          els.hostView.classList.add("hidden");\n          const count = Math.max(0, Math.floor(Number(requestedCount) || 0));\n          if (els.waitingText && count) {\n            els.waitingText.textContent = "Du har valgt " + count + " plade" + (count === 1 ? "" : "r") + ". Pladerne vises, når bartenderen har godkendt.";\n          }\n        }''',
    "board shop modes",
)

# After entering a name, go to board selection instead of the waiting screen.
rep(
    '''          socket.emit("player:join", { name, sessionId: currentSessionId });\n          showWaitingMode();''',
    '''          socket.emit("player:join", { name, sessionId: currentSessionId });\n          showBoardShopMode();''',
    "join goes to board shop",
)

# Selection controls and request button.
rep(
    '''        els.nameInput?.addEventListener("keydown", (event) => {\n          if (event.key === "Enter") joinWithName();\n        });''',
    '''        els.nameInput?.addEventListener("keydown", (event) => {\n          if (event.key === "Enter") joinWithName();\n        });\n\n        let selectedBoardCount = 1;\n        function renderBoardChoice() {\n          document.querySelectorAll("[data-board-count]").forEach((button) => {\n            const value = Number(button.dataset.boardCount || 0);\n            button.classList.toggle("selected", value === selectedBoardCount);\n          });\n          if (els.selectedBoardCount) {\n            els.selectedBoardCount.textContent = selectedBoardCount + " plade" + (selectedBoardCount === 1 ? "" : "r");\n          }\n        }\n\n        els.boardChoiceGrid?.addEventListener("click", (event) => {\n          const button = event.target.closest("[data-board-count]");\n          if (!button) return;\n          const value = Math.max(1, Math.min(6, Math.floor(Number(button.dataset.boardCount) || 1)));\n          selectedBoardCount = value;\n          renderBoardChoice();\n        });\n\n        els.requestBoardsBtn?.addEventListener("click", () => {\n          sessionStorage.setItem("pubbanko_requested_boards", String(selectedBoardCount));\n          socket.emit("player:requestBoards", { boardCount: selectedBoardCount });\n          showWaitingMode(selectedBoardCount);\n        });\n        renderBoardChoice();''',
    "board shop controls",
)

# Restore the right player screen from authoritative server state.
rep(
    '''        socket.on("player:boards", ({ boards, approved, bankoActive, lastNumber, showBingoButton, showLastNumberOnPlayer }) => {\n          if (isHost) return;\n          if (!bankoActive) return;\n          if (!approved) { showWaitingMode(); return; }\n\n          els.waitingBox.classList.add("hidden");\n          els.playerBox.classList.remove("hidden");''',
    '''        socket.on("player:boards", ({ boards, approved, requestedBoardCount, bankoActive, lastNumber, showBingoButton, showLastNumberOnPlayer }) => {\n          if (isHost) return;\n          if (!bankoActive) return;\n          if (!approved) {\n            const requested = Math.max(0, Math.floor(Number(requestedBoardCount) || 0));\n            if (requested > 0) {\n              selectedBoardCount = Math.max(1, Math.min(6, requested));\n              renderBoardChoice();\n              showWaitingMode(requested);\n            } else {\n              showBoardShopMode();\n            }\n            return;\n          }\n\n          sessionStorage.removeItem("pubbanko_requested_boards");\n          els.boardShopBox.classList.add("hidden");\n          els.waitingBox.classList.add("hidden");\n          els.playerBox.classList.remove("hidden");''',
    "player board state routing",
)

# Bartender sees the requested amount and gets it prefilled for approval.
rep(
    '''            name.textContent = player.name + (player.approved ? " ✅" : " ⏳");''',
    '''            const requestedCount = Math.max(0, Math.floor(Number(player.requestedBoardCount) || 0));\n            name.textContent = player.name + (player.approved ? " ✅" : requestedCount ? " · ønsker " + requestedCount + " plade" + (requestedCount === 1 ? "" : "r") + " ⏳" : " · vælger plader… ⏳");''',
    "host requested board label",
)

rep(
    '''            input.value = player.boardCount || 1;''',
    '''            input.value = player.boardCount || requestedCount || 1;''',
    "host requested board prefill",
)

path.write_text(text, encoding="utf-8")
print(f"Banko player board-shop patch applied: {path}")
