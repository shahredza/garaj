// Bunyi enjin F1 untuk peralihan halaman, dijana dengan Web Audio API (tiada fail audio).
// Dimuat dalam <head> sebelum transition.js. transition.js memanggil:
//   engineSound.rev(pasukan)   semasa klik link (tirai menutup, ~0.45 s)
//   engineSound.tail(pasukan)  di halaman baru (tirai terbuka, ~0.55 s)
// Butang 🔊/🔇 ditambah ke nav, sebelah EN | BM. Pilihan disimpan dalam localStorage "sound".
(function () {
  var AC = window.AudioContext || window.webkitAudioContext;

  // ===== LARASAN BUNYI =====
  var MASTER = 0.16; // kekuatan keseluruhan (0 - 1). Naikkan sikit jika terlalu perlahan, cth 0.22
  // Setiap pasukan (Hz = pitch):
  //   f0 = pitch mula, f1 = pitch sebelum tukar gear, shift = berapa banyak pitch jatuh semasa tukar gear,
  //   f2 = pitch di hujung rev, bright = ketajaman (lebih tinggi = lebih tajam), q = "dengung" penapis,
  //   drive = herotan (lebih tinggi = lebih kasar/berat), sub = oktaf bawah (berat), buzz = gegaran (Hz, 0 = tiada),
  //   vol = kekuatan relatif, tail = ada bunyi pudar di halaman baru
  var PROFILES = {
    hb:   { f0: 210, f1: 720, shift: 0.72, f2: 860, bright: 7,   q: 6, drive: 3, sub: 0.25, buzz: 0,  vol: 1,    tail: true }, // tinggi, tajam
    gx:   { f0: 140, f1: 470, shift: 0.74, f2: 560, bright: 4.5, q: 3, drive: 7, sub: 0.6,  buzz: 0,  vol: 1.05, tail: true }, // sederhana, berat
    t3:   { f0: 85,  f1: 270, shift: 0.76, f2: 320, bright: 4,   q: 2, drive: 4, sub: 0.5,  buzz: 34, vol: 1.1,  tail: true }, // VitaTrack: rendah, berdengung
    crew: { f0: 130, f1: 300, shift: 0.8,  f2: 340, bright: 5,   q: 3, drive: 4, sub: 0.4,  buzz: 0,  vol: 0.7,  tail: false }, // Krew: rev pendek
    home: { f0: 110, f1: 220, shift: 1,    f2: 250, bright: 4,   q: 2, drive: 3, sub: 0.4,  buzz: 0,  vol: 0.55, tail: false } // pendek, perlahan
  };
  var REV = 0.45, TAIL = 0.55; // saat; ikut tempoh tirai dalam transition.js

  // ---- Pilihan on/off (lalai: ON) ----
  function isOn() { try { return localStorage.getItem("sound") !== "off"; } catch (e) { return true; } }
  function setOn(v) { try { localStorage.setItem("sound", v ? "on" : "off"); } catch (e) {} }

  var ctx = null, master = null;
  function getCtx() {
    if (!AC) return null;
    if (!ctx) {
      try { ctx = new AC(); master = ctx.createGain(); master.gain.value = MASTER; master.connect(ctx.destination); }
      catch (e) { ctx = null; return null; }
    }
    // iPhone Safari: AudioContext mesti di-resume semasa klik pengguna
    if (ctx.state === "suspended" && ctx.resume) { try { var r = ctx.resume(); if (r && r.catch) r.catch(function () {}); } catch (e) {} }
    return ctx;
  }
  // Pengguna sudah menekan sesuatu: buka kunci audio seawal mungkin (penting untuk iPhone)
  function unlock() { if (isOn()) getCtx(); }
  ["pointerdown", "keydown", "touchend"].forEach(function (ev) { window.addEventListener(ev, unlock, { capture: true, passive: true }); });

  var curves = {};
  function driveCurve(k) {
    if (curves[k]) return curves[k];
    var n = 1024, c = new Float32Array(n);
    for (var i = 0; i < n; i++) { var x = i * 2 / n - 1; c[i] = Math.tanh(k * x) / Math.tanh(k); }
    return (curves[k] = c);
  }

  // Satu "enjin": sawtooth + sawtooth (sedikit lari nada) + square oktaf bawah -> herotan -> penapis -> envelope
  function voice(p, mode) {
    var c = getCtx(); if (!c) return;
    if (mode !== "rev" && c.state !== "running") return; // pudar di halaman baru: hanya jika audio sudah dibenarkan
    var t0 = c.currentTime + 0.01, dur = mode === "rev" ? REV : TAIL, end = t0 + dur;
    var peak = 0.9 * p.vol;

    var env = c.createGain(); env.gain.setValueAtTime(0.0001, t0);
    var mix = c.createGain(); mix.gain.value = 0.5;
    var shaper = c.createWaveShaper(); shaper.curve = driveCurve(p.drive);
    var lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = p.q;
    var hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 60;
    var am = c.createGain(); am.gain.value = 1;
    mix.connect(shaper); shaper.connect(lp); lp.connect(hp); hp.connect(am); am.connect(env); env.connect(master);

    var oscs = [["sawtooth", 1, 0, 0.6], ["sawtooth", 1, 7, 0.4], ["square", 0.5, 0, p.sub]].map(function (d) {
      var o = c.createOscillator(); o.type = d[0]; o.detune.value = d[2];
      var g = c.createGain(); g.gain.value = d[3]; o.connect(g); g.connect(mix);
      o.ratio = d[1]; return o;
    });

    // Lengkung pitch (f = frekuensi asas). Penapis ikut pitch supaya rev makin "terbuka".
    function ramp(param, mult, max) {
      var at = function (v, t, exp) { v = Math.min(max || 20000, v * mult); if (exp) param.exponentialRampToValueAtTime(v, t); else param.setValueAtTime(v, t); };
      if (mode === "rev") {
        var ts = t0 + dur * 0.58; // saat tukar gear
        at(p.f0, t0);
        at(p.f1, ts, true);
        if (p.shift < 1) { at(p.f1 * p.shift, ts + 0.05, true); }
        at(p.f2, end, true);
      } else {
        at(p.f2 * 0.97, t0);
        at(p.f2 * 0.6, end, true);
      }
    }
    oscs.forEach(function (o) { ramp(o.frequency, o.ratio); });
    ramp(lp.frequency, p.bright, 12000);

    // Gegaran (VitaTrack): turun-naik amplitud
    if (p.buzz) {
      var lfo = c.createOscillator(), depth = c.createGain();
      lfo.frequency.value = p.buzz; depth.gain.value = 0.35; am.gain.value = 0.65;
      lfo.connect(depth); depth.connect(am.gain); lfo.start(t0); lfo.stop(end + 0.05);
    }

    // Envelope: fade in dan fade out (elak bunyi "klik")
    if (mode === "rev") {
      env.gain.exponentialRampToValueAtTime(peak, t0 + 0.04);
      env.gain.setValueAtTime(peak, end - 0.07);
      env.gain.exponentialRampToValueAtTime(0.0001, end - 0.01);
    } else {
      env.gain.exponentialRampToValueAtTime(peak * 0.75, t0 + 0.05);
      env.gain.exponentialRampToValueAtTime(0.0001, end);
    }
    oscs.forEach(function (o) { o.start(t0); o.stop(end + 0.05); });
  }

  window.engineSound = {
    supported: !!AC,
    rev: function (key) { try { if (isOn() && PROFILES[key]) voice(PROFILES[key], "rev"); } catch (e) {} },
    // Halaman baru: hanya jika pelayar benarkan audio tanpa klik baru (Chrome ya, iPhone Safari tidak)
    tail: function (key) {
      try {
        var p = PROFILES[key]; if (!isOn() || !p || !p.tail || !AC) return;
        var c = getCtx(); if (!c) return;
        if (c.state === "running") voice(p, "tail");
      } catch (e) {}
    }
  };

  // ---- Butang bunyi dalam nav ----
  var ICON_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9Z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  var ICON_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9Z" fill="currentColor"/><path d="m16.5 9.5 5 5m0-5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  function addButton() {
    var lang = document.querySelector(".nav .lang"); if (!lang || !AC) return;
    var st = document.createElement("style");
    st.textContent = ".snd{display:inline-flex;align-items:center;gap:6px;margin-left:8px;background:transparent;color:inherit;border:1.5px solid currentColor;padding:7px 10px;cursor:pointer;font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;line-height:1}" +
      ".snd svg{width:16px;height:16px;flex:none}.snd[aria-pressed='false']{opacity:.55}" +
      "@media (max-width:560px){.snd{padding:6px 7px}.snd span{display:none}}" +
      // Telefon: beri ruang untuk butang bunyi dalam nav index (tulisan di sebelah logo disembunyikan, logo kekal)
      "@media (max-width:480px){.nav .mark span{display:none}.snd{margin-left:6px}.nav .chap-btn{margin-left:6px}}" +
      "@media (max-width:360px){.nav .chap-btn{padding-left:10px;padding-right:10px}.nav .lang button{padding-left:8px;padding-right:8px}}";
    document.head.appendChild(st);
    var b = document.createElement("button"); b.type = "button"; b.className = "snd";
    lang.insertAdjacentElement("afterend", b);
    function render() {
      var on = isOn(), en = document.documentElement.lang === "en";
      b.innerHTML = (on ? ICON_ON : ICON_OFF) + "<span>" + (en ? "Sound" : "Bunyi") + "</span>";
      b.setAttribute("aria-pressed", String(on));
      b.setAttribute("aria-label", en ? (on ? "Sound: on" : "Sound: off") : (on ? "Bunyi: hidup" : "Bunyi: mati"));
      b.title = b.getAttribute("aria-label");
    }
    b.addEventListener("click", function () { setOn(!isOn()); render(); if (isOn()) getCtx(); });
    new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    window.addEventListener("storage", function (e) { if (e.key === "sound") render(); }); // tab lain
    window.addEventListener("pageshow", render);
    render();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addButton); else addButton();
})();
