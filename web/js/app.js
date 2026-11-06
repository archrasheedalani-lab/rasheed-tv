// Android TV update by Rasheed: the screensaver page.
// Settings come from localStorage ("atvu.settings"), then the URL hash (#lang=en&card=imam_ali) on top.
// The settings panel itself is in settings-ui.js.
(function () {
  "use strict";

  const DEFAULTS = {
    lang: "en", digits: "auto", clock24: false,
    // A built-in place, or a searched city (name, lat, lon, cityTz). tz, when set, overrides the city's zone.
    place: "sharjah", name: "", lat: null, lon: null, cityTz: "", tz: "",
    method: 0, hijriOffset: 0, card: "verse_hadith",
    // Which date is the big one: hijri_first, greg_first, hijri_only, greg_only, or alternate (swap every 10 s).
    dateMode: "hijri_first",
    show: "dates,weather,clock,card,prayer,countdowns,matches,caption",
    countdowns: "ramadan,mawlid,aliBirth",
    themes: "uae,cars,nature,player", photoMinutes: 30,
    // A colour theme, and the viewer's own colours on top of it ("" = the theme's).
    theme: "desert", accent: "", textColor: "", cardColor: "", scale: 1, dim: "medium",
    // The call to prayer: an audio file the viewer adds (see web/audio/README.md), played at the chosen prayers.
    adhan: false, adhanPrayers: "Fajr,Dhuhr,Asr,Maghrib,Isha", adhanVolume: 0.8, adhanFile: "audio/adhan.mp3",
    teams: null, onlyChecked: false
  };
  const THEMES = {
    desert:  { accent: "#D6AF6B", text: "#F6EFE0", muted: "#C6BBA4", card: "#04120C", glow: "#3b3a2e" },
    emerald: { accent: "#5FC9A0", text: "#EEF7F1", muted: "#A9C4B6", card: "#03140D", glow: "#1d3a2c" },
    night:   { accent: "#7FB8F0", text: "#EEF3FA", muted: "#A8B6C8", card: "#060B16", glow: "#1c2a44" },
    rose:    { accent: "#E59A9A", text: "#FAF0EE", muted: "#CDB3B0", card: "#160808", glow: "#3d2222" },
    royal:   { accent: "#B79CF0", text: "#F3EFFA", muted: "#B9AECB", card: "#0D0818", glow: "#2c2244" },
    mono:    { accent: "#F2F2F2", text: "#FFFFFF", muted: "#BBBBBB", card: "#000000", glow: "#2a2a2a" }
  };
  const DIMS = { light: .55, medium: 1, strong: 1.5 };
  const STORE = "atvu.settings";
  const $ = id => document.getElementById(id);

  // ---------- settings ----------
  function readStored() { try { return JSON.parse(localStorage.getItem(STORE) || "{}"); } catch (e) { return {}; } }
  function loadSettings() {
    const s = Object.assign({}, DEFAULTS, readStored());
    new URLSearchParams(location.hash.slice(1)).forEach((v, k) => { if (k in DEFAULTS && k !== "teams") s[k] = v; });
    s.method = +s.method; s.hijriOffset = +s.hijriOffset; s.photoMinutes = +s.photoMinutes || 30; s.scale = +s.scale || 1;
    s.clock24 = s.clock24 === true || s.clock24 === "1" || s.clock24 === "true";
    s.onlyChecked = s.onlyChecked === true || s.onlyChecked === "1";
    s.adhan = s.adhan === true || s.adhan === "1" || s.adhan === "true";
    s.adhanVolume = Math.min(1, Math.max(0, +s.adhanVolume || 0));
    const hex = v => /^#[0-9a-f]{6}$/i.test(v || "") ? v : "";
    s.accent = hex(s.accent); s.textColor = hex(s.textColor); s.cardColor = hex(s.cardColor);
    const p = PLACES[s.place] || PLACES.sharjah;
    const custom = s.name && s.lat !== null && s.lat !== "" && s.lon !== null && s.lon !== "";
    s.city = custom
      ? { ar: s.name, en: s.name, lat: +s.lat, lon: +s.lon, tz: s.tz || s.cityTz || p.tz }
      : { ar: p.ar, en: p.en, lat: p.lat, lon: p.lon, tz: s.tz || p.tz };
    try { new Intl.DateTimeFormat("en", { timeZone: s.city.tz }); } catch (e) { s.city.tz = p.tz; }
    if (!Array.isArray(s.teams)) s.teams = DEFAULT_TEAMS;
    return s;
  }
  function saveSettings(patch) {
    try { localStorage.setItem(STORE, JSON.stringify(Object.assign(readStored(), patch))); } catch (e) {}
  }
  function resetSettings() { try { localStorage.removeItem(STORE); } catch (e) {} }

  const S = loadSettings();
  const L = I18N[S.lang] || I18N.en;
  const AR = S.lang === "ar";
  const useArabDigits = S.digits === "arab" || (S.digits === "auto" && AR);
  const shown = new Set(S.show.split(",").map(x => x.trim()));
  document.documentElement.lang = S.lang;
  document.documentElement.dir = AR ? "rtl" : "ltr";
  // ?mode=home: the home screen (home.js adds the apps row); otherwise the screensaver.
  const HOME = new URLSearchParams(location.search).get("mode") === "home";
  document.documentElement.classList.toggle("home", HOME);

  // Look: theme colours (with the viewer's own on top), text size, background dimming, and what is on screen.
  const root = document.documentElement.style;
  const theme = THEMES[S.theme] || THEMES.desert;
  const accent = S.accent || theme.accent, text = S.textColor || theme.text, card = S.cardColor || theme.card;
  root.setProperty("--gold", accent);
  root.setProperty("--gold-dim", accent + "73");
  root.setProperty("--sand", text);
  root.setProperty("--muted", S.textColor ? text + "B3" : theme.muted);
  root.setProperty("--ink", theme.card);
  root.setProperty("--glow", theme.glow);
  root.setProperty("--card-bg", card + "80");
  root.setProperty("--panel-bg", card + "F7");
  root.setProperty("--control-bg", accent + "1F");
  root.setProperty("--scale", S.scale);
  root.setProperty("--dim", DIMS[S.dim] || 1);
  const PARTS = { dates: ".dates", weather: ".weather", clock: ".clockbox", card: "#card", prayer: "#prayerPanel",
    countdowns: "#occList", matches: "#matchPanel", caption: "#caption" };
  Object.entries(PARTS).forEach(([k, sel]) => { if (!shown.has(k)) document.querySelector(sel).classList.add("off"); });

  // ---------- small helpers ----------
  const t = (key, vars) => (L[key] || key).replace(/\{(\w+)\}/g, (_, k) => vars[k]);
  const num = x => useArabDigits ? String(x).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]).replace(/\./g, "٫") : String(x);
  const pick = obj => obj ? (obj[S.lang] || obj.en || obj.ar) : "";
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const locale = AR ? "ar-u-nu-latn" : "en-GB";

  function cache(key, value) {
    try {
      if (value === undefined) return JSON.parse(localStorage.getItem("atvu." + key) || "null");
      localStorage.setItem("atvu." + key, JSON.stringify(value));
    } catch (e) { return null; }
  }
  async function getJSON(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(r.status + " " + url);
    return r.json();
  }

  // The wall clock of the chosen city, whatever the device's own zone is.
  function cityNow() {
    const parts = {};
    new Intl.DateTimeFormat("en-GB", {
      timeZone: S.city.tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    }).formatToParts(new Date()).forEach(p => parts[p.type] = p.value);
    return { y: +parts.year, mo: +parts.month, d: +parts.day, h: +parts.hour, mi: +parts.minute, s: +parts.second,
      key: `${parts.year}-${parts.month}-${parts.day}` };
  }
  const dayIndex = () => { const n = cityNow(); return Math.floor(Date.UTC(n.y, n.mo - 1, n.d) / 864e5); };

  // Counted nouns: Arabic grammar (١ ساعة، ساعتين، ٣ ساعات، ١١ ساعة); English plurals.
  function count(n, unit) {
    if (!AR) return `${n} ${unit}${n === 1 ? "" : "s"}`;
    const f = { hour: ["ساعة", "ساعتين", "ساعات"], minute: ["دقيقة", "دقيقتين", "دقائق"], day: ["يوم", "يومين", "أيام"] }[unit];
    if (n === 1) return f[0];
    if (n === 2) return f[1];
    if (n >= 3 && n <= 10) return `${num(n)} ${f[2]}`;
    return `${num(n)} ${f[0]}`;
  }
  function duration(mins) {
    mins = Math.max(0, Math.round(mins));
    if (mins >= 1440) { // a day or more: days and hours
      const d = Math.floor(mins / 1440), h = Math.floor(mins % 1440 / 60);
      if (!h) return count(d, "day");
      return AR ? `${count(d, "day")} و ${count(h, "hour")}` : `${count(d, "day")} ${count(h, "hour")}`;
    }
    const h = Math.floor(mins / 60), m = mins % 60;
    if (!h) return count(m, "minute");
    if (!m) return count(h, "hour");
    return AR ? `${count(h, "hour")} و ${count(m, "minute")}` : `${count(h, "hour")} ${count(m, "minute")}`;
  }
  // A time of day as text, in 12 or 24 hours.
  function clockText(h, m) {
    const mm = num(String(m).padStart(2, "0"));
    if (S.clock24) return { text: `${num(String(h).padStart(2, "0"))}:${mm}`, ap: "" };
    return { text: `${num(h % 12 || 12)}:${mm}`, ap: h < 12 ? L.am : L.pm };
  }
  const timeLabel = c => c.ap ? `${c.text} ${c.ap}` : c.text;

  // ---------- clock and dates ----------
  function renderClock() {
    const n = cityNow(), c = clockText(n.h, n.mi);
    const [hh, mm] = c.text.split(":");
    $("time").innerHTML = `${hh}<span class="colon">:</span>${mm}`;
    $("ampm").textContent = c.ap;
    $("tzline").textContent = t("tzline", { city: pick(S.city) });
  }
  function hijriParts(date) {
    const shifted = new Date(date.getTime() + S.hijriOffset * 864e5);
    const o = {};
    new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { timeZone: S.city.tz, day: "numeric", month: "numeric", year: "numeric" })
      .formatToParts(shifted).forEach(p => o[p.type] = p.value);
    return { d: +o.day, m: +o.month, y: parseInt(o.year, 10) };
  }
  // Month names are our own: Android TV's WebView knows the Hijri numbers but not the month names.
  const HIJRI_MONTHS = {
    ar: ["محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"],
    en: ["Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani", "Jumada al-Ula", "Jumada al-Akhirah", "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhu al-Qadah", "Dhu al-Hijjah"]
  };
  const dates = { hijri: "", greg: "" };
  function renderDates() {
    const now = new Date();
    const h = hijriParts(now);
    const weekday = new Intl.DateTimeFormat(locale, { timeZone: S.city.tz, weekday: "long" }).format(now);
    const month = HIJRI_MONTHS[AR ? "ar" : "en"][h.m - 1];
    dates.hijri = num(AR ? `${weekday}، ${h.d} ${month} ${h.y} هـ` : `${weekday}, ${h.d} ${month} ${h.y} AH`);
    dates.greg = num(new Intl.DateTimeFormat(locale, { timeZone: S.city.tz, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now));
    showDates();
  }
  // The big line and the small line, by the "Date" setting.
  function showDates() {
    let mode = S.dateMode;
    if (mode === "alternate") mode = Math.floor(Date.now() / 10000) % 2 ? "greg_first" : "hijri_first";
    const [big, small] = {
      hijri_first: [dates.hijri, dates.greg], greg_first: [dates.greg, dates.hijri],
      hijri_only: [dates.hijri, ""], greg_only: [dates.greg, ""]
    }[mode] || [dates.hijri, dates.greg];
    if ($("hijri").textContent !== big) $("hijri").textContent = big;
    if ($("greg").textContent !== small) $("greg").textContent = small;
  }

  // Countdowns, side by side: walk forward day by day on the Hijri calendar to each one's next date.
  // [key, Hijri month, Hijri day]; the Prophet's birthday on 17 Rabi al-Awwal.
  const OCCASIONS = [
    ["ramadan", 9, 1], ["mawlid", 3, 17], ["aliBirth", 7, 13], ["fitr", 10, 1], ["adha", 12, 10], ["ghadir", 12, 18],
    ["newYear", 1, 1], ["ashura", 1, 10], ["mabath", 7, 27], ["shaban", 8, 15]
  ];
  function renderOccasion() {
    const wanted = S.countdowns.split(",").map(x => x.trim());
    const list = OCCASIONS.filter(([k]) => wanted.includes(k)).slice(0, 4);
    const start = Date.now(), found = {};
    for (let i = 0; i < 400 && Object.keys(found).length < list.length; i++) {
      const h = hijriParts(new Date(start + i * 864e5));
      list.forEach(([k, m, d]) => { if (!(k in found) && h.m === m && h.d === d) found[k] = i; });
    }
    const box = $("occList");
    box.style.gridTemplateColumns = `repeat(${Math.max(1, list.length)}, 1fr)`;
    box.innerHTML = list.filter(([k]) => k in found).map(([k]) => {
      const i = found[k];
      const when = num(new Intl.DateTimeFormat(locale, { timeZone: S.city.tz, day: "numeric", month: "short" }).format(new Date(start + i * 864e5)));
      const value = i === 0 ? esc(L.today)
        : `${num(i)}<span class="unit">${AR ? (i >= 3 && i <= 10 ? "أيام" : "يوم") : (i === 1 ? "day" : "days")}</span>`;
      return `<div class="cd"><div class="label">${esc(L.occ[k])}</div><div class="value">${value}</div><div class="sub">${esc(when)}</div></div>`;
    }).join("");
  }

  // ---------- prayer times ----------
  const PRAYERS = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
  let prayerTimes = null;
  async function loadPrayers() {
    const n = cityNow();
    const key = `prayers.${n.key}.${S.city.lat}.${S.city.lon}.${S.method}.${S.city.tz}`;
    prayerTimes = cache(key);
    if (prayerTimes) return;
    const date = `${String(n.d).padStart(2, "0")}-${String(n.mo).padStart(2, "0")}-${n.y}`;
    try {
      const j = await getJSON(`https://api.aladhan.com/v1/timings/${date}?latitude=${S.city.lat}&longitude=${S.city.lon}&method=${S.method}&timezonestring=${encodeURIComponent(S.city.tz)}`);
      prayerTimes = {};
      PRAYERS.forEach(p => prayerTimes[p] = j.data.timings[p].slice(0, 5));
      cache(key, prayerTimes);
    } catch (e) { console.warn("prayers", e); }
  }
  const toMin = hhmm => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
  function nextPrayer() {
    if (!prayerTimes) return null;
    const n = cityNow(), nowMin = n.h * 60 + n.mi + n.s / 60;
    for (const p of PRAYERS) {
      if (p === "Sunrise") continue;
      const m = toMin(prayerTimes[p]);
      if (m > nowMin) return { name: p, at: m, left: m - nowMin };
    }
    const m = toMin(prayerTimes.Fajr);
    return { name: "Fajr", at: m, left: m + 1440 - nowMin };
  }
  function renderPrayer() {
    $("prayerLabel").textContent = L.nextPrayer;
    const np = nextPrayer();
    if (!np) { $("prayerValue").textContent = L.loading; return; }
    $("prayerValue").textContent = `${L[np.name]} ${timeLabel(clockText(Math.floor(np.at / 60), np.at % 60))}`;
    $("prayerSub").textContent = np.left < 1 ? L.now : t("inTime", { t: duration(np.left) });
  }

  // ---------- weather ----------
  let weather = null;
  const wxText = code => {
    const keys = Object.keys(L.wx).map(Number).sort((a, b) => b - a);
    return L.wx[keys.find(k => code >= k)] || "";
  };
  async function loadWeather() {
    const key = `weather.${S.city.lat}.${S.city.lon}`;
    try {
      weather = await getJSON(`https://api.open-meteo.com/v1/forecast?latitude=${S.city.lat}&longitude=${S.city.lon}` +
        `&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=5&timezone=${encodeURIComponent(S.city.tz)}`);
      cache(key, weather);
    } catch (e) { weather = weather || cache(key); console.warn("weather", e); }
    renderWeather();
    if (S.card === "forecast") renderCard();
  }
  function renderWeather() {
    if (!weather) return;
    $("temp").textContent = num(Math.round(weather.current.temperature_2m)) + "°";
    $("cond").textContent = wxText(weather.current.weather_code);
    $("wxsub").textContent = `${pick(S.city)} · ${num(Math.round(weather.daily.temperature_2m_max[0]))}° / ${num(Math.round(weather.daily.temperature_2m_min[0]))}°`;
  }

  // ---------- matches ----------
  let matches = [];
  // Club names stay in English in both languages.
  const teamName = (id, fallback) => { const tm = S.teams.find(x => +x.id === +id); return tm ? tm.en : fallback; };
  const vsText = m => `${teamName(m.homeId, m.homeName)} vs ${teamName(m.awayId, m.awayName)}`;
  // TheSportsDB's free key is rate limited: reuse a fetch younger than 3 hours, space the requests out,
  // and on failure keep the old list and try again in 10 minutes.
  const restore = list => (list || []).map(m => Object.assign(m, { at: new Date(m.at) }));
  async function loadMatches(force) {
    const saved = cache("matches");
    const teamKey = S.teams.map(x => x.id).join(",");
    if (!S.teams.length) { matches = []; renderMatch(); return; }
    if (!force && saved && saved.teams === teamKey && Date.now() - saved.fetched < 3 * 3600e3) {
      matches = restore(saved.list); renderMatch(); return;
    }
    const all = [];
    let ok = 0;
    for (const tm of S.teams) {
      try {
        const j = await getJSON(`https://www.thesportsdb.com/api/v1/json/123/eventsnext.php?id=${tm.id}`);
        (j.events || []).forEach(e => all.push(e));
        ok++;
      } catch (e) { console.warn("matches", tm.id, e); }
      await new Promise(r => setTimeout(r, 1500));
    }
    const seen = new Set();
    matches = all
      .filter(e => e.strTimestamp && !seen.has(e.idEvent) && seen.add(e.idEvent))
      .map(e => ({
        at: new Date(e.strTimestamp.endsWith("Z") ? e.strTimestamp : e.strTimestamp + "Z"),
        homeId: e.idHomeTeam, homeName: e.strHomeTeam, awayId: e.idAwayTeam, awayName: e.strAwayTeam
      }))
      .filter(m => m.at.getTime() > Date.now() - 2 * 3600e3)
      .sort((a, b) => a.at - b.at);
    if (ok) cache("matches", { teams: teamKey, fetched: Date.now(), list: matches });
    else { matches = restore(saved && saved.list); setTimeout(() => loadMatches(true), 10 * 60000); }
    renderMatch();
    if (S.card === "matches") renderCard();
  }
  const fmtWhen = d => num(new Intl.DateTimeFormat(locale, { timeZone: S.city.tz, weekday: "short", day: "numeric", month: "short",
    hour: "numeric", minute: "2-digit", hour12: !S.clock24 }).format(d));
  function renderMatch() {
    $("matchLabel").textContent = L.matches;
    const week = matches.filter(m => m.at - Date.now() < 7 * 864e5 && m.at.getTime() > Date.now() - 2 * 3600e3);
    const v = $("matchValue");
    if (!week.length) { v.textContent = L.noMatches; v.classList.add("empty"); $("matchSub").textContent = ""; return; }
    const m = week[0], left = (m.at - Date.now()) / 60000;
    v.classList.remove("empty");
    v.innerHTML = `<bdi dir="ltr">${esc(vsText(m))}</bdi>`;
    $("matchSub").textContent = (left > 0 ? t("inTime", { t: duration(left) }) + " · " : "") + fmtWhen(m.at);
  }

  // ---------- the card ----------
  const usable = list => S.onlyChecked ? list.filter(x => x.checked) : list;
  async function verseOfDay() {
    const key = "verse." + cityNow().key;
    let v = cache(key);
    if (v) return v;
    const n = (dayIndex() * 2654435761 % 6236 + 6236) % 6236 + 1;
    const j = await getJSON(`https://api.alquran.cloud/v1/ayah/${n}/editions/quran-uthmani,en.sahih`);
    v = { ar: j.data[0].text, en: j.data[1].text, surahAr: j.data[0].surah.name, surahEn: j.data[0].surah.englishName, n: j.data[0].numberInSurah };
    cache(key, v);
    return v;
  }
  function textBlock(arText, enText, refHtml, noteHtml) {
    const main = AR ? arText : (enText || arText);
    const second = AR ? "" : (arText && enText ? arText : "");
    return `<div class="text fade">${esc(main)}</div>` +
      (second ? `<div class="trans fade" dir="rtl">${esc(second)}</div>` : "") +
      (noteHtml ? `<div class="note">${noteHtml}</div>` : "") +
      (refHtml ? `<div class="ref">${refHtml}</div>` : "");
  }
  function adhkarWindow() {
    if (!prayerTimes) return null;
    const n = cityNow(), now = n.h * 60 + n.mi;
    if (now >= toMin(prayerTimes.Fajr) && now < toMin(prayerTimes.Dhuhr)) return "morning";
    if (now >= toMin(prayerTimes.Asr) && now < toMin(prayerTimes.Maghrib)) return "evening";
    return null;
  }
  const slot = minutes => Math.floor(Date.now() / (minutes * 60000));

  async function renderCard() {
    const card = $("card");
    let kind = S.card;
    if (kind === "none" || !shown.has("card")) { card.hidden = true; return; }
    let title = "", body = "";
    try {
      if (kind === "adhkar") {
        const w = adhkarWindow();
        const list = usable(ADHKAR).filter(a => a.when === "both" || a.when === w);
        if (w && list.length) {
          const a = list[slot(1) % list.length];
          title = w === "morning" ? L.adhkarMorning : L.adhkarEvening;
          const note = [pick(a.note), a.count > 1 ? t("times", { n: num(a.count) }) : ""].filter(Boolean).join(" · ");
          body = textBlock(a.ar, a.en, esc(pick(a.ref)), esc(note));
        } else kind = "verse_hadith";
      }
      if (kind === "verse_hadith") {
        const hadith = usable(HADITH);
        if (dayIndex() % 2 === 0 || !hadith.length) {
          const v = await verseOfDay();
          title = L.verse;
          body = textBlock(v.ar, v.en, esc(AR ? `${v.surahAr} · ${num(v.n)}` : `${v.surahEn} ${v.n}`));
        } else {
          const h = hadith[dayIndex() % hadith.length];
          title = L.hadith;
          body = textBlock(h.ar, h.en, esc(`${pick(h.by)} · ${pick(h.ref)}`));
        }
      }
      if (kind === "imam_ali") {
        const list = usable(IMAM_ALI);
        const q = list[(dayIndex() * 7 + slot(20)) % list.length];
        title = L.imamAli;
        body = textBlock(q.ar, q.en, esc(pick(q.ref)));
      }
      if (kind === "prayers") {
        title = L.prayers;
        const np = nextPrayer(), n = cityNow(), now = n.h * 60 + n.mi;
        body = `<div class="rows">` + (prayerTimes ? PRAYERS.map(p => {
          const m = toMin(prayerTimes[p]);
          const cls = np && np.name === p ? "next" : (m < now ? "past" : "");
          return `<div class="row ${cls}"><span>${L[p]}</span><span>${timeLabel(clockText(Math.floor(m / 60), m % 60))}</span></div>`;
        }).join("") : "") + `</div>`;
      }
      if (kind === "forecast" && weather) {
        title = L.forecast;
        body = `<div class="rows">` + weather.daily.time.map((d, i) => {
          const day = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(new Date(d + "T12:00:00Z"));
          return `<div class="row"><span>${esc(day)}</span><span class="dim">${esc(wxText(weather.daily.weather_code[i]))}</span>` +
            `<span>${num(Math.round(weather.daily.temperature_2m_max[i]))}° / ${num(Math.round(weather.daily.temperature_2m_min[i]))}°</span></div>`;
        }).join("") + `</div>`;
      }
      if (kind === "matches") {
        title = L.matchesCard;
        body = `<div class="rows">` + (matches.slice(0, 5).map(m =>
          `<div class="row"><bdi dir="ltr">${esc(vsText(m))}</bdi><span class="dim">${esc(fmtWhen(m.at))}</span></div>`).join("")
          || `<div class="row dim">${esc(L.noMatches)}</div>`) + `</div>`;
      }
    } catch (e) { console.warn("card", e); }
    if (!body) { card.hidden = true; return; }
    $("cardTitle").textContent = title;
    if ($("cardBody").dataset.html !== body) { $("cardBody").innerHTML = body; $("cardBody").dataset.html = body; }
    card.hidden = false;
  }

  // ---------- background photos from Wikimedia Commons ----------
  const COMMONS = "https://commons.wikimedia.org/w/api.php?format=json&origin=*&";
  // Captions are wiki text anyone can edit: read them in an inert document, so nothing in them can run or load.
  const stripHtml = h => (new DOMParser().parseFromString(h || "", "text/html").body.textContent || "").replace(/\s+/g, " ").trim();
  async function categoryFiles(cat) {
    const key = "cat." + cat;
    const c = cache(key);
    if (c && Date.now() - c.at < 7 * 864e5 && c.files.length) return c.files;
    const j = await getJSON(COMMONS + new URLSearchParams({ action: "query", list: "categorymembers", cmtitle: cat, cmtype: "file", cmlimit: "200" }));
    const files = j.query.categorymembers.map(m => m.title).filter(f => /\.(jpe?g|png|webp)$/i.test(f));
    cache(key, { at: Date.now(), files });
    return files;
  }
  async function randomPhoto() {
    const themes = S.themes.split(",").map(x => x.trim()).filter(x => PHOTO_THEMES[x]);
    if (!themes.length) return null;
    for (let attempt = 0; attempt < 4; attempt++) {
      const theme = PHOTO_THEMES[themes[Math.floor(Math.random() * themes.length)]];
      const cat = theme.categories[Math.floor(Math.random() * theme.categories.length)];
      const files = await categoryFiles(cat).catch(() => []);
      if (!files.length) continue;
      const file = files[Math.floor(Math.random() * files.length)];
      const j = await getJSON(COMMONS + new URLSearchParams({
        action: "query", prop: "imageinfo", titles: file, iiprop: "url|extmetadata|size", iiurlwidth: "1920",
        iiextmetadatafilter: "ImageDescription|ObjectName|Artist|LicenseShortName", iiextmetadatalanguage: S.lang
      }));
      const page = Object.values(j.query.pages)[0];
      const info = page.imageinfo && page.imageinfo[0];
      if (!info || info.width < info.height) continue; // landscape only
      const md = info.extmetadata || {};
      let caption = stripHtml(md.ImageDescription && md.ImageDescription.value) || stripHtml(md.ObjectName && md.ObjectName.value);
      if (caption.length > 140) caption = caption.slice(0, 137) + "…";
      return {
        url: info.thumburl || info.url, caption, theme: pick(theme.name),
        artist: stripHtml(md.Artist && md.Artist.value).slice(0, 60), license: stripHtml(md.LicenseShortName && md.LicenseShortName.value)
      };
    }
    return null;
  }
  let front = $("bgA"), back = $("bgB");
  front.classList.add("fallback", "on"); // until the first photo has loaded
  async function nextPhoto() {
    let p = null;
    try { p = await randomPhoto(); } catch (e) { console.warn("photo", e); }
    if (!p) { front.classList.add("fallback", "on"); return; }
    const img = new Image();
    img.onload = () => {
      back.style.backgroundImage = `url("${p.url}")`;
      back.classList.remove("fallback");
      back.classList.add("on"); front.classList.remove("on");
      [front, back] = [back, front];
      const credit = [p.artist && `${L.photo}: <bdi>${esc(p.artist)}</bdi>`, p.license && `<bdi>${esc(p.license)}</bdi>`].filter(Boolean).join(" · ");
      $("caption").innerHTML = `<b><bdi>${esc(p.caption || p.theme)}</bdi></b>${credit ? " — " + credit : ""}`;
    };
    img.onerror = () => setTimeout(nextPhoto, 5000);
    img.src = p.url;
  }

  // ---------- the call to prayer ----------
  // Plays the viewer's adhan file at each chosen prayer, once a day each. OK or Back stops it.
  // Browsers only play sound after a first key press or click; the Android app allows it from the start.
  const adhanAudio = new Audio();
  adhanAudio.preload = "none";
  adhanAudio.addEventListener("ended", () => { $("adhanBar").hidden = true; if (window.ATVU.onAdhanEnd) window.ATVU.onAdhanEnd(); });
  // Remembered across reloads, so reopening the page during a prayer's minute doesn't play it twice.
  const adhanPlayed = new Set(cache("adhanPlayed") || []);
  const adhanLog = []; // what played and when, for checking from the console
  function playAdhan(prayer) {
    adhanLog.push(`${new Date().toISOString()} ${prayer || "test"}`);
    adhanAudio.src = S.adhanFile;
    adhanAudio.volume = S.adhanVolume;
    adhanAudio.currentTime = 0;
    $("adhanBar").textContent = prayer ? `${L.adhanNow} · ${L[prayer]}` : L.adhanNow;
    $("adhanBar").hidden = false;
    return adhanAudio.play().catch(e => { $("adhanBar").hidden = true; console.warn("adhan", e); throw e; });
  }
  function stopAdhan() { adhanAudio.pause(); $("adhanBar").hidden = true; }
  function checkAdhan() {
    if (!S.adhan || !prayerTimes) return;
    const n = cityNow(), wanted = S.adhanPrayers.split(",");
    for (const p of wanted) {
      if (!prayerTimes[p] || p === "Sunrise") continue;
      const key = `${n.key}.${p}`;
      if (toMin(prayerTimes[p]) === n.h * 60 + n.mi && !adhanPlayed.has(key)) {
        adhanPlayed.add(key);
        cache("adhanPlayed", [...adhanPlayed].filter(k => k.startsWith(n.key)));
        playAdhan(p).catch(() => {});
      }
    }
  }
  document.addEventListener("keydown", e => {
    if (!$("adhanBar").hidden && ["Enter", "Escape", "Backspace"].includes(e.key)) { e.stopImmediatePropagation(); e.preventDefault(); stopAdhan(); }
  }, true);

  // ---------- for settings-ui.js ----------
  window.ATVU = { S, L, AR, HOME, DEFAULTS, THEMES, OCCASIONS, PARTS, readStored, saveSettings, resetSettings, getJSON, pick, esc, playAdhan, stopAdhan, adhanLog };
  window.addEventListener("hashchange", () => location.reload()); // #lang=en typed in the address bar applies at once

  // ---------- start ----------
  function everySecond() { renderClock(); renderPrayer(); checkAdhan(); if (S.dateMode === "alternate") showDates(); }
  let lastDay = "";
  async function everyMinute() {
    const day = cityNow().key;
    if (day !== lastDay) { lastDay = day; renderDates(); renderOccasion(); await loadPrayers(); }
    renderMatch();
    renderCard();
  }
  everySecond();
  setInterval(everySecond, 1000);
  everyMinute();
  setInterval(everyMinute, 60000);
  loadWeather(); setInterval(loadWeather, 30 * 60000);
  loadMatches(); setInterval(() => loadMatches(true), 3 * 3600e3);
  setInterval(() => { prayerTimes = null; loadPrayers(); }, 6 * 3600e3);
  nextPhoto(); setInterval(nextPhoto, S.photoMinutes * 60000);
})();
