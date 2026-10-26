// Peralihan halaman: tirai dalam warna livery pasukan antara index.html dan halaman pasukan.
// Dimuat dalam <head> (tanpa defer) supaya tirai sudah menutup skrin sebelum halaman baru dilukis.
//   Klik link dalaman  -> tirai naik dari bawah (0.45 s) -> pindah halaman
//   Halaman baru       -> tirai sama terbuka ke atas (0.45 s) -> animasi hero bermula
// sessionStorage "pt-in" memberitahu halaman baru tirai mana yang perlu dibuka.
(function () {
  var root = document.documentElement;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var CLOSE = 450, OPEN = 450, HOLD = 120; // jumlah tutup + buka = 1.02 s
  var KEY = "pt-in";

  var THEMES = {
    hb:   { crest: "crest-hb", box: "0 0 120 100", no: "#44", name: "HealthyBite Racing", bg: "linear-gradient(150deg, #ff2a1f, #8f0400)", fg: "#fff", edge: "repeating-linear-gradient(90deg, #fff 0 34px, transparent 34px 48px)" },
    gx:   { crest: "crest-gx", box: "0 0 100 100", no: "#12", name: "GX Works Motorsport", bg: "linear-gradient(150deg, #e6e8ec, #9aa0aa 60%, #00bfae)", fg: "#0b0b0d", edge: "#00bfae" },
    t3:   { crest: "crest-t3", box: "0 0 286 100", wide: true, no: "#3", name: "VitaTrack Racing", bg: "linear-gradient(150deg, #1d2638, #121826 70%)", fg: "#f4f4f5", edge: "linear-gradient(90deg, #2ecc71, #38bdf8, #f59e0b)", accent: "#4ade80" },
    crew: { logo: true, no: "KREW", name: "Shah · Haziq · Sasha", bg: "#0e0e10", fg: "#f3f1ec", edge: "linear-gradient(90deg, #ff2a1f, #00bfae, #2ecc71)", accent: "#e10600" },
    home: { logo: true, no: "GRID", name: "Garaj", bg: "#0e0e10", fg: "#f3f1ec", edge: "#e10600", accent: "#e10600" }
  };
  // Halaman tujuan -> tema tirai
  function themeFor(url) {
    var m = url.pathname.match(/(healthybite|gainix|vitatrack)(\.html)?$/);
    if (m) return { healthybite: "hb", gainix: "gx", vitatrack: "t3" }[m[1]];
    if (/about(\.html)?$/.test(url.pathname)) return "crew";
    if (/(\/|index(\.html)?)$/.test(url.pathname)) return "home";
    return null;
  }
  function samePath(a, b) {
    var n = function (p) { return p.replace(/index(\.html)?$/, "").replace(/\.html$/, ""); };
    return n(a.pathname) === n(b.pathname);
  }

  var css = document.createElement("style");
  css.textContent =
    "html.pt-cover::before{content:'';position:fixed;inset:0;z-index:399;background:var(--pt-bg,#0e0e10)}" +
    ".pt{position:fixed;inset:0;z-index:400;pointer-events:none;overflow:hidden}" +
    ".pt.active{pointer-events:auto}" +
    // Panel lebih tinggi dari skrin dan menyerong macam jalur livery
    ".pt-panel{position:absolute;left:-2vw;right:-2vw;top:-18vh;bottom:-18vh;transform:translateY(118%) skewY(-6deg);will-change:transform;display:grid;place-items:center}" +
    ".pt-panel::before{content:'';position:absolute;left:0;right:0;top:0;height:10px;background:var(--pt-edge)}" +
    ".pt.closing .pt-panel{transition:transform " + CLOSE + "ms cubic-bezier(.7,0,.25,1)}" +
    ".pt.opening .pt-panel{transition:transform " + OPEN + "ms cubic-bezier(.7,0,.25,1)}" +
    ".pt.shut .pt-panel{transform:translateY(0) skewY(-6deg)}" +
    ".pt.gone .pt-panel{transform:translateY(-118%) skewY(-6deg)}" +
    ".pt-inner{transform:skewY(6deg);display:grid;justify-items:center;gap:10px;text-align:center;padding:0 16px}" +
    ".pt-crest{width:clamp(110px,22vw,170px);height:auto;filter:drop-shadow(0 18px 24px rgba(0,0,0,.35))}" +
    ".pt-crest.wide{width:clamp(230px,44vw,400px)}" +
    ".pt-logo{width:clamp(96px,16vw,130px);height:auto}" +
    ".pt-no{margin:6px 0 0;font-family:'Barlow Condensed','Arial Narrow',Impact,sans-serif;font-style:italic;font-weight:900;font-size:clamp(56px,11vw,96px);line-height:.85;color:var(--pt-accent,currentColor)}" +
    ".pt-name{margin:0;font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-weight:700;font-size:12px;letter-spacing:.2em;text-transform:uppercase;opacity:.85}";
  document.head.appendChild(css);

  function paint(el, key) {
    var t = THEMES[key];
    el.style.setProperty("--pt-bg", t.bg); el.style.setProperty("--pt-edge", t.edge);
    if (t.accent) el.style.setProperty("--pt-accent", t.accent); else el.style.removeProperty("--pt-accent");
    return t;
  }
  var overlay = null;
  function build(key) {
    if (!overlay) {
      overlay = document.createElement("div"); overlay.className = "pt"; overlay.setAttribute("aria-hidden", "true");
      overlay.innerHTML = '<div class="pt-panel"><div class="pt-inner"></div></div>';
      document.body.appendChild(overlay);
    }
    var t = paint(overlay, key), panel = overlay.firstChild;
    panel.style.background = t.bg; panel.style.color = t.fg;
    overlay.querySelector(".pt-inner").innerHTML = (t.logo
      ? '<svg class="pt-logo" viewBox="0 0 46 32"><path d="M4 30 12 2h30l-8 28Z" fill="#e10600"/><text x="23" y="24" text-anchor="middle" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-style="italic" font-weight="900" font-size="22" fill="#fff">G</text></svg>'
      : '<svg class="pt-crest' + (t.wide ? ' wide' : '') + '" viewBox="' + t.box + '"><use href="#' + t.crest + '"/></svg>') +
      '<p class="pt-no">' + t.no + '</p><p class="pt-name">' + t.name + "</p>";
    return overlay;
  }

  // ---- Halaman baru: buka tirai ----
  var incoming = null;
  try {
    var raw = sessionStorage.getItem(KEY); sessionStorage.removeItem(KEY);
    if (raw) { var d = JSON.parse(raw); if (THEMES[d.k] && Date.now() - d.t < 8000) incoming = d.k; }
  } catch (e) {}
  var waiters = [];
  window.__ptPending = !!incoming && !reduce;
  // Kod halaman memanggil ptReady(fn) supaya animasi hero tunggu tirai terbuka
  window.ptReady = function (fn) { if (window.__ptPending) waiters.push(fn); else fn(); };
  function done() { window.__ptPending = false; var w = waiters; waiters = []; w.forEach(function (f) { f(); }); }

  if (window.__ptPending) {
    root.classList.add("pt-cover"); root.style.setProperty("--pt-bg", THEMES[incoming].bg);
    document.addEventListener("DOMContentLoaded", function () {
      var o = build(incoming);
      o.className = "pt active shut"; root.classList.remove("pt-cover");
      if (window.engineSound) window.engineSound.tail(incoming); // sambungan bunyi (jika pelayar benarkan)
      setTimeout(function () {
        o.className = "pt active opening gone";
        setTimeout(function () { o.className = "pt"; done(); }, OPEN);
      }, HOLD);
    });
  }

  // ---- Klik link dalaman: tutup tirai, kemudian pindah ----
  var leaving = false;
  document.addEventListener("click", function (e) {
    if (leaving || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || a.hasAttribute("download") || (a.target && a.target !== "_self")) return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return; // link luar
    if (samePath(url, location)) return;                                            // # dalam halaman sama
    var key = themeFor(url); if (!key) return;
    if (root.classList.contains("pl-on")) return; // preloader masih berjalan
    if (window.engineSound) window.engineSound.rev(key); // bunyi enjin (sound.js), ikut butang on/off
    if (reduce) return; // reduce motion: terus pindah tanpa tirai
    e.preventDefault(); leaving = true;
    try { sessionStorage.setItem(KEY, JSON.stringify({ k: key, t: Date.now() })); } catch (err) {}
    var o = build(key); o.className = "pt active";
    o.getBoundingClientRect(); // mula dari bawah sebelum bergerak
    o.className = "pt active closing shut";
    setTimeout(function () { location.href = url.href; }, CLOSE);
  });

  // ---- Butang Back/Forward: halaman dari bfcache jangan tersekat di belakang tirai ----
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    leaving = false;
    try { sessionStorage.removeItem(KEY); } catch (err) {}
    root.classList.remove("pt-cover");
    if (overlay && /shut/.test(overlay.className)) {
      overlay.className = "pt active opening gone";
      setTimeout(function () { overlay.className = "pt"; }, OPEN);
    }
    if (window.__ptPending) done();
  });
})();
