const CONFIG = {
  drinksUrl: "http://192.168.0.50:8080/drinkskort/",
  jukeboxUrl: "http://192.168.0.50:5055/",
  gamesUrl: "http://192.168.0.50:5050/",
  pizzaUrl: "http://192.168.0.50:8091/pizza",
  clipsUrl: "http://192.168.0.50:8080/klippekort.html",

  wifiName: "pubben gæst",
  wifiPassword: "pubben9982"
};


const T = {

  da: {
    title: "Hvad har du lyst til?",

    deviceLabel: "Din enhed",
    showId: "Vis QR / ID",

    drinksTitle: "Drinkskort",
    drinksText: "Se drinks, øl og priser",

    jukeboxTitle: "Jukebox",
    jukeboxText: "Ønsk musik fra din telefon",

    gamesTitle: "Poker",
    gamesText: "Spil poker fra din telefon",

    pizzaTitle: "Pizza",
    pizzaText: "Se pizza-menu og bestil",

    cardTitle: "Klippekort",
    cardText: "Se saldo og brug klip",

    wifiHelp: "Lokale funktioner kræver pubbens Wi-Fi",

    password: "Kode",
    copy: "Kopiér kode",
    copied: "Kopieret",

    footer: "Samme QR-kode kan bruges næste gang",

    modalTitle: "Forbind til pubbens Wi-Fi",

    step1: "Åbn Wi-Fi på telefonen",
    step2: "Vælg",
    step3: "Skriv koden",

    continue: "Jeg er på Wi-Fi – åbn",

    hint:
      "Virker knappen ikke, er telefonen sandsynligvis ikke på pubbens netværk endnu.",

    idTitle: "Dit Pub-ID",

    idHint:
      "Vis dette nummer til bartenderen. Det gemmes kun i denne browser."
  },


  en: {
    title: "What would you like?",

    deviceLabel: "Your device",
    showId: "Show QR / ID",

    drinksTitle: "Drinks menu",
    drinksText: "See drinks, beer and prices",

    jukeboxTitle: "Jukebox",
    jukeboxText: "Request music from your phone",

    gamesTitle: "Poker",
    gamesText: "Play poker from your phone",

    pizzaTitle: "Pizza",
    pizzaText: "See the pizza menu and order",

    cardTitle: "Punch card",
    cardText: "See balance and use punches",

    wifiHelp: "Local features require the pub Wi-Fi",

    password: "Password",
    copy: "Copy password",
    copied: "Copied",

    footer: "Use the same QR code next time",

    modalTitle: "Connect to the pub Wi-Fi",

    step1: "Open Wi-Fi settings on your phone",
    step2: "Choose",
    step3: "Enter the password",

    continue: "I am on Wi-Fi – open",

    hint:
      "If the button does not work, your phone is probably not connected to the pub network yet.",

    idTitle: "Your Pub ID",

    idHint:
      "Show this number to the bartender. It is stored only in this browser."
  },


  de: {
    title: "Was möchten Sie?",

    deviceLabel: "Ihr Gerät",
    showId: "QR / ID anzeigen",

    drinksTitle: "Getränkekarte",
    drinksText: "Drinks, Bier und Preise",

    jukeboxTitle: "Jukebox",
    jukeboxText: "Musik mit dem Handy wünschen",

    gamesTitle: "Poker",
    gamesText: "Poker mit dem Handy spielen",

    pizzaTitle: "Pizza",
    pizzaText: "Pizzakarte ansehen und bestellen",

    cardTitle: "Stempelkarte",
    cardText: "Guthaben ansehen und Stempel verwenden",

    wifiHelp: "Lokale Funktionen benötigen das Pub-WLAN",

    password: "Passwort",
    copy: "Passwort kopieren",
    copied: "Kopiert",

    footer: "Derselbe QR-Code funktioniert beim nächsten Besuch",

    modalTitle: "Mit dem Pub-WLAN verbinden",

    step1: "WLAN-Einstellungen am Handy öffnen",
    step2: "Auswählen",
    step3: "Passwort eingeben",

    continue: "Ich bin im WLAN – öffnen",

    hint:
      "Wenn die Schaltfläche nicht funktioniert, ist das Handy wahrscheinlich noch nicht mit dem Pub-Netzwerk verbunden.",

    idTitle: "Ihre Pub-ID",

    idHint:
      "Zeigen Sie diese Nummer dem Barkeeper. Sie wird nur in diesem Browser gespeichert."
  },


  no: {
    title: "Hva har du lyst på?",

    deviceLabel: "Din enhet",
    showId: "Vis QR / ID",

    drinksTitle: "Drinkmeny",
    drinksText: "Se drinker, øl og priser",

    jukeboxTitle: "Jukebox",
    jukeboxText: "Ønsk musikk fra telefonen",

    gamesTitle: "Poker",
    gamesText: "Spill poker fra telefonen",

    pizzaTitle: "Pizza",
    pizzaText: "Se pizzamenyen og bestill",

    cardTitle: "Klippekort",
    cardText: "Se saldo og bruk klipp",

    wifiHelp: "Lokale funksjoner krever pubens Wi-Fi",

    password: "Passord",
    copy: "Kopier passord",
    copied: "Kopiert",

    footer: "Den samme QR-koden kan brukes neste gang",

    modalTitle: "Koble til pubens Wi-Fi",

    step1: "Åpne Wi-Fi på telefonen",
    step2: "Velg",
    step3: "Skriv passordet",

    continue: "Jeg er på Wi-Fi – åpne",

    hint:
      "Hvis knappen ikke virker, er telefonen sannsynligvis ikke koblet til pubens nettverk ennå.",

    idTitle: "Din Pub-ID",

    idHint:
      "Vis dette nummeret til bartenderen. Det lagres bare i denne nettleseren."
  }

};


function el(id) {
  return document.getElementById(id);
}


/* -------------------------------------------------
   PUB-ID
------------------------------------------------- */

function makeId() {

  let id = localStorage.getItem("cip_device_id");

  if (!id) {

    const values = new Uint32Array(1);
    crypto.getRandomValues(values);

    const number = values[0] % 10000;

    id = String(number).padStart(4, "0");

    localStorage.setItem(
      "cip_device_id",
      id
    );
  }

  return id;
}


const deviceId = makeId();


if (el("deviceId")) {
  el("deviceId").textContent = deviceId;
}


if (el("bigDeviceId")) {
  el("bigDeviceId").textContent = deviceId;
}


/* -------------------------------------------------
   LOKALE LINKS / WIFI POPUP
------------------------------------------------- */

let pendingUrl = null;


function openLocal(url) {

  pendingUrl = url;

  if (el("wifiModal")) {
    el("wifiModal").classList.remove("hidden");
  }
}


/* Drinkskort */

if (el("drinksBtn")) {

  el("drinksBtn").onclick = function () {

    openLocal(
      CONFIG.drinksUrl
    );

  };

}


/* Jukebox */

if (el("jukeboxBtn")) {

  el("jukeboxBtn").onclick = function () {

    const url =
      CONFIG.jukeboxUrl +
      "?id=" +
      encodeURIComponent(deviceId) +
      "&v=7";

    openLocal(url);

  };

}


/* Poker */

if (el("gamesBtn")) {

  el("gamesBtn").onclick = function () {

    const url =
      CONFIG.gamesUrl +
      "?id=" +
      encodeURIComponent(deviceId);

    openLocal(url);

  };

}


/* Pizza */

if (el("pizzaBtn")) {

  el("pizzaBtn").onclick = function () {

    openLocal(
      CONFIG.pizzaUrl
    );

  };

}


/* KLIPPEKORT
   Sender samme Pub-ID som Jukebox og Poker
*/

if (el("cardBtn")) {

  el("cardBtn").onclick = function () {

    const url =
      CONFIG.clipsUrl +
      "?id=" +
      encodeURIComponent(deviceId);

    openLocal(url);

  };

}


/* -------------------------------------------------
   WIFI POPUP
------------------------------------------------- */

if (el("continueBtn")) {

  el("continueBtn").onclick = function () {

    if (pendingUrl) {
      location.href = pendingUrl;
    }

  };

}


if (el("closeModal")) {

  el("closeModal").onclick = function () {

    el("wifiModal").classList.add("hidden");

    pendingUrl = null;

  };

}


/* -------------------------------------------------
   PUB-ID POPUP
------------------------------------------------- */

if (el("showIdBtn")) {

  el("showIdBtn").onclick = function () {

    el("idModal").classList.remove("hidden");

  };

}


if (el("closeIdModal")) {

  el("closeIdModal").onclick = function () {

    el("idModal").classList.add("hidden");

  };

}


/* -------------------------------------------------
   KOPIER WIFI-KODE
------------------------------------------------- */

if (el("copyWifi")) {

  el("copyWifi").onclick = async function () {

    try {

      await navigator.clipboard.writeText(
        CONFIG.wifiPassword
      );

    } catch (error) {
      // Telefonen kan blokere clipboard.
    }


    const language =
      el("language")
        ? el("language").value
        : "da";


    const text =
      T[language] || T.da;


    el("copyWifi").textContent =
      text.copied;


    setTimeout(function () {

      el("copyWifi").textContent =
        text.copy;

    }, 1500);

  };

}


/* -------------------------------------------------
   SPROG
------------------------------------------------- */

function applyLanguage(lang) {

  const t =
    T[lang] || T.da;


  localStorage.setItem(
    "cip_lang",
    lang
  );


  document.documentElement.lang =
    lang;


  const map = {

    title: "title",

    deviceLabel: "deviceLabel",
    showId: "showIdBtn",

    drinksTitle: "drinksTitle",
    drinksText: "drinksText",

    jukeboxTitle: "jukeboxTitle",
    jukeboxText: "jukeboxText",

    gamesTitle: "gamesTitle",
    gamesText: "gamesText",

    pizzaTitle: "pizzaTitle",
    pizzaText: "pizzaText",

    cardTitle: "cardTitle",
    cardText: "cardText",

    wifiHelp: "wifiHelp",

    password: "passwordLabel",

    copy: "copyWifi",

    footer: "footerText",

    modalTitle: "modalTitle",

    step1: "step1",
    step2: "step2",
    step3: "step3",

    continue: "continueBtn",

    hint: "modalHint",

    idTitle: "idModalTitle",
    idHint: "idHint"

  };


  for (
    const [key, elementId]
    of Object.entries(map)
  ) {

    const element =
      el(elementId);


    if (
      element &&
      t[key] !== undefined
    ) {

      element.textContent =
        t[key];

    }

  }

}


/* -------------------------------------------------
   STARTSPROG
------------------------------------------------- */

const browserLang =
  (navigator.language || "da")
    .slice(0, 2);


const savedLanguage =
  localStorage.getItem("cip_lang");


const startLang =
  savedLanguage ||
  (
    T[browserLang]
      ? browserLang
      : "da"
  );


if (el("language")) {

  el("language").value =
    startLang;


  el("language").onchange =
    function (event) {

      applyLanguage(
        event.target.value
      );

    };

}


applyLanguage(startLang);
