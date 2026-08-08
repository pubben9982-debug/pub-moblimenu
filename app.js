"use strict";


/* =========================================================
   CENTRAL IRISH PUB - MOBILMENU
   ========================================================= */


/* ---------------------------------------------------------
   INDSTILLINGER
--------------------------------------------------------- */

const CONFIG = {
  drinksUrl:
    "http://192.168.0.50:8080/drinkskort/",

  jukeboxUrl:
    "http://192.168.0.50:5055/",

  pizzaUrl:
    "http://192.168.0.50:8091/pizza",

  clipsUrl:
    "http://192.168.0.50:8080/klippekort.html",

  wifiName:
    "pubben gæst",

  wifiPassword:
    "pubben9982"
};


/* ---------------------------------------------------------
   SPROG
--------------------------------------------------------- */

const TEXT = {

  da: {
    title:
      "Hvad har du lyst til?",

    deviceLabel:
      "Dit Pub-ID",

    showId:
      "Vis ID",

    drinksTitle:
      "Drinkskort",

    drinksText:
      "Se drinks, øl og priser",

    jukeboxTitle:
      "Jukebox",

    jukeboxText:
      "Ønsk musik fra din telefon",

    pizzaTitle:
      "Pizza",

    pizzaText:
      "Se pizza-menu",

    cardTitle:
      "Klippekort",

    cardText:
      "Se saldo og brug klip",

    wifiHelp:
      "De lokale funktioner kræver pubbens Wi-Fi",

    password:
      "Kode",

    copy:
      "Kopiér kode",

    copied:
      "Kopieret",

    footer:
      "Mobilmenuen kan også åbnes uden pubbens Wi-Fi",

    idTitle:
      "Dit Pub-ID",

    idHint:
      "Dette ID bruges til din fælles saldo, Jukebox og Klippekort."
  },


  en: {
    title:
      "What would you like?",

    deviceLabel:
      "Your Pub ID",

    showId:
      "Show ID",

    drinksTitle:
      "Drinks menu",

    drinksText:
      "See drinks, beer and prices",

    jukeboxTitle:
      "Jukebox",

    jukeboxText:
      "Request music from your phone",

    pizzaTitle:
      "Pizza",

    pizzaText:
      "See the pizza menu",

    cardTitle:
      "Punch card",

    cardText:
      "See balance and use punches",

    wifiHelp:
      "Local features require the pub Wi-Fi",

    password:
      "Password",

    copy:
      "Copy password",

    copied:
      "Copied",

    footer:
      "The mobile menu also works without the pub Wi-Fi",

    idTitle:
      "Your Pub ID",

    idHint:
      "This ID is used for your shared balance, Jukebox and punch card."
  },


  de: {
    title:
      "Was möchten Sie?",

    deviceLabel:
      "Ihre Pub-ID",

    showId:
      "ID anzeigen",

    drinksTitle:
      "Getränkekarte",

    drinksText:
      "Drinks, Bier und Preise",

    jukeboxTitle:
      "Jukebox",

    jukeboxText:
      "Musik mit dem Handy wünschen",

    pizzaTitle:
      "Pizza",

    pizzaText:
      "Pizzakarte ansehen",

    cardTitle:
      "Stempelkarte",

    cardText:
      "Guthaben ansehen und Stempel verwenden",

    wifiHelp:
      "Lokale Funktionen benötigen das Pub-WLAN",

    password:
      "Passwort",

    copy:
      "Passwort kopieren",

    copied:
      "Kopiert",

    footer:
      "Die Mobilkarte funktioniert auch ohne Pub-WLAN",

    idTitle:
      "Ihre Pub-ID",

    idHint:
      "Diese ID wird für Guthaben, Jukebox und Stempelkarte verwendet."
  },


  no: {
    title:
      "Hva har du lyst på?",

    deviceLabel:
      "Din Pub-ID",

    showId:
      "Vis ID",

    drinksTitle:
      "Drinkmeny",

    drinksText:
      "Se drinker, øl og priser",

    jukeboxTitle:
      "Jukebox",

    jukeboxText:
      "Ønsk musikk fra telefonen",

    pizzaTitle:
      "Pizza",

    pizzaText:
      "Se pizzamenyen",

    cardTitle:
      "Klippekort",

    cardText:
      "Se saldo og bruk klipp",

    wifiHelp:
      "Lokale funksjoner krever pubens Wi-Fi",

    password:
      "Passord",

    copy:
      "Kopier passord",

    copied:
      "Kopiert",

    footer:
      "Mobilmenyen fungerer også uten pubens Wi-Fi",

    idTitle:
      "Din Pub-ID",

    idHint:
      "Denne ID-en brukes til saldo, Jukebox og klippekort."
  }

};


/* ---------------------------------------------------------
   HJÆLPEFUNKTION
--------------------------------------------------------- */

function el(id) {
  return document.getElementById(id);
}


/* ---------------------------------------------------------
   PUB-ID
--------------------------------------------------------- */

function createPubId() {

  const oldId =
    localStorage.getItem(
      "cip_device_id"
    );


  if (
    oldId &&
    /^\d{4}$/.test(oldId)
  ) {
    return oldId;
  }


  let number;


  try {

    const values =
      new Uint32Array(1);

    crypto.getRandomValues(
      values
    );

    number =
      values[0] % 10000;

  } catch (error) {

    number =
      Math.floor(
        Math.random() * 10000
      );

  }


  const newId =
    String(number)
      .padStart(4, "0");


  localStorage.setItem(
    "cip_device_id",
    newId
  );


  return newId;
}


const pubId =
  createPubId();


if (el("deviceId")) {
  el("deviceId").textContent =
    pubId;
}


if (el("bigDeviceId")) {
  el("bigDeviceId").textContent =
    pubId;
}


/* ---------------------------------------------------------
   ÅBN LOKAL SIDE

   Vi bruger almindelig top-level navigation.
   Telefonen skal være på pubbens Wi-Fi for at nå
   192.168.0.50.
--------------------------------------------------------- */

function openPage(url) {

  window.location.assign(
    url
  );

}


/* ---------------------------------------------------------
   DRINKSKORT
--------------------------------------------------------- */

if (el("drinksBtn")) {

  el("drinksBtn")
    .addEventListener(
      "click",
      function () {

        openPage(
          CONFIG.drinksUrl
        );

      }
    );

}


/* ---------------------------------------------------------
   JUKEBOX

   Samme Pub-ID sendes til Jukebox.
--------------------------------------------------------- */

if (el("jukeboxBtn")) {

  el("jukeboxBtn")
    .addEventListener(
      "click",
      function () {

        const url =
          CONFIG.jukeboxUrl +
          "?id=" +
          encodeURIComponent(pubId) +
          "&v=10";


        openPage(url);

      }
    );

}


/* ---------------------------------------------------------
   PIZZA
--------------------------------------------------------- */

if (el("pizzaBtn")) {

  el("pizzaBtn")
    .addEventListener(
      "click",
      function () {

        openPage(
          CONFIG.pizzaUrl
        );

      }
    );

}


/* ---------------------------------------------------------
   KLIPPEKORT

   Samme Pub-ID som Jukebox.
--------------------------------------------------------- */

if (el("cardBtn")) {

  el("cardBtn")
    .addEventListener(
      "click",
      function () {

        const url =
          CONFIG.clipsUrl +
          "?id=" +
          encodeURIComponent(pubId) +
          "&v=10";


        openPage(url);

      }
    );

}


/* ---------------------------------------------------------
   PUB-ID POPUP
--------------------------------------------------------- */

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


/* Klik uden for boksen lukker popup */

if (el("idModal")) {

  el("idModal")
    .addEventListener(
      "click",
      function (event) {

        if (
          event.target ===
          el("idModal")
        ) {

          el("idModal")
            .classList
            .add("hidden");

        }

      }
    );

}


/* ---------------------------------------------------------
   KOPIER WIFI-KODE
--------------------------------------------------------- */

if (el("copyWifi")) {

  el("copyWifi")
    .addEventListener(
      "click",
      async function () {

        try {

          await navigator
            .clipboard
            .writeText(
              CONFIG.wifiPassword
            );

        } catch (error) {

          /* Clipboard kan være blokeret.
             Koden står stadig synligt på siden. */

        }


        const language =
          el("language")
            ? el("language").value
            : "da";


        const t =
          TEXT[language] ||
          TEXT.da;


        el("copyWifi")
          .textContent =
          t.copied;


        setTimeout(
          function () {

            el("copyWifi")
              .textContent =
              t.copy;

          },
          1500
        );

      }
    );

}


/* ---------------------------------------------------------
   SPROG
--------------------------------------------------------- */

function applyLanguage(
  language
) {

  const t =
    TEXT[language] ||
    TEXT.da;


  document.documentElement.lang =
    language;


  localStorage.setItem(
    "cip_lang",
    language
  );


  const elements = {

    title:
      "title",

    deviceLabel:
      "deviceLabel",

    showId:
      "showIdBtn",

    drinksTitle:
      "drinksTitle",

    drinksText:
      "drinksText",

    jukeboxTitle:
      "jukeboxTitle",

    jukeboxText:
      "jukeboxText",

    pizzaTitle:
      "pizzaTitle",

    pizzaText:
      "pizzaText",

    cardTitle:
      "cardTitle",

    cardText:
      "cardText",

    wifiHelp:
      "wifiHelp",

    password:
      "passwordLabel",

    copy:
      "copyWifi",

    footer:
      "footerText",

    idTitle:
      "idModalTitle",

    idHint:
      "idHint"

  };


  for (
    const [textKey, elementId]
    of Object.entries(elements)
  ) {

    const element =
      el(elementId);


    if (
      element &&
      t[textKey] !== undefined
    ) {

      element.textContent =
        t[textKey];

    }

  }


  if (el("language")) {
    el("language").value =
      language;
  }

}


/* ---------------------------------------------------------
   STARTSPROG
--------------------------------------------------------- */

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


applyLanguage(
  startLanguage
);
