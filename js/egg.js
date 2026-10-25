// Telur Easter: lampu permulaan F1 dan radio pasukan.
// Cara buka: taip "boxbox", atau kod Konami (↑ ↑ ↓ ↓ ← → ← → B A), atau tekan kaki laman 5 kali dalam 2 saat (telefon).
// Bunyi ikut butang 🔊/🔇 (localStorage "sound"). Esc atau butang Tutup untuk keluar.
(function () {
  var KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
  var keys = [], typed = "", taps = [], running = false, ac = null;

  document.addEventListener("keydown", function (e) {
    if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;
    var k = (e.key || "").toLowerCase();
    keys.push(k); if (keys.length > KONAMI.length) keys.shift();
    if (keys.join() === KONAMI.join()) { keys = []; run(); return; }
    if (k.length === 1) { typed = (typed + k).replace(/\s/g, "").slice(-6); if (typed === "boxbox") { typed = ""; run(); } }
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest || !e.target.closest("footer") || e.target.closest("a, button")) return;
    var now = Date.now();
    taps = taps.filter(function (t) { return now - t < 2000; }); taps.push(now);
    if (taps.length >= 5) { taps = []; run(); }
  });

  // ---- Bunyi kecil (Web Audio, tiada fail) ----
  function ctx() {
    try { if (localStorage.getItem("sound") === "off") return null; } catch (e) {}
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    if (!ac) { try { ac = new AC(); } catch (e) { return null; } }
    if (ac.state === "suspended" && ac.resume) ac.resume();
    return ac;
  }
  function beep(f, dur, vol) {
    var c = ctx(); if (!c) return;
    var o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
    o.type = "square"; o.frequency.value = f;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * .07, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + .02);
  }
  function radio() { // desis radio, kemudian dua bip
    var c = ctx(); if (!c) return;
    var n = Math.floor(c.sampleRate * .28), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
    s.buffer = b; bp.type = "bandpass"; bp.frequency.value = 1800; bp.Q.value = .8; g.gain.value = .1;
    s.connect(bp); bp.connect(g); g.connect(c.destination); s.start();
    setTimeout(function () { beep(1250, .08, .7); }, 300);
    setTimeout(function () { beep(1250, .08, .7); }, 430);
  }

  var CSS =
    ".egg{position:fixed;inset:0;z-index:500;display:grid;place-content:center;justify-items:center;gap:28px;padding:16px;background:rgba(8,8,10,.95);color:#f3f1ec;opacity:0;transition:opacity .35s;text-align:center;font-family:'Barlow Condensed','Arial Narrow',Impact,sans-serif}" +
    ".egg.on{opacity:1}" +
    ".egg-lights{display:flex;gap:clamp(8px,2vw,16px);transition:opacity .4s}" +
    ".egg-lights span{width:clamp(46px,11vw,76px);padding:10px 0;display:grid;justify-items:center;gap:10px;background:#050506;border:1px solid #26262c;border-radius:12px}" +
    ".egg-lights i{width:clamp(28px,7vw,48px);aspect-ratio:1;border-radius:50%;background:#2a0b0a;box-shadow:inset 0 -4px 8px rgba(0,0,0,.6);transition:background .06s,box-shadow .06s}" +
    ".egg-lights span.lit i{background:radial-gradient(circle at 40% 35%,#ff6a5c,#e10600 55%,#8f0400);box-shadow:0 0 18px #e10600,0 0 44px rgba(225,6,0,.55)}" +
    ".egg-out{margin:0;min-height:.9em;font-style:italic;font-weight:900;font-size:clamp(40px,8vw,104px);line-height:.9;text-transform:uppercase;opacity:0;transform:scale(.6);transition:transform .5s cubic-bezier(.2,1.4,.4,1),opacity .3s}" +
    ".egg.go .egg-out{opacity:1;transform:none}.egg.go .egg-lights{opacity:.3}" +
    ".egg-radio{margin:0;display:flex;align-items:center;gap:10px;padding:10px 16px;border-left:4px solid #e10600;background:#16161a;font:700 14px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase;opacity:0;transform:translateY(12px);transition:opacity .3s,transform .3s}" +
    ".egg.radio .egg-radio{opacity:1;transform:none}" +
    ".egg-x{position:absolute;right:16px;top:16px;background:transparent;border:1px solid #3a3a42;color:#9a98a1;padding:8px 14px;font:700 11px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;cursor:pointer}" +
    ".egg-x:hover,.egg-x:focus-visible{color:#fff;border-color:#e10600}" +
    "@media (prefers-reduced-motion:reduce){.egg,.egg-out,.egg-radio,.egg-lights{transition:none}}";

  function run() {
    if (running) return; running = true;
    if (!document.getElementById("egg-css")) { var st = document.createElement("style"); st.id = "egg-css"; st.textContent = CSS; document.head.appendChild(st); }
    var en = document.documentElement.lang === "en", prevFocus = document.activeElement;
    var o = document.createElement("div");
    o.className = "egg"; o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true");
    o.setAttribute("aria-label", en ? "Race start" : "Permulaan perlumbaan");
    o.innerHTML = '<div class="egg-lights" aria-hidden="true">' + new Array(6).join("<span><i></i><i></i></span>") + "</div>" +
      '<p class="egg-out" aria-live="assertive"></p><p class="egg-radio"><span aria-hidden="true">📻</span><span></span></p>' +
      '<button type="button" class="egg-x">' + (en ? "Close" : "Tutup") + "</button>";
    document.body.appendChild(o);
    requestAnimationFrame(function () { o.classList.add("on"); });
    var pods = o.querySelectorAll(".egg-lights span"), out = o.querySelector(".egg-out"), msg = o.querySelector(".egg-radio span:last-child");
    var timers = [], STEP = 700, hold = 500 + 4 * STEP + 400 + Math.random() * 1400; // lampu padam pada masa rawak, macam F1
    Array.prototype.forEach.call(pods, function (p, i) { timers.push(setTimeout(function () { p.classList.add("lit"); beep(330, .12, 1); }, 500 + i * STEP)); });
    timers.push(setTimeout(function () {
      Array.prototype.forEach.call(pods, function (p) { p.classList.remove("lit"); });
      o.classList.add("go");
      out.textContent = en ? "Lights out and away we go!" : "Lampu padam, perlumbaan bermula!";
      if (window.engineSound) window.engineSound.rev("hb");
    }, hold));
    timers.push(setTimeout(function () {
      o.classList.add("radio"); radio();
      msg.textContent = en ? "Box, box. Box, box. Great start!" : "Box, box. Box, box. Permulaan yang hebat!";
    }, hold + 1300));
    timers.push(setTimeout(close, hold + 5200));
    function esc(e) { if (e.key === "Escape") close(); }
    function close() {
      timers.forEach(clearTimeout); document.removeEventListener("keydown", esc);
      o.classList.remove("on");
      setTimeout(function () { o.remove(); running = false; if (prevFocus && prevFocus.focus) prevFocus.focus(); }, 380);
    }
    document.addEventListener("keydown", esc);
    var x = o.querySelector(".egg-x"); x.addEventListener("click", close); x.focus();
  }
})();
