// Kesan tambahan. Dimuat selepas skrip utama dan releases.js.
// Setiap ciri hanya berjalan jika elemennya wujud, jadi fail ini boleh dimuat di halaman pasukan juga.
//   1 tajuk pecah huruf · 2 trek & kereta · 3 nombor kiraan · 4 butang magnet · 5 kad senget 3D
//   6 marquee · 7 bingkai telefon · 8 bendera · 9 kedudukan · 10 kuiz · 11 tema gelap/cerah
(function () {
  var root = document.documentElement;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  function en() { return root.lang === "en"; }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function onLang(fn) { new MutationObserver(fn).observe(root, { attributes: true, attributeFilter: ["lang"] }); }
  // Panggil fn sekali bila elemen masuk skrin
  function seen(el, fn, margin) {
    if (!("IntersectionObserver" in window)) return fn();
    var io = new IntersectionObserver(function (es) { if (es.some(function (x) { return x.isIntersecting; })) { io.disconnect(); fn(); } }, { rootMargin: margin || "0px 0px -10% 0px" });
    io.observe(el);
  }
  // Satu gelung untuk semua kesan yang ikut kedudukan scroll
  var onFrame = [], ticking = false;
  function loop() { var vh = window.innerHeight; onFrame.forEach(function (f) { f(vh); }); }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; loop(); }); } }, { passive: true });
  window.addEventListener("resize", loop);

  // ===== 1. Tajuk pecah huruf =====
  // Nod teks asal dipindah ke span tersembunyi (nod yang sama, jadi tukar bahasa masih berfungsi),
  // dan salinan huruf demi huruf dibina untuk animasi. Bila teks asal bertukar, salinan dibina semula.
  if (!reduce) $$(".chap-head h2, h2[data-split]").forEach(function (h) {
    if (h.children.length) return; // hanya tajuk teks biasa
    var src = document.createElement("span"), vis = document.createElement("span");
    src.className = "split-src"; vis.className = "split"; vis.setAttribute("aria-hidden", "true");
    while (h.firstChild) src.appendChild(h.firstChild);
    h.append(src, vis); h.classList.add("split-on");
    function build() {
      vis.textContent = "";
      var i = 0;
      src.textContent.trim().split(/\s+/).forEach(function (word, wi) {
        if (wi) vis.appendChild(document.createTextNode(" "));
        var w = document.createElement("span"); w.className = "w";
        Array.from(word).forEach(function (c) {
          var s = document.createElement("span"); s.className = "ch"; s.style.setProperty("--i", i++); s.textContent = c; w.appendChild(s);
        });
        vis.appendChild(w);
      });
    }
    build();
    new MutationObserver(build).observe(src, { characterData: true, childList: true, subtree: true });
    if (!h.closest(".rv")) seen(h, function () { vis.classList.add("in"); });
  });

  // ===== 3. Nombor kiraan naik (didahulukan: dipakai oleh kedudukan) =====
  function fmt(n) { return Math.round(n).toLocaleString("en-US"); }
  function countUp(el, to, dur) {
    if (reduce) { el.textContent = fmt(to); return; }
    var t0 = null; dur = dur || 1400;
    function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(to * e);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function countWhenSeen(el, to) {
    if (el.dataset.counted) return; el.dataset.counted = "1";
    if (reduce) { el.textContent = fmt(to); return; }
    el.textContent = "0";
    seen(el, function () { countUp(el, to); });
  }
  // releases.js memanggil ini untuk kiraan muat turun; yang sudah siap sebelum fail ini dimuat diproses di sini
  window.garajCount = countWhenSeen;
  $$("[data-count][data-n]").forEach(function (el) { countWhenSeen(el, +el.dataset.n); });

  // ===== 2. Trek dan kereta di bab Permulaan =====
  var tl = document.querySelector("#permulaan .tl");
  if (tl) {
    var wrap = document.createElement("div"); wrap.className = "tl-wrap";
    tl.parentNode.insertBefore(wrap, tl); wrap.appendChild(tl);
    var track = document.createElement("div"); track.className = "tl-track"; track.setAttribute("aria-hidden", "true");
    track.innerHTML = '<i class="tl-fill"></i>' +
      '<svg class="tl-car" viewBox="0 0 58 22"><rect x="0" y="2" width="5" height="18" rx="1" fill="#e10600"/><rect x="7" y="0" width="11" height="5" rx="1.5" fill="#111"/><rect x="7" y="17" width="11" height="5" rx="1.5" fill="#111"/>' +
      '<path d="M6 8h32l13 2v2l-13 2H6z" fill="#e10600"/><path d="M14 9.2h20v3.6H14z" fill="#fff" opacity=".9"/><ellipse cx="27" cy="11" rx="5" ry="2.6" fill="#111"/>' +
      '<rect x="37" y="1" width="9" height="4.5" rx="1.5" fill="#111"/><rect x="37" y="16.5" width="9" height="4.5" rx="1.5" fill="#111"/><rect x="52" y="3" width="5" height="16" rx="1" fill="#e10600"/></svg>';
    wrap.appendChild(track);
    tl.classList.add("track-on");
    var fill = track.firstChild, car = track.lastChild, lis = $$("li", tl);
    onFrame.push(function (vh) {
      var r = tl.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var p = reduce ? 1 : clamp((vh * .85 - r.top) / (vh * .55), 0, 1);
      fill.style.transform = "scaleX(" + p + ")";
      car.style.transform = "translateX(" + (p * r.width) + "px)";
      var wide = window.innerWidth > 1000;
      lis.forEach(function (li) {
        li.classList.toggle("passed", wide ? p * r.width >= li.offsetLeft - 2 : li.getBoundingClientRect().top < vh * .8);
      });
    });
  }

  // ===== 4. Butang magnet (desktop sahaja) =====
  if (fine && !reduce) $$(".btn, .arrow").forEach(function (b) {
    var S = .3, T = "background .2s, color .2s, filter .2s, ";
    b.addEventListener("pointermove", function (e) {
      var r = b.getBoundingClientRect();
      b.style.transition = T + "transform .15s ease-out";
      b.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * S) + "px," + ((e.clientY - r.top - r.height / 2) * S) + "px)";
    });
    b.addEventListener("pointerleave", function () {
      b.style.transition = T + "transform .7s cubic-bezier(.2, 1.8, .4, 1)";
      b.style.transform = "";
    });
  });

  // ===== 5. Kad senget 3D dengan kilauan =====
  if (fine && !reduce) $$(".livery, .bay").forEach(function (c) {
    var t;
    c.addEventListener("pointermove", function (e) {
      var r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      clearTimeout(t); c.classList.remove("tilt-ease"); c.classList.add("tilting");
      c.style.setProperty("--ry", ((px - .5) * 14) + "deg");
      c.style.setProperty("--rx", ((.5 - py) * 12) + "deg");
      c.style.setProperty("--mx", (px * 100) + "%");
      c.style.setProperty("--my", (py * 100) + "%");
    });
    c.addEventListener("pointerleave", function () {
      c.classList.remove("tilting"); c.classList.add("tilt-ease");
      c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg");
      t = setTimeout(function () { c.classList.remove("tilt-ease"); }, 500);
    });
  });

  // ===== 6. Marquee: laju bila scroll laju, arah ikut arah scroll =====
  $$(".mq").forEach(function (mq) {
    var rows = $$(".mq-row", mq).map(function (row) { row.innerHTML += row.innerHTML; return { el: row, x: 0, d: row.classList.contains("o") ? 1 : -1 }; });
    if (reduce) return;
    var vel = 0, lastY = window.scrollY, dir = 1, visible = true, prev = performance.now();
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(mq);
    window.addEventListener("scroll", function () {
      var dy = window.scrollY - lastY; lastY = window.scrollY;
      if (dy) dir = dy > 0 ? 1 : -1;
      vel = clamp(vel + Math.abs(dy) * .2, 0, 36);
    }, { passive: true });
    (function step(t) {
      var dt = Math.min(50, t - prev) / 16.67; prev = t;
      if (visible) rows.forEach(function (r) {
        var half = r.el.scrollWidth / 2;
        r.x += r.d * dir * (1.1 + vel) * dt;
        if (r.x <= -half) r.x += half; else if (r.x > 0) r.x -= half;
        r.el.style.transform = "translate3d(" + r.x + "px,0,0)";
      });
      vel *= Math.pow(.92, dt);
      requestAnimationFrame(step);
    })(prev);
  });

  // ===== 7. Skrin app dalam bingkai telefon berputar ikut scroll =====
  if (!reduce) {
    var shotSets = $$(".team .shots").map(function (s) { return { el: s, frames: $$(".frame", s) }; });
    if (shotSets.length) onFrame.push(function (vh) {
      shotSets.forEach(function (s) {
        var r = s.el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var q = clamp((r.top + r.height / 2 - vh / 2) / vh, -1, 1);
        s.frames.forEach(function (f, i) { f.style.transform = "rotate(" + (q * 7 * (i ? 1 : -1)) + "deg) translateY(" + (q * 30) + "px)"; });
      });
    });
  }

  // ===== 8. Bendera berpetak beralun =====
  $$(".flag").forEach(function (f) {
    for (var k = 0; k < 32; k++) { var i = document.createElement("i"); i.style.setProperty("--k", k); f.appendChild(i); }
    if (!("IntersectionObserver" in window)) { f.classList.add("seen", "play"); return; }
    new IntersectionObserver(function (es) {
      var v = es[0].isIntersecting; f.classList.toggle("play", v); if (v) f.classList.add("seen");
    }, { rootMargin: "0px 0px -10% 0px" }).observe(f);
  });

  // ===== 9. Kedudukan kejuaraan: muat turun dari GitHub =====
  // Kira naik dulu ikut susunan asal, kemudian baris bertukar tempat ikut kedudukan sebenar (macam memotong di trek).
  var std = document.getElementById("standings");
  if (std) {
    var rowsS = $$(".std-row", std), data = {}, sorted = rowsS.slice(), ready = false, vis = false, done = false;
    var totalEl = document.querySelector("[data-std-total]"), fail = document.getElementById("stdFail");
    rowsS.forEach(function (r) {
      if (!window.garajReleases) return;
      window.garajReleases(r.dataset.repo, function (rs) {
        data[r.dataset.team] = rs.reduce(function (s, x) { return s + x.dl; }, 0);
        if (Object.keys(data).length === rowsS.length) { ready = true; go(); }
      });
    });
    setTimeout(function () { if (!ready) { ready = true; go(); } }, 5000); // GitHub lambat/gagal: guna apa yang ada
    seen(std, function () { vis = true; go(); });
    function val(r) { var n = data[r.dataset.team]; return n == null ? -1 : n; }
    function gaps() {
      var lead = val(sorted[0]);
      sorted.forEach(function (r, i) {
        var g = r.querySelector(".std-gap"), n = val(r);
        g.textContent = n < 0 ? "—" : i === 0 ? (en() ? "Leader" : "Ketua") : (lead - n === 0 ? (en() ? "Level" : "Seri") : "−" + fmt(lead - n));
      });
    }
    function go() {
      if (!vis || !ready || done) return; done = true;
      var vals = rowsS.map(val).filter(function (n) { return n >= 0; });
      if (!vals.length) { if (fail) fail.hidden = false; return; }
      var max = Math.max.apply(null, vals) || 1, total = vals.reduce(function (s, n) { return s + n; }, 0);
      rowsS.forEach(function (r) {
        var b = r.querySelector("[data-std-n]"), n = val(r);
        if (n < 0) { b.textContent = "—"; return; }
        countUp(b, n, 1600);
        r.querySelector(".std-bar i").style.transform = "scaleX(" + (n / max) + ")";
      });
      if (totalEl) countUp(totalEl, total, 1600);
      setTimeout(reorder, reduce ? 0 : 1800);
    }
    function reorder() {
      var first = rowsS.map(function (r) { return r.getBoundingClientRect().top; });
      sorted = rowsS.slice().sort(function (a, b) { return val(b) - val(a); });
      sorted.forEach(function (r) { std.appendChild(r); });
      rowsS.forEach(function (r, i) {
        var d = first[i] - r.getBoundingClientRect().top;
        if (d && !reduce && r.animate) r.animate([{ transform: "translateY(" + d + "px)" }, { transform: "none" }], { duration: 900, easing: "cubic-bezier(.7, 0, .2, 1)" });
      });
      sorted.forEach(function (r, i) { r.dataset.pos = i + 1; r.querySelector(".std-pos").textContent = "P" + (i + 1); });
      gaps();
    }
    onLang(function () { if (done) gaps(); });
  }

  // ===== 10. Kuiz "Pilih pasukan anda" =====
  var quiz = document.getElementById("quiz");
  if (quiz) {
    var Q = [
      { ms: "Apa matlamat utama anda?", en: "What is your main goal?",
        o: [["hb", "Makan lebih sihat", "Eat healthier"], ["gx", "Jadi lebih kuat", "Get stronger"], ["t3", "Rutin harian yang lebih teratur", "A steadier daily routine"]] },
      { ms: "Bila anda paling perlukan bantuan?", en: "When do you need help most?",
        o: [["hb", "Semasa memilih makanan", "When choosing what to eat"], ["gx", "Semasa di gim", "At the gym"], ["t3", "Sepanjang hari", "All day long"]] },
      { ms: "Data apa yang anda paling suka lihat?", en: "Which numbers do you like to see?",
        o: [["hb", "Kalori dan makro", "Calories and macros"], ["gx", "Berat angkat dan 1RM", "Lifts and 1RM"], ["t3", "Langkah, air dan tidur", "Steps, water and sleep"]] }
    ];
    var TEAMS = {
      hb: { name: "HealthyBite", tag: "HealthyBite Racing · #44", href: "html/healthybite.html", crest: "crest-hb", box: "0 0 120 100", c: "var(--hb)", btn: "btn-hb",
        ms: "Anda pemandu bahan api. HealthyBite menganggar kalori dan makro dari gambar makanan anda.", en: "You're a fuel driver. HealthyBite estimates calories and macros from a photo of your food." },
      gx: { name: "Gainix", tag: "GX Works Motorsport · #12", href: "html/gainix.html", crest: "crest-gx", box: "0 0 100 100", c: "linear-gradient(90deg, var(--silver), var(--gx))", btn: "btn-gx",
        ms: "Anda pemandu enjin. Gainix mencadangkan set, ulangan dan berat ikut 1RM anda.", en: "You're an engine driver. Gainix suggests sets, reps and weight from your 1RM." },
      t3: { name: "VitaTrack", tag: "VitaTrack Performance Racing · #3", href: "html/vitatrack.html", crest: "crest-t3", box: "0 0 231 100", wide: true, c: "linear-gradient(90deg, #fd3851, #6371cd)", btn: "btn-t3",
        ms: "Anda pemandu telemetri. VitaTrack menjejak langkah, air, tidur dan mood, lalu menjadikannya cabaran harian.", en: "You're a telemetry driver. VitaTrack tracks steps, water, sleep and mood, and turns them into daily challenges." }
    };
    var step = 0, picks = [];
    function L(ms, e) { return en() ? e : ms; }
    function render(focus) {
      quiz.classList.remove("qz-res", "qz-in"); quiz.style.removeProperty("--c");
      void quiz.offsetWidth; // mula semula animasi masuk
      if (step < Q.length) {
        var q = Q[step];
        quiz.innerHTML =
          '<div class="qz-top"><span>' + L("Soalan ", "Question ") + (step + 1) + " / " + Q.length + '</span><span class="qz-dots">' +
          Q.map(function (_, i) { return '<i class="' + (i <= step ? "on" : "") + '"></i>'; }).join("") + "</span></div>" +
          '<h3 class="qz-q" tabindex="-1">' + L(q.ms, q.en) + '</h3><div class="qz-opts">' +
          q.o.map(function (o, i) { return '<button type="button" class="qz-opt" data-t="' + o[0] + '"><b>' + "ABC"[i] + "</b>" + L(o[1], o[2]) + "</button>"; }).join("") + "</div>";
        $$(".qz-opt", quiz).forEach(function (b) { b.addEventListener("click", function () { picks.push(b.dataset.t); step++; render(true); }); });
      } else {
        var score = { hb: 0, gx: 0, t3: 0 };
        picks.forEach(function (p) { score[p]++; });
        var best = Object.keys(score).sort(function (a, b) { return score[b] - score[a]; })[0];
        quiz.classList.add("qz-res");
        if (score[best] === 1) { // satu jawapan untuk setiap pasukan
          quiz.innerHTML = '<p class="eyebrow"><b>●</b> ' + L("Pasukan anda", "Your team") + '</p><h3 class="qz-q" tabindex="-1" style="margin:0">' + L("Ketiga-tiga pasukan", "All three teams") + "</h3><p>" +
            L("Anda mahu semuanya: makan, latihan dan rutin harian. Pasang ketiga-tiga app; setiap satu berfungsi sendiri.", "You want it all: food, training and daily routine. Install all three; each one works on its own.") +
            '</p><div class="row"><a class="btn btn-ink" href="#pit">' + L("Ke pit stop", "Go to the pit stop") + '</a></div><button type="button" class="qz-again">' + L("Cuba lagi", "Try again") + "</button>";
        } else {
          var t = TEAMS[best];
          quiz.style.setProperty("--c", t.c);
          quiz.innerHTML = '<p class="eyebrow"><b>●</b> ' + L("Pasukan anda", "Your team") + '</p><svg class="crest' + (t.wide ? " wide" : "") + '" viewBox="' + t.box + '" aria-hidden="true"><use href="#' + t.crest + '"/></svg>' +
            '<h3 class="qz-q" tabindex="-1" style="margin:0">' + t.name + '</h3><p class="eyebrow">' + t.tag + "</p><p>" + L(t.ms, t.en) + '</p><div class="row"><a class="btn ' + t.btn + '" href="' + t.href + '">' +
            L("Ke garaj " + t.name, "Go to the " + t.name + " garage") + '</a></div><button type="button" class="qz-again">' + L("Cuba lagi", "Try again") + "</button>";
        }
        quiz.querySelector(".qz-again").addEventListener("click", function () { step = 0; picks = []; render(true); });
      }
      if (!reduce) quiz.classList.add("qz-in");
      if (focus) quiz.querySelector(".qz-q").focus({ preventScroll: true });
    }
    render(false);
    onLang(function () { render(false); });
  }

  // ===== 11. Butang tema gelap/cerah (kelas html.dk; pilihan awal ditetapkan dalam <head>) =====
  var tb = document.getElementById("themeBtn");
  if (tb) {
    var mqDark = matchMedia("(prefers-color-scheme: dark)");
    function isDk() { return root.classList.contains("dk"); }
    function label() {
      var l = isDk() ? L2("Tukar ke mod cerah", "Switch to light mode") : L2("Tukar ke mod gelap", "Switch to dark mode");
      tb.setAttribute("aria-label", l); tb.title = l; tb.setAttribute("aria-pressed", String(isDk()));
    }
    function L2(ms, e) { return en() ? e : ms; }
    function apply(d) {
      root.classList.toggle("dk", d); label();
      $$('meta[name="theme-color"]').forEach(function (m) { m.setAttribute("content", d ? "#141417" : "#f3f1ec"); });
    }
    tb.addEventListener("click", function (e) {
      var d = !isDk();
      try { localStorage.setItem("theme", d ? "dark" : "light"); } catch (er) {}
      if (!document.startViewTransition || reduce) return apply(d);
      // Mod baru tersebar dalam bulatan dari butang
      var x = e.clientX || window.innerWidth - 40, y = e.clientY || 34;
      var r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      document.startViewTransition(function () { apply(d); }).ready.then(function () {
        root.animate({ clipPath: ["circle(0px at " + x + "px " + y + "px)", "circle(" + r + "px at " + x + "px " + y + "px)"] },
          { duration: 700, easing: "cubic-bezier(.7, 0, .2, 1)", pseudoElement: "::view-transition-new(root)" });
      });
    });
    if (mqDark.addEventListener) mqDark.addEventListener("change", function (e) {
      var t = null; try { t = localStorage.getItem("theme"); } catch (er) {}
      if (!t) apply(e.matches);
    });
    apply(isDk()); onLang(label);
  }

  loop();
})();
