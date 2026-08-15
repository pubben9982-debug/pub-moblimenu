"use strict";

(function () {
  var idNode = document.getElementById("deviceId");

  // Den normale app er startet korrekt. Gør ingenting.
  if (!idNode || String(idNode.innerHTML).replace(/^\s+|\s+$/g, "") !== "----") {
    return;
  }

  function el(id) {
    return document.getElementById(id);
  }

  function trim(value) {
    return String(value || "").replace(/^\s+|\s+$/g, "");
  }

  function hasClass(node, name) {
    return new RegExp("(^|\\s)" + name + "(\\s|$)").test(node.className || "");
  }

  function addClass(node, name) {
    if (node && !hasClass(node, name)) {
      node.className = trim((node.className || "") + " " + name);
    }
  }

  function removeClass(node, name) {
    if (node) {
      node.className = trim(String(node.className || "").replace(new RegExp("(^|\\s)" + name + "(?=\\s|$)", "g"), " ").replace(/\s+/g, " "));
    }
  }

  function readStorage(key) {
    var value = "";
    var prefix;
    var parts;
    var i;
    var item;

    try {
      value = window.localStorage.getItem(key) || "";
      if (value) return value;
    } catch (error1) {}

    try {
      value = window.sessionStorage.getItem(key) || "";
      if (value) return value;
    } catch (error2) {}

    try {
      prefix = encodeURIComponent(key) + "=";
      parts = String(document.cookie || "").split(";");
      for (i = 0; i < parts.length; i += 1) {
        item = trim(parts[i]);
        if (item.indexOf(prefix) === 0) {
          return decodeURIComponent(item.substring(prefix.length));
        }
      }
    } catch (error3) {}

    return "";
  }

  function writeStorage(key, value) {
    var saved = false;

    try {
      window.localStorage.setItem(key, value);
      saved = true;
    } catch (error1) {}

    try {
      window.sessionStorage.setItem(key, value);
      saved = true;
    } catch (error2) {}

    if (!saved) {
      try {
        document.cookie = encodeURIComponent(key) + "=" + encodeURIComponent(value) + "; Max-Age=31536000; Path=/; SameSite=Lax; Secure";
      } catch (error3) {}
    }
  }

  function makePubId() {
    var stored = readStorage("cip_device_id");
    var number;
    var values;
    var id;

    if (/^\d{4}$/.test(stored)) {
      return stored;
    }

    try {
      values = new Uint32Array(1);
      window.crypto.getRandomValues(values);
      number = values[0] % 10000;
    } catch (error) {
      number = Math.floor(Math.random() * 10000);
    }

    id = String(number);
    while (id.length < 4) id = "0" + id;
    writeStorage("cip_device_id", id);
    return id;
  }

  function setText(node, value) {
    if (!node) return;
    if (typeof node.textContent !== "undefined") node.textContent = value;
    else node.innerText = value;
  }

  var pubId = makePubId();
  setText(idNode, pubId);
  setText(el("bigDeviceId"), pubId);

  var urls = {
    drinksBtn: "http://192.168.0.50:8080/drinkskort/?id=" + encodeURIComponent(pubId) + "&v=15",
    jukeboxBtn: "http://192.168.0.50:5055/?id=" + encodeURIComponent(pubId) + "&v=15",
    pizzaBtn: "http://192.168.0.50:8091/pizza",
    cardBtn: "http://192.168.0.50:8080/klippekort.html?id=" + encodeURIComponent(pubId) + "&v=15",
    gamesBtn: "http://192.168.0.50:8080/mobilspil/?id=" + encodeURIComponent(pubId) + "&v=1"
  };

  var pendingUrl = "";

  function closeWifi() {
    addClass(el("wifiModal"), "hidden");
    pendingUrl = "";
  }

  function showWifi(url) {
    pendingUrl = url;
    if (el("wifiModal")) {
      removeClass(el("wifiModal"), "hidden");
    } else {
      window.location.href = url;
    }
  }

  function bindClick(node, handler) {
    if (!node) return;
    if (node.addEventListener) node.addEventListener("click", handler, false);
    else if (node.attachEvent) node.attachEvent("onclick", handler);
    else node.onclick = handler;
  }

  function bindMenu(buttonId, url) {
    bindClick(el(buttonId), function () {
      showWifi(url);
    });
  }

  bindMenu("drinksBtn", urls.drinksBtn);
  bindMenu("jukeboxBtn", urls.jukeboxBtn);
  bindMenu("pizzaBtn", urls.pizzaBtn);
  bindMenu("cardBtn", urls.cardBtn);
  bindMenu("gamesBtn", urls.gamesBtn);

  bindClick(el("continueLocalBtn"), function () {
    var url = pendingUrl;
    if (!url) {
      closeWifi();
      return;
    }
    pendingUrl = "";
    addClass(el("wifiModal"), "hidden");
    window.location.href = url;
  });

  bindClick(el("closeWifiModal"), closeWifi);

  bindClick(el("wifiModal"), function (event) {
    event = event || window.event;
    if (event && (event.target || event.srcElement) === el("wifiModal")) closeWifi();
  });

  bindClick(el("showIdBtn"), function () {
    removeClass(el("idModal"), "hidden");
  });

  bindClick(el("closeIdModal"), function () {
    addClass(el("idModal"), "hidden");
  });

  bindClick(el("idModal"), function (event) {
    event = event || window.event;
    if (event && (event.target || event.srcElement) === el("idModal")) addClass(el("idModal"), "hidden");
  });

  // Gammel Samsung-browser: kopi-knappen er bonus, ikke nødvendig for menuen.
  bindClick(el("copyWifi"), function () {
    setText(el("copyWifi"), "Kode: pubben9982");
    window.setTimeout(function () {
      setText(el("copyWifi"), "Kopiér kode");
    }, 1800);
  });

  window.CIP_LEGACY_FAILSAFE = true;
}());
