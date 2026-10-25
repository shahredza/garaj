// Data dari GitHub Releases: kiraan muat turun dan log perubahan.
// Disimpan 10 minit dalam sessionStorage supaya tak kena had API GitHub (60 permintaan sejam).
//   <… data-dl-repo="pemilik/repo" hidden> … <b data-count></b> …  → isi jumlah muat turun, kemudian papar
//   window.garajReleases(repo, cb)                                → data mentah untuk papan kedudukan
//   <ol data-log-repo="pemilik/repo"> <li data-tag="v1.0.0">…     → tambah release baru yang belum ditulis
(function () {
  var pending = {};

  function get(repo, cb) {
    var key = "rel:" + repo, cached = null;
    try { cached = JSON.parse(sessionStorage.getItem(key)); } catch (e) {}
    if (cached && Date.now() - cached.t < 600000) return cb(cached.d);
    if (!pending[repo]) {
      pending[repo] = fetch("https://api.github.com/repos/" + repo + "/releases?per_page=30")
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (list) {
          var d = list.filter(function (x) { return !x.draft; }).map(function (x) {
            return {
              tag: x.tag_name, name: x.name || "", date: x.published_at || x.created_at, body: x.body || "",
              dl: x.assets.reduce(function (s, a) { return s + a.download_count; }, 0)
            };
          });
          try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {}
          return d;
        });
    }
    pending[repo].then(cb).catch(function () {}); // Gagal: elemen kekal tersembunyi
  }

  // Untuk fx.js (papan kedudukan): garajReleases("pemilik/repo", function (senarai) { ... })
  window.garajReleases = get;

  function fmt(iso) {
    var d = new Date(iso);
    return ("0" + d.getDate()).slice(-2) + "." + ("0" + (d.getMonth() + 1)).slice(-2) + "." + d.getFullYear();
  }

  document.querySelectorAll("[data-dl-repo]").forEach(function (el) {
    get(el.getAttribute("data-dl-repo"), function (rs) {
      var n = rs.reduce(function (s, r) { return s + r.dl; }, 0);
      var c = el.querySelector("[data-count]");
      c.textContent = n.toLocaleString("en-US"); c.setAttribute("data-n", n);
      if (window.garajCount) window.garajCount(c, n); // fx.js: kira naik bila nampak di skrin
      el.hidden = false;
    });
  });

  document.querySelectorAll("[data-log-repo]").forEach(function (ol) {
    get(ol.getAttribute("data-log-repo"), function (rs) {
      var have = {};
      ol.querySelectorAll("[data-tag]").forEach(function (li) { have[li.getAttribute("data-tag")] = true; });
      // API pulangkan yang terbaru dulu; tambah dari yang lama supaya yang terbaru berada di atas
      rs.slice().reverse().forEach(function (r) {
        if (have[r.tag]) return;
        var li = document.createElement("li"), head = document.createElement("div");
        var v = document.createElement("span"), t = document.createElement("time"), p = document.createElement("p");
        li.setAttribute("data-tag", r.tag);
        v.className = "v"; v.textContent = r.tag;
        t.dateTime = r.date.slice(0, 10); t.textContent = fmt(r.date);
        p.textContent = (r.body.split(/\r?\n\s*\r?\n/)[0] || r.name).replace(/[*_`#>]/g, "").trim();
        head.append(v, t); li.append(head, p); ol.prepend(li);
      });
    });
  });
})();
