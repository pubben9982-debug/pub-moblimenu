(function () {
  "use strict";

  var species = window.NATUR_SPECIES || [];
  var state = loadState();
  var pendingPhoto = "";
  var pendingAi = null;
  var aiModelPromise = null;

  var pointsEl = document.getElementById("points");
  var uniqueCountEl = document.getElementById("uniqueCount");
  var collectionGrid = document.getElementById("collectionGrid");
  var speciesSelect = document.getElementById("speciesSelect");
  var photoInput = document.getElementById("photoInput");
  var preview = document.getElementById("preview");
  var photoStage = document.getElementById("photoStage");
  var saveFindingBtn = document.getElementById("saveFindingBtn");
  var saveAiFindingBtn = document.getElementById("saveAiFindingBtn");
  var aiStatus = document.getElementById("aiStatus");
  var findingResult = document.getElementById("findingResult");
  var duelA = document.getElementById("duelA");
  var duelB = document.getElementById("duelB");
  var duelBtn = document.getElementById("duelBtn");
  var duelArena = document.getElementById("duelArena");
  var leaderboard = document.getElementById("leaderboard");

  init();

  function init() {
    fillSpeciesSelect();
    wireTabs();
    wireCamera();
    wireDuel();
    wireReset();
    renderAll();

    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    }
  }

  function loadState() {
    try {
      var parsed = JSON.parse(localStorage.getItem("naturjagten-v0") || "{}");
      return {
        points: Number(parsed.points || 0),
        findings: Array.isArray(parsed.findings) ? parsed.findings : []
      };
    } catch (err) {
      return { points: 0, findings: [] };
    }
  }

  function saveState() {
    localStorage.setItem("naturjagten-v0", JSON.stringify(state));
  }

  function fillSpeciesSelect() {
    species.forEach(function (item) {
      var option = document.createElement("option");
      option.value = item.id;
      option.textContent = item.emoji + " " + item.name + " · " + item.rarity + (item.points ? " · " + item.points + " point" : "");
      speciesSelect.appendChild(option);
    });
  }

  function wireTabs() {
    document.querySelectorAll(".tab").forEach(function (button) {
      button.addEventListener("click", function () {
        document.querySelectorAll(".tab").forEach(function (tab) { tab.classList.remove("active"); });
        document.querySelectorAll(".view").forEach(function (view) { view.classList.remove("active"); });
        button.classList.add("active");
        document.getElementById(button.dataset.view).classList.add("active");
      });
    });
  }

  function wireCamera() {
    photoInput.addEventListener("change", function () {
      var file = photoInput.files && photoInput.files[0];
      if (!file) return;

      pendingAi = null;
      saveAiFindingBtn.classList.add("hidden");
      setAiStatus("waiting", "🤖 Forbereder billedet…", "Test-AI'en kører på din telefon/browser.");

      compressImage(file, function (dataUrl) {
        pendingPhoto = dataUrl;
        preview.onload = function () {
          runLocalVision(preview);
        };
        preview.src = dataUrl;
        photoStage.classList.remove("hidden");
        findingResult.classList.add("hidden");
      });
    });

    saveAiFindingBtn.addEventListener("click", function () {
      if (!pendingPhoto || !pendingAi || pendingAi.bonus <= 0) return;
      saveBroadAiFinding();
    });

    saveFindingBtn.addEventListener("click", function () {
      var id = speciesSelect.value;
      if (!id || !pendingPhoto) return;
      recordFinding(id, pendingPhoto, pendingAi && pendingAi.bonus ? pendingAi.bonus : 0);
    });
  }

  function compressImage(file, callback) {
    var reader = new FileReader();
    reader.onload = function (event) {
      var img = new Image();
      img.onload = function () {
        var max = 720;
        var scale = Math.min(1, max / Math.max(img.width, img.height));
        var canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        callback(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  function getAiModel() {
    if (aiModelPromise) return aiModelPromise;

    if (!window.mobilenet) {
      return Promise.reject(new Error("MobileNet blev ikke indlæst"));
    }

    setAiStatus("working", "🤖 Henter den lille test-AI første gang…", "Det kan tage lidt længere tid på første billede.");
    aiModelPromise = window.mobilenet.load({ version: 2, alpha: 0.5 });
    return aiModelPromise;
  }

  function runLocalVision(img) {
    setAiStatus("working", "🤖 Kigger på billedet…", "Den prøver kun at finde brede naturtyper.");

    getAiModel()
      .then(function (model) {
        return model.classify(img, 5);
      })
      .then(function (predictions) {
        var match = findNatureMatch(predictions);
        if (!match) {
          pendingAi = { bonus: 0, category: "", confidence: 0 };
          setAiStatus(
            "no-match",
            "🤔 Jeg er ikke sikker på, at jeg kan genkende det som natur",
            "Du kan stadig vælge arten manuelt nedenunder. Ingen testpoint gives automatisk."
          );
          saveAiFindingBtn.classList.add("hidden");
          return;
        }

        var hash = simpleHash(pendingPhoto);
        var duplicate = state.findings.some(function (finding) { return finding.photoHash === hash; });
        var bonus = duplicate ? 0 : 2;

        pendingAi = {
          bonus: bonus,
          category: match.category,
          confidence: match.confidence,
          rawLabel: match.rawLabel,
          photoHash: hash
        };

        var pct = Math.round(match.confidence * 100);
        setAiStatus(
          "match",
          match.emoji + " Det ligner " + match.label,
          "Test-AI: " + pct + "% på bedste naturmatch. " +
          (duplicate ? "Det samme foto er allerede gemt, så ingen ekstra testpoint." : "Du kan gemme det som testfund for +2 point.")
        );

        if (bonus > 0) saveAiFindingBtn.classList.remove("hidden");
        else saveAiFindingBtn.classList.add("hidden");
      })
      .catch(function () {
        pendingAi = null;
        setAiStatus(
          "no-match",
          "📵 Test-AI'en kunne ikke starte",
          "Tjek internetforbindelsen og prøv igen. Du kan stadig gemme arten manuelt."
        );
        saveAiFindingBtn.classList.add("hidden");
      });
  }

  function findNatureMatch(predictions) {
    var groups = [
      { category: "butterfly", label: "en sommerfugl eller natsværmer", emoji: "🦋", words: ["butterfly", "monarch", "sulphur", "sulfur", "ringlet", "lycaenid", "moth"] },
      { category: "ladybird", label: "en mariehøne", emoji: "🐞", words: ["ladybug", "ladybird", "lady beetle"] },
      { category: "bird", label: "en fugl", emoji: "🐦", words: ["bird", "finch", "sparrow", "robin", "blackbird", "thrush", "jay", "magpie", "crow", "raven", "warbler", "wren", "titmouse", "chickadee", "kite", "eagle", "hawk", "owl", "duck", "goose", "swan", "gull", "tern", "woodpecker"] },
      { category: "mushroom", label: "en svamp", emoji: "🍄", words: ["mushroom", "agaric", "bolete", "stinkhorn", "earthstar", "hen-of-the-woods"] },
      { category: "flower", label: "en blomst eller plante", emoji: "🌼", words: ["flower", "daisy", "sunflower", "rapeseed", "corn", "artichoke", "buckeye", "hip", "acorn", "tree", "leaf", "cabbage", "broccoli"] },
      { category: "squirrel", label: "et egern", emoji: "🐿️", words: ["squirrel"] },
      { category: "deer", label: "et hjortedyr", emoji: "🦌", words: ["deer", "gazelle", "impala", "hart"] },
      { category: "insect", label: "et insekt", emoji: "🐛", words: ["bee", "ant", "beetle", "dragonfly", "damselfly", "grasshopper", "cricket", "mantis", "walking stick", "fly", "weevil", "cicada"] },
      { category: "frog", label: "en frø eller tudse", emoji: "🐸", words: ["frog", "tree frog", "bullfrog", "toad"] },
      { category: "snail", label: "en snegl", emoji: "🐌", words: ["snail", "slug"] }
    ];

    var best = null;

    predictions.forEach(function (prediction) {
      var raw = String(prediction.className || "").toLowerCase();
      groups.forEach(function (group) {
        var hit = group.words.some(function (word) { return raw.indexOf(word) !== -1; });
        if (!hit) return;
        if (!best || prediction.probability > best.confidence) {
          best = {
            category: group.category,
            label: group.label,
            emoji: group.emoji,
            confidence: Number(prediction.probability || 0),
            rawLabel: prediction.className
          };
        }
      });
    });

    if (!best || best.confidence < 0.06) return null;
    return best;
  }

  function setAiStatus(kind, title, text) {
    aiStatus.className = "ai-status " + kind;
    aiStatus.innerHTML = "<strong>" + escapeHtml(title) + "</strong><span>" + escapeHtml(text) + "</span>";
  }

  function saveBroadAiFinding() {
    var hash = pendingAi.photoHash || simpleHash(pendingPhoto);
    var duplicate = state.findings.some(function (finding) { return finding.photoHash === hash; });
    var gained = duplicate ? 0 : 2;

    state.points += gained;
    state.findings.unshift({
      id: Date.now(),
      speciesId: "unknown",
      at: new Date().toISOString(),
      photo: pendingPhoto,
      photoHash: hash,
      aiCategory: pendingAi.category,
      aiLabel: pendingAi.rawLabel || "",
      testOnly: true
    });

    if (state.findings.length > 25) state.findings = state.findings.slice(0, 25);

    saveState();
    renderAll();

    findingResult.innerHTML =
      "<h2>" + (pendingAi.emoji || "🔎") + " AI-testfund gemt</h2>" +
      "<p><strong>" + (gained ? "+" + gained + " point." : "0 point — det samme foto var allerede gemt.") + "</strong></p>" +
      "<p>AI'en har kun genkendt en bred naturtype. Arten er endnu ikke valideret.</p>";

    finishPhotoFlow();
  }

  function recordFinding(id, photo, aiBonus) {
    var item = findSpecies(id);
    if (!item) return;

    var alreadyFound = state.findings.some(function (finding) { return finding.speciesId === id; });
    var hash = simpleHash(photo);
    var duplicate = state.findings.some(function (finding) { return finding.photoHash === hash; });
    var bonus = duplicate ? 0 : Number(aiBonus || 0);
    var speciesPoints = id === "unknown" ? 0 : (alreadyFound ? 1 : item.points);
    var gained = speciesPoints + bonus;

    state.points += gained;
    state.findings.unshift({
      id: Date.now(),
      speciesId: id,
      at: new Date().toISOString(),
      photo: photo,
      photoHash: hash,
      aiCategory: pendingAi ? pendingAi.category : "",
      testOnly: false
    });

    if (state.findings.length > 25) state.findings = state.findings.slice(0, 25);

    saveState();
    renderAll();

    var parts = [];
    if (speciesPoints) parts.push(speciesPoints + " artspoint");
    if (bonus) parts.push(bonus + " AI-testpoint");

    findingResult.innerHTML =
      "<h2>" + item.emoji + " " + escapeHtml(item.name) + "</h2>" +
      "<p><strong>" + (alreadyFound ? "Fundet igen!" : "Nyt fund!") + "</strong> " +
      (gained ? "+" + gained + " point" + (parts.length ? " (" + parts.join(" + ") + ")" : "") + "." : "Ingen point endnu.") + "</p>" +
      "<p>" + escapeHtml(item.fact) + "</p>" +
      (item.safety ? "<p class='warning'>⚠️ " + escapeHtml(item.safety) + "</p>" : "");

    finishPhotoFlow();
  }

  function finishPhotoFlow() {
    findingResult.classList.remove("hidden");
    speciesSelect.value = "";
    photoInput.value = "";
    pendingPhoto = "";
    pendingAi = null;
    saveAiFindingBtn.classList.add("hidden");
    photoStage.classList.add("hidden");
    findingResult.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function renderAll() {
    pointsEl.textContent = state.points;
    renderCollection();
    renderDuelOptions();
    renderLeaderboard();
  }

  function renderCollection() {
    var uniqueIds = [];
    state.findings.forEach(function (finding) {
      if (uniqueIds.indexOf(finding.speciesId) === -1) uniqueIds.push(finding.speciesId);
    });

    uniqueCountEl.textContent = uniqueIds.filter(function (id) { return id !== "unknown"; }).length;

    if (!state.findings.length) {
      collectionGrid.innerHTML = "<p class='muted'>Din samling er tom. Tag det første billede under Jagt.</p>";
      return;
    }

    var cards = [];
    var seen = {};

    state.findings.forEach(function (finding) {
      if (finding.speciesId === "unknown" && finding.testOnly) {
        cards.push(
          "<article class='species-card'>" +
          (finding.photo ? "<img src='" + finding.photo + "' alt='' style='width:100%;height:105px;object-fit:cover;border-radius:12px'>" : "<div class='species-emoji'>🔎</div>") +
          "<h3>AI-testfund</h3>" +
          "<div class='latin'>" + escapeHtml(finding.aiCategory || "ukendt naturtype") + "</div>" +
          "<span class='rarity'>Afventer art</span>" +
          "<p class='fact'>Billedet fik kun en bred lokal AI-genkendelse. Det tæller ikke som en valideret art.</p>" +
          "</article>"
        );
        return;
      }

      if (seen[finding.speciesId]) return;
      seen[finding.speciesId] = true;

      var item = findSpecies(finding.speciesId);
      if (!item) return;

      cards.push(
        "<article class='species-card'>" +
        (finding.photo ? "<img src='" + finding.photo + "' alt='' style='width:100%;height:105px;object-fit:cover;border-radius:12px'>" : "<div class='species-emoji'>" + item.emoji + "</div>") +
        "<h3>" + escapeHtml(item.name) + "</h3>" +
        "<div class='latin'>" + escapeHtml(item.latin) + "</div>" +
        "<span class='rarity'>" + escapeHtml(item.rarity) + (item.points ? " · " + item.points + " pt" : "") + "</span>" +
        "<p class='fact'>" + escapeHtml(item.fact) + "</p>" +
        (item.safety ? "<p class='warning'>⚠️ " + escapeHtml(item.safety) + "</p>" : "") +
        "</article>"
      );
    });

    collectionGrid.innerHTML = cards.join("");
  }

  function renderDuelOptions() {
    var ids = [];
    state.findings.forEach(function (finding) {
      if (finding.speciesId !== "unknown" && ids.indexOf(finding.speciesId) === -1) ids.push(finding.speciesId);
    });

    [duelA, duelB].forEach(function (select) {
      var current = select.value;
      select.innerHTML = "";
      ids.forEach(function (id) {
        var item = findSpecies(id);
        var option = document.createElement("option");
        option.value = id;
        option.textContent = item.emoji + " " + item.name;
        select.appendChild(option);
      });
      if (ids.indexOf(current) !== -1) select.value = current;
    });

    if (ids.length > 1 && duelA.value === duelB.value) duelB.selectedIndex = 1;
    duelBtn.disabled = ids.length < 2;

    if (ids.length < 2) {
      duelArena.className = "duel-arena empty";
      duelArena.innerHTML = "<p>Find mindst to arter for at låse en duel op.</p>";
    }
  }

  function wireDuel() {
    duelBtn.addEventListener("click", function () {
      var a = findSpecies(duelA.value);
      var b = findSpecies(duelB.value);
      if (!a || !b || a.id === b.id) return;

      var categories = [
        { key: "forsvar", label: "Forsvar" },
        { key: "bevaegelse", label: "Bevægelse" },
        { key: "tilpasning", label: "Tilpasning" },
        { key: "skjul", label: "Camouflage / skjul" }
      ];

      var category = categories[Math.floor(Math.random() * categories.length)];
      var scoreA = a.stats[category.key];
      var scoreB = b.stats[category.key];
      var winner = scoreA === scoreB ? null : (scoreA > scoreB ? a : b);

      duelArena.className = "duel-arena";
      duelArena.innerHTML =
        "<div class='fighters'>" +
          fighterHtml(a, winner && winner.id === a.id) +
          "<div class='vs'>VS</div>" +
          fighterHtml(b, winner && winner.id === b.id) +
        "</div>" +
        "<div class='duel-result'>" +
          "<span>Runden handler om <strong>" + category.label + "</strong></span>" +
          "<p>" + escapeHtml(a.name) + ": " + scoreA + "/5 · " + escapeHtml(b.name) + ": " + scoreB + "/5</p>" +
          "<strong>" + (winner ? winner.emoji + " " + escapeHtml(winner.name) + " vinder runden!" : "🤝 Uafgjort!") + "</strong>" +
          "<p class='muted'>Demo-egenskaber skal fagligt valideres før en rigtig udgave.</p>" +
        "</div>";
    });
  }

  function fighterHtml(item, isWinner) {
    return "<div class='fighter" + (isWinner ? " winner" : "") + "'>" +
      "<div class='big'>" + item.emoji + "</div>" +
      "<strong>" + escapeHtml(item.name) + "</strong>" +
      "<p class='muted'>" + escapeHtml(item.fact) + "</p>" +
    "</div>";
  }

  function renderLeaderboard() {
    var demo = [
      { name: "Freja", points: 280, species: 16 },
      { name: "Noah", points: 245, species: 14 },
      { name: "Asta", points: 190, species: 12 },
      { name: "Dig", points: state.points, species: uniqueSpeciesCount(), you: true }
    ];

    demo.sort(function (a, b) { return b.points - a.points; });

    leaderboard.innerHTML = demo.map(function (person) {
      return "<li class='" + (person.you ? "you" : "") + "'>" +
        "<strong>" + escapeHtml(person.name) + "</strong>" +
        "<span>" + person.species + " arter</span>" +
        "<strong>" + person.points + " pt</strong>" +
      "</li>";
    }).join("");
  }

  function uniqueSpeciesCount() {
    var ids = [];
    state.findings.forEach(function (finding) {
      if (finding.speciesId !== "unknown" && ids.indexOf(finding.speciesId) === -1) ids.push(finding.speciesId);
    });
    return ids.length;
  }

  function wireReset() {
    document.getElementById("resetBtn").addEventListener("click", function () {
      if (!confirm("Nulstil alle lokale demo-fund på denne enhed?")) return;
      localStorage.removeItem("naturjagten-v0");
      state = { points: 0, findings: [] };
      renderAll();
      findingResult.classList.add("hidden");
      photoStage.classList.add("hidden");
    });
  }

  function findSpecies(id) {
    return species.find(function (item) { return item.id === id; });
  }

  function simpleHash(value) {
    var str = String(value || "");
    var hash = 2166136261;
    var step = Math.max(1, Math.floor(str.length / 2000));
    for (var i = 0; i < str.length; i += step) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return String(hash >>> 0);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}());
