import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const DEFAULT_STORES = [
  { id: "spar", name: "Spar" },
];

const STATUS = Object.freeze({
  AWAITING_STORE: "awaiting_store",
  ORDERED: "ordered",
  COLLECTED: "collected",
  REDEEMED: "redeemed",
});

export class GiftCardPrizeError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "GiftCardPrizeError";
    this.statusCode = statusCode;
  }
}

function isoNow() {
  return new Date().toISOString();
}

function cleanPubId(value) {
  const pubId = String(value || "").trim();
  if (!/^\d{4}$/.test(pubId)) {
    throw new GiftCardPrizeError("Pub-ID skal være på 4 cifre");
  }
  return pubId;
}

function cleanDeviceToken(value) {
  const token = String(value || "").trim();
  if (!/^[a-zA-Z0-9_-]{12,160}$/.test(token)) {
    throw new GiftCardPrizeError("Telefonens sikkerhedsnøgle mangler", 403);
  }
  return token;
}

function cleanAmount(value) {
  const amount = Math.floor(Number(value));
  if (!Number.isFinite(amount) || amount < 1 || amount > 5000) {
    throw new GiftCardPrizeError("Gavekortet skal være mellem 1 og 5.000 kr.");
  }
  return amount;
}

function cleanSourceKey(value) {
  const sourceKey = String(value || "").trim();
  if (!sourceKey || sourceKey.length > 240) {
    throw new GiftCardPrizeError("Bankogevinstens nøgle mangler");
  }
  return sourceKey;
}

function hashDeviceToken(token) {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

function safeStores(raw) {
  const values = Array.isArray(raw?.stores) ? raw.stores : [];
  const stores = [];
  const used = new Set();

  for (const value of values) {
    const id = String(value?.id || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "")
      .slice(0, 40);
    const name = String(value?.name || "").trim().slice(0, 80);
    if (!id || !name || used.has(id)) continue;
    used.add(id);
    stores.push({ id, name });
  }

  return stores.length ? stores : DEFAULT_STORES.map((item) => ({ ...item }));
}

function publicPrize(prize) {
  return {
    id: prize.id,
    pubId: prize.pubId,
    amountKr: prize.amountKr,
    claimType: prize.claimType,
    status: prize.status,
    storeId: prize.storeId,
    storeName: prize.storeName,
    createdAt: prize.createdAt,
    chosenAt: prize.chosenAt,
    collectedAt: prize.collectedAt,
    redeemedAt: prize.redeemedAt,
  };
}

function ensureParent(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

export class GiftCardPrizeStore {
  constructor({ dataFile, configFile, auditFile, enabled = false, clock = isoNow } = {}) {
    if (!dataFile || !configFile) {
      throw new Error("dataFile og configFile er påkrævet");
    }
    this.dataFile = dataFile;
    this.configFile = configFile;
    this.auditFile = auditFile || dataFile + ".jsonl";
    this.enabled = Boolean(enabled);
    this.clock = clock;
  }

  getConfig() {
    let raw = null;
    try {
      raw = JSON.parse(fs.readFileSync(this.configFile, "utf8"));
    } catch (_error) {
      raw = { stores: DEFAULT_STORES };
    }
    return {
      enabled: this.enabled,
      stores: safeStores(raw),
    };
  }

  _assertEnabled() {
    if (!this.enabled) {
      throw new GiftCardPrizeError(
        "Gavekortprøver er låst, indtil den juridiske model er afklaret",
        423,
      );
    }
  }

  _load() {
    try {
      const data = JSON.parse(fs.readFileSync(this.dataFile, "utf8"));
      return {
        version: 1,
        updatedAt: data?.updatedAt || null,
        prizes: Array.isArray(data?.prizes) ? data.prizes : [],
      };
    } catch (_error) {
      return { version: 1, updatedAt: null, prizes: [] };
    }
  }

  _save(data) {
    ensureParent(this.dataFile);
    const tmp = this.dataFile + ".tmp";
    data.version = 1;
    data.updatedAt = this.clock();
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), { encoding: "utf8", mode: 0o600 });
    fs.renameSync(tmp, this.dataFile);
  }

  _audit(action, prize) {
    ensureParent(this.auditFile);
    const event = {
      time: this.clock(),
      action,
      prizeId: prize.id,
      pubId: prize.pubId,
      amountKr: prize.amountKr,
      storeId: prize.storeId,
      status: prize.status,
    };
    fs.appendFileSync(this.auditFile, JSON.stringify(event) + "\n", { encoding: "utf8", mode: 0o600 });
  }

  _findForDevice(data, prizeId, pubId, deviceToken) {
    const safePubId = cleanPubId(pubId);
    const deviceKeyHash = hashDeviceToken(cleanDeviceToken(deviceToken));
    const prize = data.prizes.find((item) => item.id === String(prizeId || ""));
    if (!prize) throw new GiftCardPrizeError("Gevinsten blev ikke fundet", 404);
    if (prize.pubId !== safePubId || prize.deviceKeyHash !== deviceKeyHash) {
      throw new GiftCardPrizeError("Gevinsten tilhører ikke denne telefon", 403);
    }
    return prize;
  }

  createPrize({ pubId, deviceToken, amountKr, sourceKey, gameId, claimType }) {
    this._assertEnabled();
    const safePubId = cleanPubId(pubId);
    const safeDeviceToken = cleanDeviceToken(deviceToken);
    const safeSourceKey = cleanSourceKey(sourceKey);
    const sourceKeyHash = crypto.createHash("sha256").update(safeSourceKey, "utf8").digest("hex");
    const data = this._load();
    const existing = data.prizes.find((item) => item.sourceKeyHash === sourceKeyHash);
    if (existing) return { prize: publicPrize(existing), duplicate: true };

    const createdAt = this.clock();
    const prize = {
      id: "GAVE-" + crypto.randomBytes(6).toString("hex").toUpperCase(),
      sourceKeyHash,
      gameId: String(gameId || "").slice(0, 80),
      claimType: claimType === "full_board" ? "full_board" : "row",
      pubId: safePubId,
      deviceKeyHash: hashDeviceToken(safeDeviceToken),
      amountKr: cleanAmount(amountKr),
      status: STATUS.AWAITING_STORE,
      storeId: null,
      storeName: null,
      createdAt,
      chosenAt: null,
      collectedAt: null,
      redeemedAt: null,
    };
    data.prizes.push(prize);
    this._save(data);
    this._audit("created", prize);
    return { prize: publicPrize(prize), duplicate: false };
  }

  listForDevice({ pubId, deviceToken }) {
    this._assertEnabled();
    const safePubId = cleanPubId(pubId);
    const deviceKeyHash = hashDeviceToken(cleanDeviceToken(deviceToken));
    return this._load().prizes
      .filter((item) => item.pubId === safePubId && item.deviceKeyHash === deviceKeyHash)
      .slice()
      .reverse()
      .map(publicPrize);
  }

  listForHost() {
    this._assertEnabled();
    return this._load().prizes.slice().reverse().map(publicPrize);
  }

  chooseStore({ prizeId, pubId, deviceToken, storeId }) {
    this._assertEnabled();
    const data = this._load();
    const prize = this._findForDevice(data, prizeId, pubId, deviceToken);
    const store = this.getConfig().stores.find((item) => item.id === String(storeId || ""));
    if (!store) throw new GiftCardPrizeError("Butikken blev ikke fundet", 404);

    if (prize.status === STATUS.ORDERED && prize.storeId === store.id) {
      return publicPrize(prize);
    }
    if (prize.status !== STATUS.AWAITING_STORE) {
      throw new GiftCardPrizeError("Butikken kan ikke ændres efter bestilling", 409);
    }

    prize.storeId = store.id;
    prize.storeName = store.name;
    prize.status = STATUS.ORDERED;
    prize.chosenAt = this.clock();
    this._save(data);
    this._audit("store_selected", prize);
    return publicPrize(prize);
  }

  markCollected({ prizeId }) {
    this._assertEnabled();
    const data = this._load();
    const prize = data.prizes.find((item) => item.id === String(prizeId || ""));
    if (!prize) throw new GiftCardPrizeError("Gevinsten blev ikke fundet", 404);
    if (prize.status === STATUS.COLLECTED || prize.status === STATUS.REDEEMED) {
      return publicPrize(prize);
    }
    if (prize.status !== STATUS.ORDERED) {
      throw new GiftCardPrizeError("Vinderen skal vælge butik først", 409);
    }

    prize.status = STATUS.COLLECTED;
    prize.collectedAt = this.clock();
    this._save(data);
    this._audit("collected", prize);
    return publicPrize(prize);
  }

  redeem({ prizeId, pubId, deviceToken }) {
    this._assertEnabled();
    const data = this._load();
    const prize = this._findForDevice(data, prizeId, pubId, deviceToken);
    if (prize.status === STATUS.REDEEMED) {
      throw new GiftCardPrizeError("Gevinsten er allerede udleveret", 409);
    }
    if (prize.status !== STATUS.COLLECTED) {
      throw new GiftCardPrizeError("Gavekortet er ikke klar til afhentning endnu", 409);
    }

    prize.status = STATUS.REDEEMED;
    prize.redeemedAt = this.clock();
    this._save(data);
    this._audit("redeemed", prize);
    return publicPrize(prize);
  }
}

function errorResponse(res, error) {
  const status = error instanceof GiftCardPrizeError ? error.statusCode : 500;
  res.status(status).json({ ok: false, error: status === 500 ? "Der opstod en serverfejl" : error.message });
}

function readPubIdFromClaim(claim) {
  if (/^\d{4}$/.test(String(claim?.pubId || ""))) return String(claim.pubId);
  const match = /^Pub-ID\s+(\d{4})$/.exec(String(claim?.name || ""));
  return match ? match[1] : "";
}

function publicClaim(claim) {
  if (!claim?.valid) return null;
  return {
    pubId: readPubIdFromClaim(claim),
    claimType: claim.fullBoard ? "full_board" : "row",
    drawnCount: Number(claim.drawnCount || 0),
  };
}

export function registerGiftCardPrizeRoutes(app, {
  store,
  bartenderPin,
  getLastClaim,
  getGameId,
  findPlayerBySessionId,
  renderHtml,
}) {
  const pinIsValid = (value) => {
    const configuredPin = String(bartenderPin() || "");
    return configuredPin.length > 0 && String(value || "") === configuredPin;
  };

  app.get("/giftcard-prizes-client.js", (_req, res) => {
    try {
      const source = fs.readFileSync(new URL("./giftcard-prizes-client.js", import.meta.url), "utf8");
      res.set("Content-Type", "application/javascript; charset=utf-8");
      res.set("Cache-Control", "no-store");
      res.send(source);
    } catch (error) {
      errorResponse(res, error);
    }
  });

  app.get("/prizes", (_req, res) => res.send(renderHtml()));

  app.get("/api/giftcard-prizes/config", (_req, res) => {
    res.set("Cache-Control", "no-store");
    res.json({ ok: true, ...store.getConfig() });
  });

  app.post("/api/giftcard-prizes/mine", (req, res) => {
    try {
      res.set("Cache-Control", "no-store");
      res.json({ ok: true, prizes: store.listForDevice(req.body || {}) });
    } catch (error) {
      errorResponse(res, error);
    }
  });

  app.post("/api/giftcard-prizes/select-store", (req, res) => {
    try {
      res.json({ ok: true, prize: store.chooseStore(req.body || {}) });
    } catch (error) {
      errorResponse(res, error);
    }
  });

  app.post("/api/giftcard-prizes/redeem", (req, res) => {
    try {
      if (!pinIsValid(req.body?.pin)) {
        throw new GiftCardPrizeError("Forkert bartenderkode", 403);
      }
      res.json({ ok: true, prize: store.redeem(req.body || {}) });
    } catch (error) {
      errorResponse(res, error);
    }
  });

  app.post("/api/giftcard-prizes/host/list", (req, res) => {
    try {
      if (!pinIsValid(req.body?.pin)) {
        throw new GiftCardPrizeError("Forkert bartenderkode", 403);
      }
      res.set("Cache-Control", "no-store");
      res.json({
        ok: true,
        config: store.getConfig(),
        eligibleClaim: publicClaim(getLastClaim()),
        prizes: store.getConfig().enabled ? store.listForHost() : [],
      });
    } catch (error) {
      errorResponse(res, error);
    }
  });

  app.post("/api/giftcard-prizes/host/create", (req, res) => {
    try {
      if (!pinIsValid(req.body?.pin)) {
        throw new GiftCardPrizeError("Forkert bartenderkode", 403);
      }
      const claim = getLastClaim();
      const pubId = readPubIdFromClaim(claim);
      const player = claim?.sessionId ? findPlayerBySessionId(claim.sessionId) : null;
      if (!claim?.valid || !pubId || !claim.sessionId || !player?.giftPrizeDeviceToken) {
        throw new GiftCardPrizeError("Der er ingen godkendt Banko-vinder at oprette gavekort til", 409);
      }
      const gameId = String(getGameId() || "");
      const claimType = claim.fullBoard ? "full_board" : "row";
      const sourceKey = [gameId, claim.sessionId, claim.drawnCount, claimType].join(":");
      const result = store.createPrize({
        pubId,
        deviceToken: player.giftPrizeDeviceToken,
        amountKr: req.body?.amountKr,
        sourceKey,
        gameId,
        claimType,
      });
      res.json({ ok: true, ...result });
    } catch (error) {
      errorResponse(res, error);
    }
  });

  app.post("/api/giftcard-prizes/host/collected", (req, res) => {
    try {
      if (!pinIsValid(req.body?.pin)) {
        throw new GiftCardPrizeError("Forkert bartenderkode", 403);
      }
      res.json({ ok: true, prize: store.markCollected(req.body || {}) });
    } catch (error) {
      errorResponse(res, error);
    }
  });
}

export const GiftCardPrizeStatus = STATUS;
