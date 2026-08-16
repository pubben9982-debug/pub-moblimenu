#!/usr/bin/env python3
from pathlib import Path
import re
import sys

path = Path(sys.argv[1] if len(sys.argv) > 1 else "runtime/server.js")
text = path.read_text(encoding="utf-8")


def rep(old, new, label):
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"Patch fejl ({label}): forventede 1 match, fandt {count}")
    text = text.replace(old, new, 1)


# Allow a practical typed board count while keeping a server-side ceiling.
text, max_count = re.subn(
    r"const MAX_BOARDS_PER_PLAYER\s*=\s*\d+;",
    "const MAX_BOARDS_PER_PLAYER = 50;",
    text,
    count=1,
)
if max_count != 1:
    raise SystemExit(f"Patch fejl (max boards): forventede 1 match, fandt {max_count}")

rep(
    '''    const requested = Math.max(1, Math.min(6, Math.floor(Number(boardCount) || 1)));''',
    '''    const requested = Math.max(1, Math.min(MAX_BOARDS_PER_PLAYER, Math.floor(Number(boardCount) || 1)));''',
    "requested board count max",
)

# Replace the six preset buttons with one numeric field.
rep(
    '''                <div class="board-choice-grid" id="boardChoiceGrid">\n                  <button type="button" class="board-choice selected" data-board-count="1">1</button>\n                  <button type="button" class="board-choice" data-board-count="2">2</button>\n                  <button type="button" class="board-choice" data-board-count="3">3</button>\n                  <button type="button" class="board-choice" data-board-count="4">4</button>\n                  <button type="button" class="board-choice" data-board-count="5">5</button>\n                  <button type="button" class="board-choice" data-board-count="6">6</button>\n                </div>''',
    '''                <div class="board-choice-grid" id="boardChoiceGrid">\n                  <label class="board-count-label" for="boardCountInput">Antal plader</label>\n                  <input id="boardCountInput" class="board-count-input" type="number" inputmode="numeric" min="1" max="50" step="1" value="1" />\n                </div>''',
    "typed board count html",
)

rep(
    '''        .board-shop-note { margin-top:14px; font-size:14px; line-height:1.45; }''',
    '''        .board-shop-note { margin-top:14px; font-size:14px; line-height:1.45; }\n        .board-count-label { grid-column:1/-1; font-weight:800; }\n        .board-count-input { grid-column:1/-1; width:100%; min-height:54px; border-radius:12px; border:2px solid rgba(255,255,255,0.24); background:rgba(255,255,255,0.10); color:white; text-align:center; font-size:28px; font-weight:900; padding:8px 12px; }''',
    "typed board count styles",
)

rep(
    '''        function renderBoardChoice() {\n          document.querySelectorAll("[data-board-count]").forEach((button) => {\n            const value = Number(button.dataset.boardCount || 0);\n            button.classList.toggle("selected", value === selectedBoardCount);\n          });\n          if (els.selectedBoardCount) {\n            els.selectedBoardCount.textContent = selectedBoardCount + " plade" + (selectedBoardCount === 1 ? "" : "r");\n          }\n        }''',
    '''        function renderBoardChoice() {\n          const input = document.getElementById("boardCountInput");\n          if (input && document.activeElement !== input) input.value = String(selectedBoardCount);\n          if (els.selectedBoardCount) {\n            els.selectedBoardCount.textContent = selectedBoardCount + " plade" + (selectedBoardCount === 1 ? "" : "r");\n          }\n        }''',
    "typed board count render",
)

rep(
    '''        els.requestBoardsBtn?.addEventListener("click", () => {\n          sessionStorage.setItem("pubbanko_requested_boards", String(selectedBoardCount));\n          socket.emit("player:requestBoards", { boardCount: selectedBoardCount });\n          showWaitingMode(selectedBoardCount);\n        });\n        renderBoardChoice();''',
    '''        const boardCountInput = document.getElementById("boardCountInput");\n        boardCountInput?.addEventListener("input", () => {\n          const parsed = Math.floor(Number(boardCountInput.value) || 0);\n          if (parsed >= 1) {\n            selectedBoardCount = Math.max(1, Math.min(50, parsed));\n            if (els.selectedBoardCount) {\n              els.selectedBoardCount.textContent = selectedBoardCount + " plade" + (selectedBoardCount === 1 ? "" : "r");\n            }\n          }\n        });\n\n        els.requestBoardsBtn?.addEventListener("click", () => {\n          const parsed = Math.floor(Number(boardCountInput?.value) || selectedBoardCount || 1);\n          selectedBoardCount = Math.max(1, Math.min(50, parsed));\n          if (boardCountInput) boardCountInput.value = String(selectedBoardCount);\n          sessionStorage.setItem("pubbanko_requested_boards", String(selectedBoardCount));\n          socket.emit("player:requestBoards", { boardCount: selectedBoardCount });\n          showWaitingMode(selectedBoardCount);\n        });\n        renderBoardChoice();''',
    "typed board count controls",
)

rep(
    '''              selectedBoardCount = Math.max(1, Math.min(6, requested));''',
    '''              selectedBoardCount = Math.max(1, Math.min(50, requested));''',
    "restore typed board count",
)

# Auto draw: accept any whole-second interval from 1 to 60 seconds.
rep(
    '''function normalizeAutoDrawSeconds(seconds) {\n  const parsed = Math.floor(Number(seconds) || 10);\n  return parsed === 20 ? 20 : 10;\n}''',
    '''function normalizeAutoDrawSeconds(seconds) {\n  const parsed = Math.floor(Number(seconds) || 10);\n  return Math.max(1, Math.min(60, parsed));\n}''',
    "flexible auto draw seconds",
)

rep(
    '''                <select id="autoDrawSeconds" style="max-width:170px">\n                  <option value="10">Hvert 10. sekund</option>\n                  <option value="20">Hvert 20. sekund</option>\n                </select>''',
    '''                <div style="display:flex;align-items:center;gap:8px;max-width:190px">\n                  <input id="autoDrawSeconds" type="number" inputmode="numeric" min="1" max="60" step="1" value="10" style="width:90px" />\n                  <span>sek.</span>\n                </div>''',
    "auto draw seconds input",
)

# When a false BANKO is rejected, show the last called number in the full-screen notice.
rep(
    '''        function renderBingoNotice(claimPause) {''',
    '''        function renderBingoNotice(claimPause, lastNumber) {''',
    "bingo notice receives last number",
)

rep(
    '''            els.bingoNoticeText.textContent = "Systemet har kontrolleret pladerne. Spillet fortsætter automatisk.";''',
    '''            els.bingoNoticeText.textContent = "Systemet har kontrolleret pladerne. Sidste nummer var " + (lastNumber || "-") + ". Spillet fortsætter automatisk.";''',
    "false bingo last number text",
)

rep(
    '''          renderBingoNotice(claimPause);''',
    '''          renderBingoNotice(claimPause, lastNumber);''',
    "pass last number to bingo notice",
)

path.write_text(text, encoding="utf-8")
print(f"Banko flexible controls patch applied: {path}")
