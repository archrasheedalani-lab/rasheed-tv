// The settings panel: OK on the remote, Enter or S opens it. Every option on the page has a control here.
(function () {
  "use strict";
  const { S, L, DEFAULTS, THEMES, OCCASIONS, PARTS, readStored, saveSettings, resetSettings, getJSON, pick, esc, playAdhan, stopAdhan } = window.ATVU;
  const PRAYER_KEYS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
  const U = L.ui;
  const form = document.getElementById("settings");
  const METHODS = [[0, "Jafari (Shia Ithna-Ashari)"], [16, "Dubai"], [4, "Umm al-Qura (Makkah)"], [8, "Gulf Region"], [9, "Kuwait"],
    [10, "Qatar"], [7, "Tehran (Institute of Geophysics)"], [3, "Muslim World League"], [5, "Egyptian General Authority"],
    [2, "ISNA (North America)"], [1, "Karachi"], [13, "Turkey (Diyanet)"], [15, "Moonsighting Committee"]];

  // What the panel is editing; written to storage only on Save.
  let draft;

  const opt = (value, label, selected) => `<option value="${esc(value)}"${selected ? " selected" : ""}>${esc(label)}</option>`;
  const select = (name, label, options, current) =>
    `<label><span>${esc(label)}</span><select name="${name}">${options.map(([v, l]) => opt(v, l, String(v) === String(current))).join("")}</select></label>`;
  const checks = (name, items, on) =>
    `<div class="checks">${items.map(([v, l]) => `<label><input type="checkbox" name="${name}" value="${esc(v)}"${on.includes(v) ? " checked" : ""}> ${esc(l)}</label>`).join("")}</div>`;

  function zoneOffset(z) {
    try {
      const p = new Intl.DateTimeFormat("en", { timeZone: z, timeZoneName: "shortOffset" }).formatToParts(new Date());
      return (p.find(x => x.type === "timeZoneName") || {}).value || "";
    } catch (e) { return ""; }
  }
  function zones() {
    try { return Intl.supportedValuesOf("timeZone"); } catch (e) {
      return ["Asia/Dubai", "Asia/Riyadh", "Asia/Kuwait", "Asia/Qatar", "Asia/Bahrain", "Asia/Muscat", "Asia/Baghdad", "Asia/Tehran",
        "Asia/Karachi", "Asia/Kolkata", "Europe/London", "Europe/Istanbul", "Africa/Cairo", "America/New_York", "UTC"];
    }
  }
  function cityLine() {
    const c = draft.name ? draft.name : pick(PLACES[draft.place] || PLACES.sharjah);
    const zone = draft.tz || draft.cityTz || (PLACES[draft.place] || PLACES.sharjah).tz;
    const time = new Intl.DateTimeFormat(S.lang === "ar" ? "ar-u-nu-latn" : "en-GB", { timeZone: zone, hour: "numeric", minute: "2-digit" }).format(new Date());
    return `${U.current}: <b>${esc(c)}</b> · ${esc(zone)} (${esc(zoneOffset(zone))}) · ${esc(time)}`;
  }

  function build() {
    const st = Object.assign({}, DEFAULTS, readStored());
    draft = { place: st.place, name: st.name || "", lat: st.lat, lon: st.lon, cityTz: st.cityTz || "", tz: st.tz || "",
      teams: (Array.isArray(st.teams) ? st.teams : DEFAULT_TEAMS).slice() };
    const show = String(st.show).split(","), cds = String(st.countdowns).split(","), themes = String(st.themes).split(",");

    form.innerHTML = `
      <h2>${esc(U.settings)}</h2>
      <section><h3>${esc(U.general)}</h3>
        ${select("lang", U.language, [["en", "English"], ["ar", "العربية"]], st.lang)}
        ${select("digits", U.digits, [["auto", U.auto], ["latn", "123"], ["arab", "١٢٣"]], st.digits)}
        ${select("clock24", U.clock, [["false", U.h12], ["true", U.h24]], String(st.clock24 === true || st.clock24 === "true"))}
        ${select("scale", U.scale, [["0.9", "90%"], ["1", "100%"], ["1.15", "115%"], ["1.3", "130%"]], st.scale)}
        ${select("dim", U.dim, [["light", U.dimLight], ["medium", U.dimMedium], ["strong", U.dimStrong]], st.dim)}
      </section>
      <section><h3>${esc(U.colours)}</h3>
        ${select("theme", U.theme, Object.keys(THEMES).map(k => [k, U.themes[k]]), st.theme)}
        <label><span>${esc(U.accent)}</span><input type="color" name="accent"></label>
        <label><span>${esc(U.textColor)}</span><input type="color" name="textColor"></label>
        <label><span>${esc(U.cardColor)}</span><input type="color" name="cardColor"></label>
        <label><span></span><button type="button" id="themeColoursBtn">${esc(U.useTheme)}</button></label>
      </section>
      <section><h3>${esc(U.adhan)}</h3>
        ${select("adhan", U.adhanOn, [["false", U.off], ["true", U.on]], String(st.adhan === true || st.adhan === "true"))}
        <div class="row2"><span>${esc(U.adhanPrayers)}</span>${checks("adhanPrayers", PRAYER_KEYS.map(k => [k, L[k]]), String(st.adhanPrayers).split(","))}</div>
        ${select("adhanVolume", U.adhanVolume, [0.2, 0.4, 0.6, 0.8, 1].map(v => [v, Math.round(v * 100) + "%"]), st.adhanVolume)}
        <label><span>${esc(U.adhanFile)}: <bdi dir="ltr">web/${esc(st.adhanFile)}</bdi></span>
          <button type="button" id="adhanTestBtn">${esc(U.adhanTest)}</button></label>
        <p class="dim" id="adhanMsg"></p>
      </section>
      <section><h3>${esc(U.location)}</h3>
        <p class="current" id="cityLine"></p>
        <label><span>${esc(U.quickPick)}</span><select name="place">
          ${draft.name ? opt("", U.customCity, true) : ""}
          ${Object.entries(PLACES).map(([k, p]) => opt(k, pick(p), !draft.name && k === draft.place)).join("")}
        </select></label>
        <label><span>${esc(U.search)}</span><span class="inline"><input type="text" name="citySearch" autocomplete="off">
          <button type="button" id="citySearchBtn">${esc(U.searchBtn)}</button></span></label>
        <div class="results" id="cityResults"></div>
        <label><span>${esc(U.timezone)}</span><select name="tz">
          ${opt("", U.tzAuto, !draft.tz)}
          ${zones().map(z => opt(z, `${z.replace(/_/g, " ")} (${zoneOffset(z)})`, z === draft.tz)).join("")}
        </select></label>
      </section>
      <section><h3>${esc(U.prayer)}</h3>
        ${select("method", U.method, METHODS, st.method)}
        ${select("dateMode", U.dateMode, Object.keys(U.dateModes).map(k => [k, U.dateModes[k]]), st.dateMode)}
        ${select("hijriOffset", U.hijriOffset, [-2, -1, 0, 1, 2].map(n => [n, (n > 0 ? "+" : "") + n]), st.hijriOffset)}
      </section>
      <section><h3>${esc(U.onScreen)}</h3>${checks("show", Object.keys(PARTS).map(k => [k, U.parts[k]]), show)}</section>
      <section><h3>${esc(U.card)}</h3>${select("card", U.card, Object.keys(U.cards).map(k => [k, U.cards[k]]), st.card)}</section>
      <section><h3>${esc(U.countdowns)}</h3>${checks("countdowns", OCCASIONS.map(([k]) => [k, L.occ[k]]), cds)}</section>
      <section><h3>${esc(U.teams)}</h3>
        <div class="results" id="teamList"></div>
        <label><span>${esc(U.teamSearch)}</span><span class="inline"><input type="text" name="teamSearch" autocomplete="off">
          <button type="button" id="teamSearchBtn">${esc(U.searchBtn)}</button></span></label>
        <div class="results" id="teamResults"></div>
      </section>
      <section><h3>${esc(U.photos)}</h3>
        ${checks("themes", Object.entries(PHOTO_THEMES).map(([k, th]) => [k, pick(th.name)]), themes)}
        ${select("photoMinutes", U.photoMinutes, [5, 10, 15, 30, 60].map(n => [n, n]), st.photoMinutes)}
      </section>
      <div class="buttons">
        <button type="submit">${esc(U.save)}</button>
        <button type="button" id="cancelBtn">${esc(U.cancel)}</button>
        <button type="button" id="resetBtn">${esc(U.reset)}</button>
      </div>`;

    document.getElementById("cityLine").innerHTML = cityLine();
    renderTeams();

    // Colour pickers start at the viewer's own colours, else the theme's; a new theme resets them.
    const hex = v => /^#[0-9a-f]{6}$/i.test(v || "") ? v : "";
    const setPickers = (th, own) => {
      form.elements.accent.value = hex(own.accent) || th.accent;
      form.elements.textColor.value = hex(own.textColor) || th.text;
      form.elements.cardColor.value = hex(own.cardColor) || th.card;
    };
    setPickers(THEMES[st.theme] || THEMES.desert, st);
    form.elements.theme.addEventListener("change", e => setPickers(THEMES[e.target.value], {}));
    document.getElementById("themeColoursBtn").addEventListener("click", () => setPickers(THEMES[form.elements.theme.value], {}));

    // Test button: plays the file at the chosen volume (this click also lets the browser play sound later).
    const testBtn = document.getElementById("adhanTestBtn"), msg = document.getElementById("adhanMsg");
    window.ATVU.onAdhanEnd = () => { testBtn.textContent = U.adhanTest; delete testBtn.dataset.playing; };
    testBtn.addEventListener("click", () => {
      if (testBtn.dataset.playing) { stopAdhan(); testBtn.textContent = U.adhanTest; delete testBtn.dataset.playing; return; }
      S.adhanVolume = +form.elements.adhanVolume.value;
      playAdhan("").then(() => { testBtn.textContent = U.adhanStop; testBtn.dataset.playing = "1"; msg.textContent = ""; })
        .catch(() => { msg.textContent = U.adhanMissing; });
    });
    form.elements.place.addEventListener("change", e => {
      if (!e.target.value) return;
      Object.assign(draft, { place: e.target.value, name: "", lat: null, lon: null, cityTz: "" });
      document.getElementById("cityLine").innerHTML = cityLine();
    });
    form.elements.tz.addEventListener("change", e => { draft.tz = e.target.value; document.getElementById("cityLine").innerHTML = cityLine(); });
    document.getElementById("citySearchBtn").addEventListener("click", searchCity);
    document.getElementById("teamSearchBtn").addEventListener("click", searchTeam);
    form.elements.citySearch.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); searchCity(); } });
    form.elements.teamSearch.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); searchTeam(); } });
    document.getElementById("cancelBtn").addEventListener("click", close);
    document.getElementById("resetBtn").addEventListener("click", () => {
      if (!confirm(U.resetAsk)) return;
      resetSettings(); location.hash = ""; location.reload();
    });
  }

  // ---------- city search (Open-Meteo geocoding: any city, with its time zone) ----------
  async function searchCity() {
    const q = form.elements.citySearch.value.trim();
    const box = document.getElementById("cityResults");
    if (!q) return;
    box.innerHTML = `<p class="dim">${esc(U.searching)}</p>`;
    try {
      const lang = /[؀-ۿ]/.test(q) ? "ar" : "en";
      const j = await getJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=${lang}&format=json`);
      const list = j.results || [];
      if (!list.length) { box.innerHTML = `<p class="dim">${esc(U.noResults)}</p>`; return; }
      box.innerHTML = list.map((r, i) =>
        `<button type="button" class="result" data-i="${i}">${esc(r.name)}<span class="dim">${esc([r.admin1, r.country].filter(Boolean).join(", "))} · ${esc(r.timezone)}</span></button>`).join("");
      box.querySelectorAll(".result").forEach(b => b.addEventListener("click", () => {
        const r = list[+b.dataset.i];
        Object.assign(draft, { name: r.name, lat: r.latitude, lon: r.longitude, cityTz: r.timezone });
        const place = form.elements.place;
        if (!place.querySelector('option[value=""]')) place.insertAdjacentHTML("afterbegin", opt("", U.customCity, true));
        place.value = "";
        box.innerHTML = "";
        document.getElementById("cityLine").innerHTML = cityLine();
        form.elements.tz.focus();
      }));
      box.querySelector(".result").focus();
    } catch (e) { box.innerHTML = `<p class="dim">${esc(U.noResults)}</p>`; }
  }

  // ---------- teams (TheSportsDB search) ----------
  function renderTeams() {
    const box = document.getElementById("teamList");
    box.innerHTML = draft.teams.length ? draft.teams.map((tm, i) =>
      `<div class="team"><span>${esc(tm.en)}</span><button type="button" data-i="${i}">${esc(U.remove)}</button></div>`).join("")
      : `<p class="dim">${esc(U.noTeams)}</p>`;
    box.querySelectorAll("button").forEach(b => b.addEventListener("click", () => { draft.teams.splice(+b.dataset.i, 1); renderTeams(); }));
  }
  async function searchTeam() {
    const q = form.elements.teamSearch.value.trim();
    const box = document.getElementById("teamResults");
    if (!q) return;
    box.innerHTML = `<p class="dim">${esc(U.searching)}</p>`;
    try {
      const j = await getJSON(`https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t=${encodeURIComponent(q)}`);
      const list = (j.teams || []).filter(x => x.strSport === "Soccer").slice(0, 8);
      if (!list.length) { box.innerHTML = `<p class="dim">${esc(U.noResults)}</p>`; return; }
      box.innerHTML = list.map((x, i) =>
        `<button type="button" class="result" data-i="${i}">${esc(x.strTeam)}<span class="dim">${esc(x.strLeague || "")} · ${esc(x.strCountry || "")}</span></button>`).join("");
      box.querySelectorAll(".result").forEach(b => b.addEventListener("click", () => {
        const x = list[+b.dataset.i];
        if (!draft.teams.some(tm => +tm.id === +x.idTeam)) draft.teams.push({ id: +x.idTeam, en: x.strTeam, ar: x.strTeam });
        box.innerHTML = "";
        renderTeams();
      }));
      box.querySelector(".result").focus();
    } catch (e) { box.innerHTML = `<p class="dim">${esc(U.noResults)}</p>`; }
  }

  // ---------- save ----------
  const sameAs = (v, themeValue) => v.toLowerCase() === themeValue.toLowerCase() ? "" : v;
  // OK on a TV remote is Enter. In a text box it must not save the form (the boxes run their search instead);
  // on a tick box it ticks, as a click would. Everywhere else OK keeps its normal job (open a list, press a button).
  form.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    const el = e.target;
    if (el.tagName === "INPUT" && el.type === "text") e.preventDefault();
    if (el.tagName === "INPUT" && el.type === "checkbox") { e.preventDefault(); el.click(); }
  });
  form.addEventListener("submit", e => {
    e.preventDefault();
    const f = form.elements, all = name => [...form.querySelectorAll(`input[name=${name}]:checked`)].map(x => x.value).join(",");
    saveSettings({
      lang: f.lang.value, digits: f.digits.value, clock24: f.clock24.value === "true", scale: +f.scale.value, dim: f.dim.value,
      // A colour equal to the theme's is stored as "" so it follows the theme if the theme changes later.
      theme: f.theme.value,
      accent: sameAs(f.accent.value, THEMES[f.theme.value].accent), textColor: sameAs(f.textColor.value, THEMES[f.theme.value].text),
      cardColor: sameAs(f.cardColor.value, THEMES[f.theme.value].card),
      adhan: f.adhan.value === "true", adhanPrayers: all("adhanPrayers"), adhanVolume: +f.adhanVolume.value,
      place: draft.place, name: draft.name, lat: draft.lat, lon: draft.lon, cityTz: draft.cityTz, tz: draft.tz,
      method: +f.method.value, hijriOffset: +f.hijriOffset.value, dateMode: f.dateMode.value,
      show: all("show"), card: f.card.value, countdowns: all("countdowns").split(",").slice(0, 4).join(","),
      teams: draft.teams, themes: all("themes"), photoMinutes: +f.photoMinutes.value
    });
    try { localStorage.removeItem("atvu.matches"); } catch (err) {}
    location.hash = "";
    location.reload();
  });

  function open() { build(); form.hidden = false; form.elements.lang.focus(); }
  function close() { stopAdhan(); form.hidden = true; if (window.ATVU_HOME) window.ATVU_HOME.focusDock(); }
  document.addEventListener("keydown", e => {
    if (!form.hidden) {
      if (e.key === "Escape" || (e.key === "Backspace" && e.target.tagName !== "INPUT")) { e.preventDefault(); close(); }
      return;
    }
    if (window.ATVU.HOME) return; // on the home screen OK opens apps; its Settings tile opens this panel
    if (e.key === "Enter" || e.key === "s" || e.key === "S" || e.keyCode === 23) { e.preventDefault(); open(); }
  });
  window.ATVU.openSettings = open;
  // For the Android app: Back closes the panel (true) or, if it was closed, leaves the app (false).
  window.ATVU.back = () => { if (!form.hidden) { close(); return true; } return false; };
  // The app's Settings icon opens the page with ?settings=1.
  if (new URLSearchParams(location.search).get("settings")) open();
})();
