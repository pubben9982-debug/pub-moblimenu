"use strict";

(function () {
  const idNode = document.getElementById("deviceId");

  // Den normale app er startet korrekt. Gør ingenting.
  if (!idNode || idNode.textContent.trim() !== "----") {
    return;
  }

  function el(id) {
    return document.getElementById(id);
  }

  function readStorage(key) {
    try {
      const value = window.localStorage.getItem(key);
      if (value) return value;
    } catch (_) {}

    try {
      const value = window.sessionStorage.getItem(key);
      if (value) return value;
    } catch (_) {}

    try {
      const prefix = encodeURIComponent(key) + "=";
      const parts = String(document.cookie || "").split(";");
      for (const part of parts) {
        const item = part.trim();
        if (item.startsWith(prefix)) {
          return decodeURIComponent(item.slice(prefix.length));
        }
      }
    } catch (_) {}

    return "";
  }

  function writeStorage(key, value) {
    let saved = false;

    try {
      window.localStorage.setItem(key, value);
      saved = true;
    } catch (_) {}

    try {
      window.sessionStorage.setItem(key, value);
      saved = true;
    } catch (_) {}

    if (!saved) {
      try {
        document.cookie =
          encodeURIComponent(key) + "=" + encodeURIComponent(value) +
          "; Max-Age=31536000; Path=/; SameSite=Lax; Secure";
      } catch (_) {}
    }
  }

  function makePubId() {
    const stored = readStorage("cip_device_id");
    if (/^\d{4}$/.test(stored)) {
      return stored;
    }

    let number;
    try {
      const values = new Uint32Array(1);
      window.crypto.getRandomValues(values);
      number = values[0] % 10000;
    } catch (_) {
      number = Math.floor(Math.random() * 10000);
    }

    const id = String(number).padStart(4, "0");
    writeStorage("cip_device_id", id);
    return id;
  }

  const pubId = makePubId();
  idNode.textContent = pubId;
  if (el("bigDeviceId")) el("bigDeviceId").textContent = pubId;

  const urls = {
    drinksBtn: "http://192.168.0.50:8080/drinkskort/?id=" + encodeURIComponent(pubId) + "&v=15",
    jukeboxBtn: "http://192.168.0.50:5055/?id=" + encodeURIComponent(pubId) + "&v=15",
    pizzaBtn: "http://192.168.0.50:8091/pizza",
    cardBtn: "http://192.168.0.50:8080/klippekort.html?id=" + encodeURIComponent(pubId) + "&v=15",
    gamesBtn: "http://192.168.0.50:8080/mobilspil/?id=" + encodeURIComponent(pubId) + "&v=1"
  };

  let pendingUrl = "";

  function closeWifi() {
    if (el("wifiModal")) el("wifiModal").classList.add("hidden");
    pendingUrl = "";
  }

  function showWifi(url) {
    pendingUrl = url;
    if (el("wifiModal")) {
      el("wifiModal").classList.remove("hidden");
    } else {
      window.location.assign(url);
    }
  }

  Object.entries(urls).forEach(([buttonId, url]) => {
    const button = el(buttonId);
    if (button) {
      button.addEventListener("click", function () {
        showWifi(url);
      });
    }
  });

  if (el("continueLocalBtn")) {
    el("continueLocalBtn").addEventListener("click", function () {
      const url = pendingUrl;
      if (!url) {
        closeWifi();
        return;
      }
      pendingUrl = "";
      if (el("wifiModal")) el("wifiModal").classList.add("hidden");
      window.location.assign(url);
    });
  }

  if (el("closeWifiModal")) {
    el("closeWifiModal").addEventListener("click", closeWifi);
  }

  if (el("wifiModal")) {
    el("wifiModal").addEventListener("click", function (event) {
      if (event.target === el("wifiModal")) closeWifi();
    });
  }

  if (el("showIdBtn") && el("idModal")) {
    el("showIdBtn").addEventListener("click", function () {
      el("idModal").classList.remove("hidden");
    });
  }

  if (el("closeIdModal") && el("idModal")) {
    el("closeIdModal").addEventListener("click", function () {
      el("idModal").classList.add("hidden");
    });
  }

  if (el("copyWifi")) {
    el("copyWifi").addEventListener("click", async function () {
      try {
        await navigator.clipboard.writeText("pubben9982");
        el("copyWifi").textContent = "Kopieret";
        setTimeout(function () {
          el("copyWifi").textContent = "Kopiér kode";
        }, 1500);
      } catch (_) {}
    });
  }

  console.warn("Central Irish Pub: failsafe-start blev brugt, fordi normal app-start ikke fuldførte.");
}());
