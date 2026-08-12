"use strict";

(function () {
  let deferredPrompt = null;

  const button = document.getElementById("installShortcutBtn");
  const card = document.getElementById("shortcutCard");
  const modal = document.getElementById("installModal");
  const instructions = document.getElementById("installInstructions");
  const close = document.getElementById("closeInstallModal");
  const ok = document.getElementById("installOkBtn");

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  function hideIfInstalled() {
    if (card && isStandalone()) {
      card.classList.add("installed");
    }
  }

  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }

  function showInstructions() {
    if (!modal || !instructions) return;

    if (isIOS()) {
      instructions.innerHTML =
        "<p><strong>iPhone/iPad:</strong></p>" +
        "<ol>" +
        "<li>Tryk på <span class=\"install-share\">□↑</span> Del i Safari.</li>" +
        "<li>Vælg <strong>Føj til hjemmeskærm</strong>.</li>" +
        "<li>Tryk <strong>Tilføj</strong>.</li>" +
        "</ol>" +
        "<p>Så får du et Central Irish Pub-ikon på hjemmeskærmen.</p>";
    } else {
      instructions.innerHTML =
        "<p><strong>Android:</strong></p>" +
        "<ol>" +
        "<li>Åbn browserens menu <strong>⋮</strong>.</li>" +
        "<li>Vælg <strong>Installer app</strong> eller <strong>Føj til startskærm</strong>.</li>" +
        "<li>Bekræft.</li>" +
        "</ol>" +
        "<p>Så kan pubmenuen åbnes direkte næste gang.</p>";
    }

    modal.classList.remove("hidden");
  }

  async function install() {
    if (isStandalone()) {
      hideIfInstalled();
      return;
    }

    if (!deferredPrompt) {
      showInstructions();
      return;
    }

    deferredPrompt.prompt();
    try {
      await deferredPrompt.userChoice;
    } catch (error) {
      // Browseren kan afvise prompten uden at noget er galt.
    }
    deferredPrompt = null;
    hideIfInstalled();
  }

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferredPrompt = event;
  });

  window.addEventListener("appinstalled", function () {
    deferredPrompt = null;
    if (card) card.classList.add("installed");
  });

  if (button) button.addEventListener("click", install);

  function closeModal() {
    if (modal) modal.classList.add("hidden");
  }

  if (close) close.addEventListener("click", closeModal);
  if (ok) ok.addEventListener("click", closeModal);
  if (modal) {
    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeModal();
    });
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js?v=1").catch(function () {});
    });
  }

  hideIfInstalled();
})();
