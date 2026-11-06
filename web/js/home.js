// The home screen's apps: a row of favourites, an "All apps" screen (also where favourites are chosen), and
// a Settings tile. Android gives the app list as window.AndroidTV; in a desktop browser a sample list stands in.
(function () {
  "use strict";
  const A = window.ATVU;
  if (!A.HOME) return;
  const { L, esc } = A;
  const H = L.home;
  const $ = id => document.getElementById(id);

  const bridge = window.AndroidTV || sampleBridge();
  const FAV_KEY = "atvu.favourites";
  // The household's picks from the TV's first setup, in that order (only the installed ones show).
  const DEFAULT_FAVS = ["ae.admedia.adtv", "com.internet.tvbrowser", "com.esaba.downloader", "com.gtv.player",
    "com.osn.go", "net.mbc.shahidTV", "com.yango.saft.tv"];

  let apps = [];          // [{ pkg, label, banner }]
  const icons = {};       // pkg -> data URL
  let dockIndex = 0;      // focused tile in the row
  let gridIndex = 0;      // focused tile in All apps (0 = the "choose favourites" tile)
  let editing = false;    // All apps: OK adds or removes a favourite instead of opening

  // ---------- data ----------
  function loadApps() {
    try { apps = JSON.parse(bridge.getApps()) || []; } catch (e) { apps = []; }
  }
  const installed = pkg => apps.some(a => a.pkg === pkg);
  function readFavs() {
    let list = null;
    try { list = JSON.parse(localStorage.getItem(FAV_KEY) || "null"); } catch (e) {}
    if (!Array.isArray(list)) list = DEFAULT_FAVS;
    list = list.filter(installed);
    return list.length ? list : apps.slice(0, 6).map(a => a.pkg);
  }
  function writeFavs(list) { try { localStorage.setItem(FAV_KEY, JSON.stringify(list)); } catch (e) {} }
  function icon(pkg) {
    if (!(pkg in icons)) { try { icons[pkg] = bridge.getIcon(pkg) || ""; } catch (e) { icons[pkg] = ""; } }
    return icons[pkg];
  }
  const app = pkg => apps.find(a => a.pkg === pkg);

  // ---------- tiles ----------
  function tile(pkg) {
    const a = app(pkg), src = icon(pkg);
    if (!a) return "";
    const img = src ? `<img src="${esc(src)}" alt="">` : `<span class="letter">${esc(a.label.slice(0, 1))}</span>`;
    return `<div class="tile ${a.banner ? "banner" : "icon"}" data-pkg="${esc(pkg)}" data-label="${esc(a.label)}">${img}` +
      (a.banner ? "" : `<span class="name">${esc(a.label)}</span>`) + `</div>`;
  }
  const special = (kind, label, glyph) =>
    `<div class="tile special" data-kind="${kind}" data-label="${esc(label)}"><span class="glyph">${glyph}</span><span class="name">${esc(label)}</span></div>`;

  // ---------- the row ----------
  // Arranging: the row shows only the favourites and a Done tile; OK picks a tile up or puts it down,
  // and left/right carry the picked-up tile along the row.
  let arranging = false, holding = false;
  function renderDock() {
    const favs = readFavs();
    $("dock").innerHTML = favs.map(tile).join("") + (arranging
      ? special("done", H.doneArranging, "✓")
      : special("all", H.allApps, "▦") + special("settings", H.settings, "⚙"));
    $("dock").classList.toggle("arranging", arranging);
    dockIndex = Math.min(dockIndex, $("dock").children.length - 1);
    focusDock();
  }
  function focusDock() {
    const tiles = [...$("dock").children];
    tiles.forEach((t, i) => {
      t.classList.toggle("focus", i === dockIndex);
      t.classList.toggle("held", arranging && holding && i === dockIndex);
    });
    const t = tiles[dockIndex];
    if (!t) return;
    t.scrollIntoView({ block: "nearest", inline: "nearest" });
    $("appTitle").textContent = arranging ? (holding ? H.arrangeMoving : H.arrangeHint) : (t.dataset.label || "");
  }
  function startArranging(pickUp) { arranging = true; holding = !!pickUp; renderDock(); }
  function stopArranging() { arranging = false; holding = false; renderDock(); }
  // Move the picked-up favourite one place; the tiles after the favourites (Done) never move.
  function moveHeld(by) {
    const favs = readFavs(), to = dockIndex + by;
    if (to < 0 || to >= favs.length) return;
    [favs[dockIndex], favs[to]] = [favs[to], favs[dockIndex]];
    writeFavs(favs);
    dockIndex = to;
    renderDock();
  }
  function openTile(t) {
    if (!t) return;
    if (t.dataset.kind === "all") return openAll();
    if (t.dataset.kind === "settings") return A.openSettings();
    if (t.dataset.kind === "edit") { editing = !editing; return renderAll(); }
    if (t.dataset.kind === "arrange") { closeAll(); dockIndex = 0; return startArranging(false); }
    bridge.launch(t.dataset.pkg);
  }

  // ---------- All apps ----------
  function openAll() { editing = false; gridIndex = 2; renderAll(); $("allApps").hidden = false; } // 2: the first app, after the two option tiles
  function closeAll() { $("allApps").hidden = true; editing = false; renderDock(); }
  function renderAll() {
    const favs = readFavs();
    $("allTitle").textContent = editing ? H.editingHint : H.allApps;
    $("allGrid").innerHTML = special("edit", editing ? H.doneEditing : H.chooseFavs, editing ? "✓" : "★") +
      special("arrange", H.arrange, "⇄") +
      apps.map(a => tile(a.pkg).replace('class="tile', `class="tile${favs.includes(a.pkg) ? " fav" : ""}`)).join("");
    $("allGrid").classList.toggle("editing", editing);
    gridIndex = Math.min(gridIndex, $("allGrid").children.length - 1);
    focusGrid();
  }
  function focusGrid() {
    const tiles = [...$("allGrid").children];
    tiles.forEach((t, i) => t.classList.toggle("focus", i === gridIndex));
    if (tiles[gridIndex]) tiles[gridIndex].scrollIntoView({ block: "nearest" });
  }
  function gridColumns() {
    const tiles = [...$("allGrid").children];
    if (tiles.length < 2) return 1;
    const top = tiles[0].offsetTop;
    const n = tiles.findIndex(t => t.offsetTop !== top);
    return n === -1 ? tiles.length : n;
  }
  function toggleFav(pkg) {
    const favs = readFavs();
    const i = favs.indexOf(pkg);
    if (i === -1) favs.push(pkg); else favs.splice(i, 1);
    writeFavs(favs);
    renderAll();
  }

  // ---------- the remote ----------
  // Left and right follow the screen, so in Arabic (right to left) "next" is to the left.
  const step = key => {
    const forward = A.AR ? "ArrowLeft" : "ArrowRight", backward = A.AR ? "ArrowRight" : "ArrowLeft";
    return key === forward ? 1 : key === backward ? -1 : 0;
  };
  document.addEventListener("keydown", e => {
    if (!$("settings").hidden || !$("adhanBar").hidden) return; // the settings panel and the adhan have their own keys
    const enter = e.key === "Enter" || e.keyCode === 23;
    if (!$("allApps").hidden) {
      const cols = gridColumns(), n = $("allGrid").children.length;
      if (step(e.key)) gridIndex = Math.max(0, Math.min(n - 1, gridIndex + step(e.key)));
      else if (e.key === "ArrowDown") gridIndex = Math.min(n - 1, gridIndex + cols);
      else if (e.key === "ArrowUp") gridIndex = Math.max(0, gridIndex - cols);
      else if (enter) {
        const t = $("allGrid").children[gridIndex];
        if (editing && t.dataset.pkg) toggleFav(t.dataset.pkg); else openTile(t);
      } else if (e.key === "Escape" || e.key === "Backspace") closeAll();
      else return;
      e.preventDefault();
      focusGrid();
      return;
    }
    const n = $("dock").children.length, t = $("dock").children[dockIndex];
    if (arranging) {
      if (step(e.key)) {
        if (holding) moveHeld(step(e.key));
        else { dockIndex = Math.max(0, Math.min(n - 1, dockIndex + step(e.key))); focusDock(); }
      } else if (enter && !e.repeat) {
        if (t && t.dataset.kind === "done") stopArranging();
        else if (t && t.dataset.pkg) { holding = !holding; focusDock(); }
      } else if (e.key === "Escape" || e.key === "Backspace") stopArranging();
      else if (!enter) return;
      e.preventDefault();
      return;
    }
    if (step(e.key)) { dockIndex = Math.max(0, Math.min(n - 1, dockIndex + step(e.key))); focusDock(); }
    else if (enter) {
      // OK opens on release; held down (the remote repeats the key) on an app, it starts arranging with that app.
      if (!e.repeat) pressed = true;
      else if (pressed && t && t.dataset.pkg) { pressed = false; startArranging(true); }
    } else return;
    e.preventDefault();
  });
  let pressed = false;
  document.addEventListener("keyup", e => {
    if (!(e.key === "Enter" || e.keyCode === 23) || !pressed) return;
    pressed = false;
    if ($("settings").hidden && $("allApps").hidden && !arranging) openTile($("dock").children[dockIndex]);
  });

  // Back from Android: close All apps first, then the settings panel (settings-ui's own back).
  const settingsBack = A.back;
  A.back = () => {
    if (arranging) { stopArranging(); return true; }
    if (!$("allApps").hidden) { closeAll(); return true; }
    return settingsBack ? settingsBack() : false;
  };

  window.ATVU_HOME = {
    refresh() { loadApps(); for (const k in icons) delete icons[k]; renderDock(); if (!$("allApps").hidden) renderAll(); },
    // From HomeActivity when OK is held on the TV remote (the page itself doesn't see the repeats there).
    longPress() {
      const t = $("dock").children[dockIndex];
      pressed = false;
      if ($("settings").hidden && $("allApps").hidden && !arranging && t && t.dataset.pkg) startArranging(true);
    },
    reset() {
      if (!$("settings").hidden) A.back();
      $("allApps").hidden = true; editing = false; arranging = false; holding = false; dockIndex = 0; renderDock();
    },
    focusDock
  };

  // ---------- a stand-in for the desktop browser ----------
  function sampleBridge() {
    const list = [
      ["ae.admedia.adtv", "ADtv"], ["com.internet.tvbrowser", "BROWSER"], ["com.esaba.downloader", "Downloader"],
      ["com.gtv.player", "GENRAL PRO"], ["com.osn.go", "OSN+"], ["net.mbc.shahidTV", "MBC Shahid"], ["com.yango.saft.tv", "Yango Play"],
      ["com.google.android.youtube.tv", "YouTube"], ["org.smarttube.stable", "SmartTube"], ["com.phlox.tvwebbrowser", "TV Bro"],
      ["com.android.vending", "Google Play Store"], ["com.spocky.projengmenu", "Projectivy Launcher"], ["com.android.tv.settings", "Settings"]
    ].map(([pkg, label]) => ({ pkg, label, banner: false }));
    return {
      getApps: () => JSON.stringify(list),
      getIcon: () => "",
      launch: pkg => { console.log("launch", pkg); return true; },
      openSystemSettings: () => true
    };
  }

  loadApps();
  renderDock();
})();
