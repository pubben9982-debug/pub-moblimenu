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
    'import { Server } from "socket.io";\n',
    'import { Server } from "socket.io";\n'
    'import { GiftCardPrizeStore, registerGiftCardPrizeRoutes } from "./giftcard-prizes.js";\n',
    "giftcard module import",
)

rep(
    '''const app = express();
const server = http.createServer(app);''',
    '''const app = express();
app.use(express.json({ limit: "16kb" }));
const server = http.createServer(app);''',
    "json body parser",
)

rep(
    '''const PORT = process.env.PORT || 3000;

// Theoretical max unique 90-ball tickets is very large; use a practical high cap only to prevent infinite loops.''',
    '''const PORT = process.env.PORT || 3000;
const giftCardPrizeStore = new GiftCardPrizeStore({
  dataFile: process.env.BANKO_GIFTCARD_DATA_FILE || new URL("../data/giftcard-prizes.json", import.meta.url).pathname,
  configFile: process.env.BANKO_GIFTCARD_CONFIG_FILE || new URL("../data/giftcard-stores.json", import.meta.url).pathname,
  auditFile: process.env.BANKO_GIFTCARD_AUDIT_FILE || new URL("../data/giftcard-prizes-audit.jsonl", import.meta.url).pathname,
  enabled: String(process.env.BANKO_GIFTCARD_PILOT || "") === "1",
});

// Theoretical max unique 90-ball tickets is very large; use a practical high cap only to prevent infinite loops.''',
    "giftcard store",
)

rep(
    '''    sessionId: player.sessionId,
    name: player.name,
    time: new Date().toLocaleTimeString("da-DK"),''',
    '''    sessionId: player.sessionId,
    name: player.name,
    pubId: player.pubId,
    time: new Date().toLocaleTimeString("da-DK"),''',
    "claim pub id",
)

rep(
    '''    sessionId: player.sessionId,
    name: player.name,
    boardCount: player.boardCount,''',
    '''    sessionId: player.sessionId,
    name: player.name,
    pubId: player.pubId,
    boardCount: player.boardCount,''',
    "public player pub id",
)

rep(
    '''  socket.on("player:join", ({ name, sessionId }) => {
    const safeName = (name || "Spiller").toString().trim().slice(0, 30) || "Spiller";
    const safeSessionId = (sessionId || "").toString().trim() || Math.random().toString(36).slice(2);''',
    '''  socket.on("player:join", ({ name, sessionId, pubId, giftPrizeDeviceToken }) => {
    const safeName = (name || "Spiller").toString().trim().slice(0, 30) || "Spiller";
    const safeSessionId = (sessionId || "").toString().trim() || Math.random().toString(36).slice(2);
    const safePubId = /^\\d{4}$/.test(String(pubId || "")) ? String(pubId) : "";
    const safeGiftPrizeDeviceToken = /^[a-zA-Z0-9_-]{12,160}$/.test(String(giftPrizeDeviceToken || ""))
      ? String(giftPrizeDeviceToken)
      : "";''',
    "join pub id",
)

rep(
    '''      existing.id = socket.id;
      existing.name = safeName || existing.name;
      state.players.set(socket.id, existing);''',
    '''      existing.id = socket.id;
      existing.name = safeName || existing.name;
      existing.pubId = safePubId || existing.pubId;
      existing.giftPrizeDeviceToken = safeGiftPrizeDeviceToken || existing.giftPrizeDeviceToken;
      state.players.set(socket.id, existing);''',
    "resume pub id",
)

rep(
    '''      sessionId: safeSessionId,
      name: safeName,
      boardCount: 0,''',
    '''      sessionId: safeSessionId,
      name: safeName,
      pubId: safePubId,
      giftPrizeDeviceToken: safeGiftPrizeDeviceToken,
      boardCount: 0,''',
    "new player pub id",
)

rep(
    '''app.get("/api/status", (_req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.json({ ok: true, active: state.bankoActive, players: state.players.size, drawn: state.drawn.length, gameId: state.gameId });
});

server.listen(PORT, "0.0.0.0", () => {''',
    '''app.get("/api/status", (_req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.json({ ok: true, active: state.bankoActive, players: state.players.size, drawn: state.drawn.length, gameId: state.gameId });
});

registerGiftCardPrizeRoutes(app, {
  store: giftCardPrizeStore,
  bartenderPin: () => String(process.env.BARTENDER_PIN || ""),
  getLastClaim: () => state.lastClaim,
  getGameId: () => state.gameId,
  findPlayerBySessionId,
  renderHtml: html,
});

server.listen(PORT, "0.0.0.0", () => {''',
    "giftcard routes",
)

rep(
    '''        const els = {''',
    '''        let giftPrizeDeviceToken = localStorage.getItem("pubbanko_giftcard_device_token");
        if (!giftPrizeDeviceToken) {
          try {
            const values = new Uint8Array(24);
            crypto.getRandomValues(values);
            giftPrizeDeviceToken = Array.from(values, value => value.toString(16).padStart(2, "0")).join("");
          } catch (_error) {
            giftPrizeDeviceToken = Math.random().toString(36).slice(2) + Date.now().toString(36) + Math.random().toString(36).slice(2);
          }
          localStorage.setItem("pubbanko_giftcard_device_token", giftPrizeDeviceToken);
        }

        const els = {''',
    "private giftcard device token",
)

rep(
    '''          socket.emit("player:join", { name, sessionId: currentSessionId });
          showBoardShopMode();''',
    '''          socket.emit("player:join", { name, sessionId: currentSessionId, pubId: pubIdFromUrl, giftPrizeDeviceToken });
          showBoardShopMode();''',
    "client sends pub id",
)

rep(
    '''      </script>
    </body>''',
    '''      </script>
      <script src="/giftcard-prizes-client.js"></script>
    </body>''',
    "giftcard client",
)

path.write_text(text, encoding="utf-8")
print(f"Banko giftcard-prize patch applied: {path}")
