"use strict";

const LOCAL_CONFIG =
  window.PUBMENU_CONFIG &&
  typeof window.PUBMENU_CONFIG === "object"
    ? window.PUBMENU_CONFIG
    : {};


const CONFIG = {
  drinksUrl: String(LOCAL_CONFIG.drinksUrl || ""),
  jukeboxUrl: String(LOCAL_CONFIG.jukeboxUrl || ""),
  pizzaUrl: String(LOCAL_CONFIG.pizzaUrl || ""),
  clipsUrl: String(LOCAL_CONFIG.clipsUrl || ""),
  gamesUrl: String(LOCAL_CONFIG.gamesUrl || ""),
  prizesUrl: String(LOCAL_CONFIG.prizesUrl || ""),
  giftcardPrizesEnabled:
    LOCAL_CONFIG.giftcardPrizesEnabled === true,

  wifiName: String(
    LOCAL_CONFIG.wifiName ||
    "Pubbens gæstenetværk"
  ),
  wifiPassword: String(
    LOCAL_CONFIG.wifiPassword ||
    ""
  )
};


const TEXT = {

  da: {
    title: "Hvad har du lyst til?",
    deviceLabel: "Dit Pub-ID",
    showId: "Vis ID",

    drinksTitle: "Drinkskort",
    drinksText: "Se drinks, øl og priser",

    jukeboxTitle: "Jukebox",
    jukeboxText: "Ønsk musik fra din telefon",

    pizzaTitle: "Pizza",
    pizzaText: "Se pizza-menu",

    cardTitle: "Klippekort",
    cardText: "Se saldo og brug klip",

    gamesTitle: "Mobilspil",
    gamesText: "Spin lykkehjulet",

    prizesTitle: "Mine gevinster",
    prizesText: "Se om dit gavekort er klar",

    wifiHelp: "De lokale funktioner kræver pubbens Wi-Fi",
    password: "Kode",
    copy: "Kopiér kode",
    copied: "Kopieret",

    footer: "Mobilmenuen kan også åbnes uden pubbens Wi-Fi",

    idTitle: "Dit Pub-ID",
    idHint: "Dette ID bruges til din fælles saldo, Jukebox, Drinkskort, Klippekort og Banko-gevinster.",

    wifiModalTitle: "Er du på pubbens Wi-Fi?",
    wifiModalText: "Denne funktion virker kun på pubbens lokale netværk.",
    wifiStep1: "Åbn Wi-Fi på telefonen",
    wifiStep2: "Vælg {wifiName}",
    wifiStep3: "Brug koden {wifiPassword}",
    wifiContinue: "JEG ER PÅ WI-FI – FORTSÆT",
    wifiHint: "Hvis siden ikke åbner bagefter, er telefonen sandsynligvis ikke på pubbens netværk."
  },


  en: {
    title: "What would you like?",
    deviceLabel: "Your Pub ID",
    showId: "Show ID",

    drinksTitle: "Drinks menu",
    drinksText: "See drinks, beer and prices",

    jukeboxTitle: "Jukebox",
    jukeboxText: "Request music from your phone",

    pizzaTitle: "Pizza",
    pizzaText: "See the pizza menu",

    cardTitle: "Punch card",
    cardText: "See balance and use punches",

    gamesTitle: "Mobile games",
    gamesText: "Spin the lucky wheel",

    prizesTitle: "My prizes",
    prizesText: "See if your gift card is ready",

    wifiHelp: "Local features require the pub Wi-Fi",
    password: "Password",
    copy: "Copy password",
    copied: "Copied",

    footer: "The mobile menu also works without the pub Wi-Fi",

    idTitle: "Your Pub ID",
    idHint: "This ID is used for your shared balance, Jukebox, Drinks menu, punch card and Bingo prizes.",

    wifiModalTitle: "Are you on the pub Wi-Fi?",
    wifiModalText: "This feature only works on the pub's local network.",
    wifiStep1: "Open Wi-Fi on your phone",
    wifiStep2: "Choose {wifiName}",
    wifiStep3: "Use the password {wifiPassword}",
    wifiContinue: "I AM ON WI-FI – CONTINUE",
    wifiHint: "If the page does not open afterwards, your phone is probably not connected to the pub network."
  },


  de: {
    title: "Was möchten Sie?",
    deviceLabel: "Ihre Pub-ID",
    showId: "ID anzeigen",

    drinksTitle: "Getränkekarte",
    drinksText: "Drinks, Bier und Preise",

    jukeboxTitle: "Jukebox",
    jukeboxText: "Musik mit dem Handy wünschen",

    pizzaTitle: "Pizza",
    pizzaText: "Pizzakarte ansehen",

    cardTitle: "Stempelkarte",
    cardText: "Guthaben ansehen und Stempel verwenden",

    gamesTitle: "Mobile Spiele",
    gamesText: "Drehen Sie das Glücksrad",

    prizesTitle: "Meine Gewinne",
    prizesText: "Prüfen, ob die Geschenkkarte bereit ist",

    wifiHelp: "Lokale Funktionen benötigen das Pub-WLAN",
    password: "Passwort",
    copy: "Passwort kopieren",
    copied: "Kopiert",

    footer: "Die Mobilkarte funktioniert auch ohne Pub-WLAN",

    idTitle: "Ihre Pub-ID",
    idHint: "Diese ID wird für Guthaben, Jukebox, Getränkekarte, Stempelkarte und Bingo-Gewinne verwendet.",

    wifiModalTitle: "Sind Sie mit dem Pub-WLAN verbunden?",
    wifiModalText: "Diese Funktion funktioniert nur im lokalen Netzwerk des Pubs.",
    wifiStep1: "Öffnen Sie das WLAN auf Ihrem Telefon",
    wifiStep2: "Wählen Sie {wifiName}",
    wifiStep3: "Verwenden Sie das Passwort {wifiPassword}",
    wifiContinue: "ICH BIN IM WLAN – WEITER",
    wifiHint: "Wenn die Seite danach nicht geöffnet wird, ist Ihr Telefon wahrscheinlich nicht mit dem Pub-Netzwerk verbunden."
  },


  no: {
    title: "Hva har du lyst på?",
    deviceLabel: "Din Pub-ID",
    showId: "Vis ID",

    drinksTitle: "Drinkmeny",
    drinksText: "Se drinker, øl og priser",

    jukeboxTitle: "Jukebox",
    jukeboxText: "Ønsk musikk fra telefonen",

    pizzaTitle: "Pizza",
    pizzaText: "Se pizzamenyen",

    cardTitle: "Klippekort",
    cardText: "Se saldo og bruk klipp",

    gamesTitle: "Mobilspill",
    gamesText: "Spinn lykkehjulet",

    prizesTitle: "Mine gevinster",
    prizesText: "Se om gavekortet er klart",

    wifiHelp: "Lokale funksjoner krever pubens Wi-Fi",
    password: "Passord",
    copy: "Kopier passord",
    copied: "Kopiert",

    footer: "Mobilmenyen fungerer også uten pubens Wi-Fi",

    idTitle: "Din Pub-ID",
    idHint: "Denne ID-en brukes til saldo, Jukebox, drinkmeny, klippekort og Bingo-gevinster.",

    wifiModalTitle: "Er du på pubens Wi-Fi?",
    wifiModalText: "Denne funksjonen virker bare på pubens lokale nettverk.",
    wifiStep1: "Åpne Wi-Fi på telefonen",
    wifiStep2: "Velg {wifiName}",
    wifiStep3: "Bruk passordet {wifiPassword}",
    wifiContinue: "JEG ER PÅ WI-FI – FORTSETT",
    wifiHint: "Hvis siden ikke åpnes etterpå, er telefonen sannsynligvis ikke koblet til pubens nettverk."
  }

};


function el(id) {
  return document.getElementById(id);
}


function getPubId() {

  let id = localStorage.getItem("cip_device_id");

  if (id && /^\d{4}$/.test(id)) {
    return id;
  }

  let number = 0;

  try {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    number = values[0] % 10000;
  } catch (error) {
    number = Math.floor(Math.random() * 10000);
  }

  id = String(number).padStart(4, "0");

  localStorage.setItem(
    "cip_device_id",
    id
  );

  return id;
}


const pubId = getPubId();


if (el("deviceId")) {
  el("deviceId").textContent = pubId;
}


if (el("bigDeviceId")) {
  el("bigDeviceId").textContent = pubId;
}


if (el("prizesBtn") && CONFIG.giftcardPrizesEnabled) {
  el("prizesBtn").hidden = false;
}


function openPage(url) {
  const target = String(url || "").trim();

  if (!target) {
    window.alert("Den lokale adresse er ikke sat endnu.");
    return;
  }

  window.location.assign(target);
}


/* =========================================================
   LOKALE LINKS
   ========================================================= */

function buildPubIdUrl(url, version) {
  const base = String(url || "").trim();

  if (!base) {
    return "";
  }

  const separator =
    base.indexOf("?") === -1
      ? "?"
      : "&";

  return (
    base +
    separator +
    "id=" +
    encodeURIComponent(pubId) +
    (version ? "&v=" + encodeURIComponent(version) : "")
  );
}


function buildDrinksUrl() {
  return buildPubIdUrl(CONFIG.drinksUrl, "15");
}


function buildJukeboxUrl() {
  return buildPubIdUrl(CONFIG.jukeboxUrl, "15");
}


function buildPizzaUrl() {
  return String(CONFIG.pizzaUrl || "");
}


function buildClipsUrl() {
  return buildPubIdUrl(CONFIG.clipsUrl, "15");
}


function buildGamesUrl() {
  return buildPubIdUrl(CONFIG.gamesUrl, "1");
}


function buildPrizesUrl() {
  return buildPubIdUrl(CONFIG.prizesUrl, "");
}


/* =========================================================
   WIFI POPUP
   ========================================================= */

let pendingLocalUrl = "";


function showWifiModal(url) {

  pendingLocalUrl = String(url || "");

  if (!el("wifiModal")) {
    openPage(pendingLocalUrl);
    return;
  }

  el("wifiModal")
    .classList
    .remove("hidden");
}


function closeWifiModal() {

  if (el("wifiModal")) {
    el("wifiModal")
      .classList
      .add("hidden");
  }

  pendingLocalUrl = "";
}


if (el("continueLocalBtn")) {

  el("continueLocalBtn")
    .addEventListener(
      "click",
      function () {

        const url = pendingLocalUrl;

        if (!url) {
          closeWifiModal();
          return;
        }

        pendingLocalUrl = "";

        if (el("wifiModal")) {
          el("wifiModal")
            .classList
            .add("hidden");
        }

        openPage(url);
      }
    );
}


if (
  el("closeWifiModal") &&
  el("wifiModal")
) {

  el("closeWifiModal")
    .addEventListener(
      "click",
      closeWifiModal
    );
}


if (el("wifiModal")) {

  el("wifiModal")
    .addEventListener(
      "click",
      function (event) {

        if (event.target === el("wifiModal")) {
          closeWifiModal();
        }
      }
    );
}


/* =========================================================
   DRINKSKORT
   ========================================================= */

if (el("drinksBtn")) {

  el("drinksBtn")
    .addEventListener(
      "click",
      function () {
        showWifiModal(buildDrinksUrl());
      }
    );
}


/* =========================================================
   JUKEBOX
   ========================================================= */

if (el("jukeboxBtn")) {

  el("jukeboxBtn")
    .addEventListener(
      "click",
      function () {
        showWifiModal(buildJukeboxUrl());
      }
    );
}


/* =========================================================
   PIZZA
   ========================================================= */

if (el("pizzaBtn")) {

  el("pizzaBtn")
    .addEventListener(
      "click",
      function () {
        showWifiModal(buildPizzaUrl());
      }
    );
}


/* =========================================================
   KLIPPEKORT
   ========================================================= */

if (el("cardBtn")) {

  el("cardBtn")
    .addEventListener(
      "click",
      function () {
        showWifiModal(buildClipsUrl());
      }
    );
}


/* =========================================================
   MOBILSPIL
   ========================================================= */

if (el("gamesBtn")) {

  el("gamesBtn")
    .addEventListener(
      "click",
      function () {
        showWifiModal(buildGamesUrl());
      }
    );
}


/* =========================================================
   MINE GEVINSTER
   ========================================================= */

if (el("prizesBtn")) {

  el("prizesBtn")
    .addEventListener(
      "click",
      function () {
        showWifiModal(buildPrizesUrl());
      }
    );
}


/* =========================================================
   PUB-ID POPUP
   ========================================================= */

if (
  el("showIdBtn") &&
  el("idModal")
) {

  el("showIdBtn")
    .addEventListener(
      "click",
      function () {
        el("idModal")
          .classList
          .remove("hidden");
      }
    );
}


if (
  el("closeIdModal") &&
  el("idModal")
) {

  el("closeIdModal")
    .addEventListener(
      "click",
      function () {
        el("idModal")
          .classList
          .add("hidden");
      }
    );
}


if (el("idModal")) {

  el("idModal")
    .addEventListener(
      "click",
      function (event) {

        if (event.target === el("idModal")) {
          el("idModal")
            .classList
            .add("hidden");
        }
      }
    );
}


/* =========================================================
   KOPIER WIFI-KODE
   ========================================================= */

if (el("copyWifi")) {

  el("copyWifi")
    .addEventListener(
      "click",
      async function () {

        try {
          await navigator.clipboard.writeText(
            CONFIG.wifiPassword
          );
        } catch (error) {
          // Koden står synligt på siden.
        }

        const language =
          el("language")
            ? el("language").value
            : "da";

        const t =
          TEXT[language] ||
          TEXT.da;

        el("copyWifi").textContent =
          t.copied;

        setTimeout(
          function () {
            el("copyWifi").textContent =
              t.copy;
          },
          1500
        );
      }
    );
}


/* =========================================================
   SPROG
   ========================================================= */

function formatConfiguredText(value) {

  return String(value)
    .split("{wifiName}")
    .join(CONFIG.wifiName)
    .split("{wifiPassword}")
    .join(CONFIG.wifiPassword || "—");
}


function applyLanguage(language) {

  const t =
    TEXT[language] ||
    TEXT.da;

  localStorage.setItem(
    "cip_lang",
    language
  );

  document.documentElement.lang =
    language;

  const map = {
    title: "title",

    deviceLabel: "deviceLabel",
    showId: "showIdBtn",

    drinksTitle: "drinksTitle",
    drinksText: "drinksText",

    jukeboxTitle: "jukeboxTitle",
    jukeboxText: "jukeboxText",

    pizzaTitle: "pizzaTitle",
    pizzaText: "pizzaText",

    cardTitle: "cardTitle",
    cardText: "cardText",

    gamesTitle: "gamesTitle",
    gamesText: "gamesText",

    prizesTitle: "prizesTitle",
    prizesText: "prizesText",

    wifiHelp: "wifiHelp",
    password: "passwordLabel",
    copy: "copyWifi",

    footer: "footerText",

    idTitle: "idModalTitle",
    idHint: "idHint",

    wifiModalTitle: "wifiModalTitle",
    wifiModalText: "wifiModalText",
    wifiStep1: "wifiStep1",
    wifiStep2: "wifiStep2",
    wifiStep3: "wifiStep3",
    wifiContinue: "continueLocalBtn",
    wifiHint: "wifiModalHint"
  };

  for (
    const [textKey, elementId]
    of Object.entries(map)
  ) {

    const element = el(elementId);

    if (
      element &&
      t[textKey] !== undefined
    ) {
      element.textContent =
        formatConfiguredText(t[textKey]);
    }
  }

  if (el("wifiNameValue")) {
    el("wifiNameValue").textContent =
      CONFIG.wifiName;
  }


  if (el("wifiPasswordValue")) {
    el("wifiPasswordValue").textContent =
      CONFIG.wifiPassword || "—";
  }


  if (el("language")) {
    el("language").value =
      language;
  }
}


const browserLanguage =
  (
    navigator.language ||
    "da"
  )
    .slice(0, 2)
    .toLowerCase();


const storedLanguage =
  localStorage.getItem(
    "cip_lang"
  );


let startLanguage =
  storedLanguage ||
  browserLanguage;


if (!TEXT[startLanguage]) {
  startLanguage = "da";
}


if (el("language")) {

  el("language")
    .addEventListener(
      "change",
      function () {

        applyLanguage(
          el("language").value
        );
      }
    );
}


applyLanguage(startLanguage);
