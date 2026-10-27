// Halaman pasukan: aria-label dwibahasa, tab ciri (demo hidup) dan kad pasukan yang dipusing.
// Dikongsi oleh HealthyBite, Gainix dan VitaTrack.
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  // aria-label dwibahasa (ikut bahasa halaman)
  var labelled = document.querySelectorAll("[data-en-label]");
  labelled.forEach(function (el) { el.dataset.msLabel = el.getAttribute("aria-label"); });
  function syncLabels() { var en = document.documentElement.lang === "en"; labelled.forEach(function (el) { el.setAttribute("aria-label", en ? el.dataset.enLabel : el.dataset.msLabel); }); }
  new MutationObserver(syncLabels).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] }); syncLabels();

  // Demo ciri: klik, hover atau anak panah pilih ciri; bertukar sendiri sehingga disentuh
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".fx-tab")), panels = document.querySelectorAll(".fx-panel");
  var cur = 0, auto = !reduce, visible = false;
  function show(i) {
    if (i === cur) return;
    tabs[cur].setAttribute("aria-selected", "false"); tabs[cur].tabIndex = -1; panels[cur].classList.remove("on");
    cur = i;
    tabs[cur].setAttribute("aria-selected", "true"); tabs[cur].tabIndex = 0; panels[cur].classList.add("on");
  }
  tabs.forEach(function (tb, i) {
    tb.addEventListener("click", function () { auto = false; show(i); });
    tb.addEventListener("mouseenter", function () { if (fine) { auto = false; show(i); } });
    tb.addEventListener("keydown", function (e) {
      var d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return; e.preventDefault(); auto = false;
      var n = (cur + d + tabs.length) % tabs.length; show(n); tabs[n].focus();
    });
  });
  var fx = document.querySelector(".fx");
  if (fx && "IntersectionObserver" in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: .3 }).observe(fx);
  setInterval(function () { if (auto && visible) show((cur + 1) % tabs.length); }, 5200);

  // Kad ID: klik / Enter / Space untuk pusing; condong dan kilauan ikut kursor
  var card = document.querySelector(".flip");
  if (card) {
    var inner = card.querySelector(".flip-in");
    var flip = function () { var on = card.classList.toggle("flipped"); card.setAttribute("aria-pressed", String(on)); };
    card.addEventListener("click", flip);
    card.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } });
    if (fine && !reduce) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        inner.style.setProperty("--ry", ((x - .5) * 14) + "deg"); inner.style.setProperty("--rx", ((.5 - y) * 12) + "deg");
        card.querySelectorAll(".glare").forEach(function (g) { g.style.setProperty("--mx", x * 100 + "%"); g.style.setProperty("--my", y * 100 + "%"); });
      });
      card.addEventListener("pointerleave", function () { inner.style.setProperty("--rx", "0deg"); inner.style.setProperty("--ry", "0deg"); });
    }
  }

})();
