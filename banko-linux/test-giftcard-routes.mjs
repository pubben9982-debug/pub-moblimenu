import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { GiftCardPrizeStore, registerGiftCardPrizeRoutes } from "./giftcard-prizes.js";


class FakeApp {
  constructor() {
    this.routes = new Map();
  }

  get(route, handler) {
    this.routes.set("GET " + route, handler);
  }

  post(route, handler) {
    this.routes.set("POST " + route, handler);
  }
}

function fakeResponse() {
  return {
    statusCode: 200,
    headers: {},
    payload: null,
    status(value) { this.statusCode = value; return this; },
    set(name, value) { this.headers[name] = value; return this; },
    json(value) { this.payload = value; return this; },
    send(value) { this.payload = value; return this; },
  };
}

function call(app, method, route, body = {}) {
  const handler = app.routes.get(method + " " + route);
  assert.ok(handler, "Mangler route: " + method + " " + route);
  const response = fakeResponse();
  handler({ body, query: {} }, response);
  return response;
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "banko-giftcard-routes-"));
const dataFile = path.join(tempDir, "prizes.json");
const configFile = path.join(tempDir, "stores.json");
fs.writeFileSync(configFile, JSON.stringify({ stores: [{ id: "spar", name: "Spar" }] }));

const store = new GiftCardPrizeStore({
  dataFile,
  configFile,
  auditFile: path.join(tempDir, "audit.jsonl"),
  enabled: true,
});
const app = new FakeApp();
const claim = {
  valid: true,
  fullBoard: false,
  sessionId: "public_bingo_session_123",
  pubId: "5087",
  name: "Pub-ID 5087",
  drawnCount: 42,
};
const player = {
  sessionId: claim.sessionId,
  giftPrizeDeviceToken: "private_phone_secret_456",
};
const bartenderPin = String(100000 + (process.pid % 900000));
const wrongBartenderPin = `${bartenderPin}x`;

registerGiftCardPrizeRoutes(app, {
  store,
  bartenderPin: () => bartenderPin,
  getLastClaim: () => claim,
  getGameId: () => "GAME1",
  findPlayerBySessionId: (sessionId) => sessionId === player.sessionId ? player : null,
  renderHtml: () => "<html>Banko</html>",
});

const emptyPinApp = new FakeApp();
registerGiftCardPrizeRoutes(emptyPinApp, {
  store,
  bartenderPin: () => "",
  getLastClaim: () => claim,
  getGameId: () => "GAME1",
  findPlayerBySessionId: (sessionId) => sessionId === player.sessionId ? player : null,
  renderHtml: () => "<html>Banko</html>",
});
const emptyPinResponse = call(
  emptyPinApp,
  "POST",
  "/api/giftcard-prizes/host/create",
  { pin: "", amountKr: 300 },
);
assert.equal(emptyPinResponse.statusCode, 403, "En tom bartenderkode må aldrig give adgang");

let response = call(app, "POST", "/api/giftcard-prizes/host/create", { pin: wrongBartenderPin, amountKr: 300 });
assert.equal(response.statusCode, 403);

response = call(app, "POST", "/api/giftcard-prizes/host/create", { pin: bartenderPin, amountKr: 300 });
assert.equal(response.statusCode, 200);
assert.equal(response.payload.prize.pubId, "5087");
const prizeId = response.payload.prize.id;

response = call(app, "POST", "/api/giftcard-prizes/mine", {
  pubId: "5087",
  deviceToken: claim.sessionId,
});
assert.equal(response.payload.prizes.length, 0, "Den offentlige Banko-session må ikke give adgang");

response = call(app, "POST", "/api/giftcard-prizes/mine", {
  pubId: "5087",
  deviceToken: player.giftPrizeDeviceToken,
});
assert.equal(response.payload.prizes.length, 1);

response = call(app, "POST", "/api/giftcard-prizes/select-store", {
  prizeId,
  pubId: "5087",
  deviceToken: player.giftPrizeDeviceToken,
  storeId: "spar",
});
assert.equal(response.payload.prize.status, "ordered");

response = call(app, "POST", "/api/giftcard-prizes/host/collected", { pin: bartenderPin, prizeId });
assert.equal(response.payload.prize.status, "collected");

response = call(app, "POST", "/api/giftcard-prizes/redeem", {
  pin: wrongBartenderPin,
  prizeId,
  pubId: "5087",
  deviceToken: player.giftPrizeDeviceToken,
});
assert.equal(response.statusCode, 403);

response = call(app, "POST", "/api/giftcard-prizes/redeem", {
  pin: bartenderPin,
  prizeId,
  pubId: "5087",
  deviceToken: player.giftPrizeDeviceToken,
});
assert.equal(response.payload.prize.status, "redeemed");

const rawData = fs.readFileSync(dataFile, "utf8");
assert.equal(rawData.includes(player.giftPrizeDeviceToken), false);
assert.equal(rawData.includes(claim.sessionId), false);
assert.equal(rawData.includes('"name"'), false);

fs.rmSync(tempDir, { recursive: true, force: true });
console.log("Giftcard route tests passed");
