(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search);
  var isHost = params.get("host") === "1";
  var hostPin = params.get("pin") || "";
  var pubId = /^\d{4}$/.test(params.get("id") || "") ? params.get("id") : "";
  var deviceToken = "";
  var config = { enabled: false, stores: [] };
  var refreshTimer = null;

  try {
    deviceToken = localStorage.getItem("pubbanko_giftcard_device_token") || "";
  } catch (_error) {}

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }

  function statusText(status) {
    return {
      awaiting_store: "Vælg butik",
      ordered: "Bestilt",
      collected: "Klar til afhentning",
      redeemed: "Udleveret",
    }[status] || status;
  }

  async function request(path, body) {
    var response = await fetch(path, {
      method: body ? "POST" : "GET",
      cache: "no-store",
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    var data = {};
    try { data = await response.json(); } catch (_error) {}
    if (!response.ok) throw new Error(data.error || "Der opstod en fejl");
    return data;
  }

  function installStyles() {
    var style = document.createElement("style");
    style.textContent = [
      ".gift-prize-panel{background:#f7f4ec;color:#17211d;border-radius:18px;padding:18px;margin:0 0 18px;box-shadow:0 8px 24px rgba(0,0,0,.22)}",
      ".gift-prize-panel h2,.gift-prize-panel h3{margin:0 0 10px}",
      ".gift-prize-panel p{line-height:1.45}",
      ".gift-prize-card{border:2px solid #d7cda9;border-radius:15px;padding:15px;margin-top:12px;background:white}",
      ".gift-prize-card.ready{border-color:#198754;background:#e7f7ed}",
      ".gift-prize-card.redeemed{opacity:.72}",
      ".gift-prize-meta{display:flex;flex-wrap:wrap;gap:8px;margin:9px 0}",
      ".gift-prize-meta span{background:#ece7d8;border-radius:999px;padding:6px 9px;font-size:13px;font-weight:800}",
      ".gift-prize-panel button{margin:6px 0 0;background:#176b45;color:white}",
      ".gift-prize-panel button.secondary{background:#46584f;color:white}",
      ".gift-prize-panel button:disabled{opacity:.55;cursor:not-allowed}",
      ".gift-prize-error{color:#8b1e1e;font-weight:800}",
      ".gift-prize-success{color:#126436;font-weight:900}",
      ".gift-prize-order{white-space:pre-wrap;background:#15251e;color:#fff;border-radius:12px;padding:12px;line-height:1.5}",
      ".gift-prize-host-create{display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:end}",
      ".gift-prize-host-create input{margin:0;background:white;border:1px solid #a99f80;color:#111}",
      "body.gift-prizes-page #playerLanding,body.gift-prizes-page #mainGrid,body.gift-prizes-page #bingoNotice{display:none!important}",
      "@media(max-width:640px){.gift-prize-host-create{grid-template-columns:1fr}.gift-prize-panel{padding:14px}}",
    ].join("");
    document.head.appendChild(style);
  }

  function makePanel(id) {
    var panel = document.createElement("section");
    panel.id = id;
    panel.className = "gift-prize-panel";
    return panel;
  }

  function ensurePlayerPanel() {
    var panel = document.getElementById("giftPrizePlayerPanel");
    if (panel) return panel;
    panel = makePanel("giftPrizePlayerPanel");
    var wrap = document.getElementById("appWrap") || document.body;
    wrap.insertBefore(panel, wrap.firstChild);
    return panel;
  }

  function ensureHostPanel() {
    var panel = document.getElementById("giftPrizeHostPanel");
    if (panel) return panel;
    panel = makePanel("giftPrizeHostPanel");
    var claimBox = document.getElementById("hostClaimBox");
    if (claimBox && claimBox.parentNode) claimBox.parentNode.insertBefore(panel, claimBox.nextSibling);
    else (document.getElementById("hostView") || document.body).appendChild(panel);
    return panel;
  }

  function storeButtons(prize) {
    return (config.stores || []).map(function (store) {
      return '<button type="button" data-gift-store="' + escapeHtml(store.id) + '" data-gift-prize="' + escapeHtml(prize.id) + '">' +
        "VÆLG " + escapeHtml(store.name).toUpperCase() + "</button>";
    }).join("");
  }

  function renderPlayerPrize(prize) {
    var css = "gift-prize-card";
    if (prize.status === "collected") css += " ready";
    if (prize.status === "redeemed") css += " redeemed";
    var action = "";

    if (prize.status === "awaiting_store") {
      action = "<p>Vælg den butik, gavekortet skal være til. Valget kan ikke ændres bagefter.</p>" + storeButtons(prize);
    } else if (prize.status === "ordered") {
      action = "<p>Dit gavekort er bestilt. Vent til siden viser <strong>Klar til afhentning</strong>, før du kommer efter det.</p>";
    } else if (prize.status === "collected") {
      action = '<p class="gift-prize-success">Gavekortet ligger klar på pubben.</p>' +
        '<button type="button" data-gift-redeem="' + escapeHtml(prize.id) + '">GODKENDES AF BARTENDER</button>';
    } else if (prize.status === "redeemed") {
      action = '<p class="gift-prize-success">Gavekortet er udleveret.</p>';
    }

    return '<article class="' + css + '">' +
      "<h3>Gavekort på " + escapeHtml(prize.amountKr) + " kr.</h3>" +
      '<div class="gift-prize-meta"><span>Pub-ID ' + escapeHtml(prize.pubId) + "</span><span>" + escapeHtml(statusText(prize.status)) + "</span>" +
      (prize.storeName ? "<span>" + escapeHtml(prize.storeName) + "</span>" : "") + "</div>" +
      action + "</article>";
  }

  async function loadPlayerPrizes() {
    var panel = ensurePlayerPanel();
    if (!config.enabled) {
      if (window.location.pathname === "/prizes") {
        panel.innerHTML = "<h2>Mine gevinster</h2><p>Gavekortfunktionen er ikke åbnet endnu.</p>";
      } else {
        panel.classList.add("hidden");
      }
      return;
    }
    if (!pubId || !deviceToken) {
      panel.classList.remove("hidden");
      panel.innerHTML = '<h2>Mine gevinster</h2><p class="gift-prize-error">Åbn siden fra mobilmenuen på den telefon, du spillede Banko med.</p>';
      return;
    }
    try {
      var data = await request("/api/giftcard-prizes/mine", { pubId: pubId, deviceToken: deviceToken });
      var prizes = data.prizes || [];
      panel.classList.toggle("hidden", !prizes.length && window.location.pathname !== "/prizes");
      panel.innerHTML = "<h2>Mine gevinster</h2><p><strong>GRATIS PRØVE:</strong> Du gennemfører gavekortvalget som i den færdige udgave, men dagens præmie er én gratis øl på Central Irish Pub.</p>" +
        (prizes.length ? prizes.map(renderPlayerPrize).join("") : "<p>Der er ingen gavekortgevinster på denne telefon.</p>");
      panel.querySelectorAll("[data-gift-store]").forEach(function (button) {
        button.addEventListener("click", async function () {
          button.disabled = true;
          try {
            await request("/api/giftcard-prizes/select-store", {
              prizeId: button.dataset.giftPrize,
              storeId: button.dataset.giftStore,
              pubId: pubId,
              deviceToken: deviceToken,
            });
            await loadPlayerPrizes();
          } catch (error) {
            alert(error.message);
            button.disabled = false;
          }
        });
      });
      panel.querySelectorAll("[data-gift-redeem]").forEach(function (button) {
        button.addEventListener("click", async function () {
          var pin = window.prompt("Bartender: indtast medarbejderkoden");
          if (pin === null) return;
          button.disabled = true;
          try {
            await request("/api/giftcard-prizes/redeem", {
              prizeId: button.dataset.giftRedeem,
              pubId: pubId,
              deviceToken: deviceToken,
              pin: pin,
            });
            await loadPlayerPrizes();
          } catch (error) {
            alert(error.message);
            button.disabled = false;
          }
        });
      });
    } catch (error) {
      panel.classList.remove("hidden");
      panel.innerHTML = '<h2>Mine gevinster</h2><p class="gift-prize-error">' + escapeHtml(error.message) + "</p>";
    }
  }

  function orderText(prizes) {
    var ordered = (prizes || []).filter(function (prize) { return prize.status === "ordered"; });
    if (!ordered.length) return "Ingen gavekort skal hentes lige nu.";
    var groups = {};
    ordered.forEach(function (prize) {
      var store = prize.storeName || "Ukendt butik";
      if (!groups[store]) groups[store] = [];
      groups[store].push("Gavekort " + prize.amountKr + " kr. – mærkes Pub-ID " + prize.pubId);
    });
    return Object.keys(groups).sort().map(function (store) {
      return store + ":\n" + groups[store].map(function (line) { return "• " + line; }).join("\n");
    }).join("\n\n");
  }

  function renderHostPrize(prize) {
    var action = prize.status === "ordered"
      ? '<button type="button" data-gift-collected="' + escapeHtml(prize.id) + '">JEG HAR HENTET KORTET</button>'
      : "";
    return '<article class="gift-prize-card' + (prize.status === "collected" ? " ready" : "") + '">' +
      "<h3>" + escapeHtml(prize.storeName || "Afventer butikkens valg") + " · " + escapeHtml(prize.amountKr) + " kr.</h3>" +
      '<div class="gift-prize-meta"><span>Pub-ID ' + escapeHtml(prize.pubId) + "</span><span>" + escapeHtml(statusText(prize.status)) + "</span></div>" +
      action + "</article>";
  }

  async function loadHostPrizes() {
    var panel = ensureHostPanel();
    try {
      var data = await request("/api/giftcard-prizes/host/list", { pin: hostPin });
      config = data.config || config;
      if (!config.enabled) {
        panel.innerHTML = "<h2>Fysiske gavekort</h2><p><strong>TESTFUNKTION LÅST.</strong> Koden er forberedt, men kan først åbnes, når Banko-modellen er juridisk afklaret.</p>";
        return;
      }
      var claim = data.eligibleClaim;
      var prizes = data.prizes || [];
      var create = claim
        ? '<div class="gift-prize-host-create"><label>Godkendt vinder<br><strong>Pub-ID ' + escapeHtml(claim.pubId) + '</strong></label><label>Gavekortets værdi<input id="giftPrizeAmount" type="number" inputmode="numeric" min="1" max="5000" step="1" value="25"></label></div><button type="button" id="giftPrizeCreate">OPRET GAVEKORTGEVINST</button>'
        : "<p>Efter en gyldig BANKO-melding kan gavekortet oprettes her.</p>";
      var text = orderText(prizes);
      panel.innerHTML = "<h2>Fysiske gavekort</h2><p><strong>GRATIS PRØVE:</strong> Opret som et gavekort på 25 kr. Vinderen vælger butik og gennemfører hele flowet, men udlever én gratis øl i stedet for at købe gavekortet.</p>" + create +
        "<h3>Indkøbsliste</h3><div class=\"gift-prize-order\" id=\"giftPrizeOrderText\">" + escapeHtml(text) + "</div>" +
        '<button type="button" class="secondary" id="giftPrizeCopy">KOPIÉR LISTEN</button>' +
        "<h3 style=\"margin-top:18px\">Alle gevinster</h3>" +
        (prizes.length ? prizes.map(renderHostPrize).join("") : "<p>Ingen gavekortgevinster endnu.</p>");

      var createButton = document.getElementById("giftPrizeCreate");
      if (createButton) createButton.addEventListener("click", async function () {
        createButton.disabled = true;
        try {
          await request("/api/giftcard-prizes/host/create", {
            pin: hostPin,
            amountKr: Number(document.getElementById("giftPrizeAmount").value || 0),
          });
          await loadHostPrizes();
        } catch (error) {
          alert(error.message);
          createButton.disabled = false;
        }
      });

      var copyButton = document.getElementById("giftPrizeCopy");
      if (copyButton) copyButton.addEventListener("click", async function () {
        try {
          await navigator.clipboard.writeText(text);
          copyButton.textContent = "LISTEN ER KOPIERET";
        } catch (_error) {
          window.prompt("Kopiér bestillingslisten:", text);
        }
      });

      panel.querySelectorAll("[data-gift-collected]").forEach(function (button) {
        button.addEventListener("click", async function () {
          button.disabled = true;
          try {
            await request("/api/giftcard-prizes/host/collected", {
              pin: hostPin,
              prizeId: button.dataset.giftCollected,
            });
            await loadHostPrizes();
          } catch (error) {
            alert(error.message);
            button.disabled = false;
          }
        });
      });
    } catch (error) {
      panel.innerHTML = '<h2>Fysiske gavekort</h2><p class="gift-prize-error">' + escapeHtml(error.message) + "</p>";
    }
  }

  async function start() {
    installStyles();
    if (window.location.pathname === "/prizes") document.body.classList.add("gift-prizes-page");
    try {
      var response = await request("/api/giftcard-prizes/config");
      config = response;
    } catch (_error) {}

    if (isHost) {
      await loadHostPrizes();
      refreshTimer = window.setInterval(loadHostPrizes, 5000);
    } else {
      await loadPlayerPrizes();
      refreshTimer = window.setInterval(loadPlayerPrizes, 5000);
    }
  }

  window.addEventListener("beforeunload", function () {
    if (refreshTimer) window.clearInterval(refreshTimer);
  });

  start();
}());
