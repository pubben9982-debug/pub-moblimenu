import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { GiftCardPrizeError, GiftCardPrizeStore } from "./giftcard-prizes.js";


const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "banko-giftcard-test-"));
const dataFile = path.join(tempDir, "giftcard-prizes.json");
const configFile = path.join(tempDir, "giftcard-stores.json");
const auditFile = path.join(tempDir, "giftcard-audit.jsonl");
const times = [
  "2026-09-03T20:00:00.000Z",
  "2026-09-03T20:01:00.000Z",
  "2026-09-03T20:02:00.000Z",
  "2026-09-03T20:03:00.000Z",
  "2026-09-03T20:04:00.000Z",
  "2026-09-03T20:05:00.000Z",
  "2026-09-03T20:06:00.000Z",
  "2026-09-03T20:07:00.000Z",
  "2026-09-03T20:08:00.000Z",
];
let clockIndex = 0;
const clock = () => times[Math.min(clockIndex++, times.length - 1)];

fs.writeFileSync(configFile, JSON.stringify({
  stores: [
    { id: "spar", name: "Spar" },
    { id: "slagter", name: "Slagteren" },
  ],
}));

const lockedStore = new GiftCardPrizeStore({ dataFile, configFile, auditFile, enabled: false, clock });
assert.equal(lockedStore.getConfig().enabled, false);
assert.throws(
  () => lockedStore.createPrize({
    pubId: "5087",
    deviceToken: "winner_phone_token_123",
    amountKr: 300,
    sourceKey: "GAME1:winner_phone_token_123:45:row",
  }),
  (error) => error instanceof GiftCardPrizeError && error.statusCode === 423,
);

const store = new GiftCardPrizeStore({ dataFile, configFile, auditFile, enabled: true, clock });
const created = store.createPrize({
  pubId: "5087",
  deviceToken: "winner_phone_token_123",
  amountKr: 300,
  sourceKey: "GAME1:winner_phone_token_123:45:row",
  gameId: "GAME1",
  claimType: "row",
});
assert.equal(created.duplicate, false);
assert.equal(created.prize.pubId, "5087");
assert.equal(created.prize.status, "awaiting_store");
assert.equal(created.prize.amountKr, 300);

const duplicate = store.createPrize({
  pubId: "5087",
  deviceToken: "winner_phone_token_123",
  amountKr: 999,
  sourceKey: "GAME1:winner_phone_token_123:45:row",
  gameId: "GAME1",
  claimType: "row",
});
assert.equal(duplicate.duplicate, true);
assert.equal(duplicate.prize.id, created.prize.id);
assert.equal(duplicate.prize.amountKr, 300);

assert.equal(store.listForDevice({
  pubId: "5087",
  deviceToken: "winner_phone_token_123",
}).length, 1);
assert.equal(store.listForDevice({
  pubId: "5087",
  deviceToken: "other_phone_token_456",
}).length, 0);

assert.throws(
  () => store.chooseStore({
    prizeId: created.prize.id,
    pubId: "5087",
    deviceToken: "other_phone_token_456",
    storeId: "spar",
  }),
  (error) => error instanceof GiftCardPrizeError && error.statusCode === 403,
);

const ordered = store.chooseStore({
  prizeId: created.prize.id,
  pubId: "5087",
  deviceToken: "winner_phone_token_123",
  storeId: "spar",
});
assert.equal(ordered.status, "ordered");
assert.equal(ordered.storeName, "Spar");

assert.throws(
  () => store.redeem({
    prizeId: created.prize.id,
    pubId: "5087",
    deviceToken: "winner_phone_token_123",
  }),
  (error) => error instanceof GiftCardPrizeError && error.statusCode === 409,
);

const collected = store.markCollected({ prizeId: created.prize.id });
assert.equal(collected.status, "collected");

assert.throws(
  () => store.redeem({
    prizeId: created.prize.id,
    pubId: "2367",
    deviceToken: "winner_phone_token_123",
  }),
  (error) => error instanceof GiftCardPrizeError && error.statusCode === 403,
);

const redeemed = store.redeem({
  prizeId: created.prize.id,
  pubId: "5087",
  deviceToken: "winner_phone_token_123",
});
assert.equal(redeemed.status, "redeemed");
assert.ok(redeemed.redeemedAt);

assert.throws(
  () => store.redeem({
    prizeId: created.prize.id,
    pubId: "5087",
    deviceToken: "winner_phone_token_123",
  }),
  (error) => error instanceof GiftCardPrizeError && error.statusCode === 409,
);

const persisted = new GiftCardPrizeStore({ dataFile, configFile, auditFile, enabled: true, clock });
assert.equal(persisted.listForHost()[0].status, "redeemed");

const rawData = fs.readFileSync(dataFile, "utf8");
assert.equal(rawData.includes("winner_phone_token_123"), false, "Telefonens hemmelige nøgle må ikke gemmes råt");
assert.equal(rawData.includes('"name"'), false, "Der må ikke gemmes et gæstenavn");

const auditLines = fs.readFileSync(auditFile, "utf8").trim().split("\n").map(JSON.parse);
assert.deepEqual(auditLines.map((entry) => entry.action), [
  "created",
  "store_selected",
  "collected",
  "redeemed",
]);
assert.equal(auditLines.every((entry) => entry.pubId === "5087"), true);

fs.rmSync(tempDir, { recursive: true, force: true });
console.log("Giftcard prize tests passed");
