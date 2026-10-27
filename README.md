# Garaj

Laman web tiga app pasukan pelajar TVETMARA Lumut: **HealthyBite**, **Gainix** dan **VitaTrack**.
Tema F1: setiap app ialah satu pasukan di grid.

Live: https://shahredza.github.io/garaj/

## Struktur folder

```
index.html          Halaman utama (grid)
404.html            Halaman "Keluar trek" (GitHub Pages guna automatik; semua pautan di dalamnya alamat penuh)
html/               Halaman lain
  healthybite.html    Pasukan #44 HealthyBite Racing
  gainix.html         Pasukan #12 GX Works Motorsport
  vitatrack.html      Pasukan #3 VitaTrack Racing
  about.html          Krew: Shah, Haziq, Sasha
  privasi.html        Dasar privasi
css/
  fx.css              Animasi dan ciri halaman utama (kuiz, kedudukan, marquee, bendera, tema gelap)
  touch.css           Telefon dan iPad: butang 44 px, nav telefon kecil (semua halaman)
js/
  transition.js       Tirai peralihan antara halaman
  sound.js            Bunyi enjin dan butang bunyi
  releases.js         Kiraan muat turun dan log perubahan dari GitHub Releases
  fx.js               Logik animasi dan ciri halaman utama
  egg.js              Telur Easter (taip "boxbox")
images/
  garaj/              Favicon laman
  healthybite/        crest.webp, icon.png, gambar skrin app
  gainix/             crest.webp, icon.png, gambar skrin app
  vitatrack/          logo.webp, icon.webp, favicon.png, touch.png, gambar skrin app
  krew/               Foto krew
  og/                 Gambar pratonton bila pautan dikongsi (JPG, 1200 x 630)
robots.txt, sitemap.xml   Untuk Google

about.html, healthybite.html, gainix.html, vitatrack.html, app03.html (di akar)
                    Fail lencongan untuk alamat lama. Jangan buang, supaya pautan lama tidak jadi 404.
```

## Nota penting

- **Dwibahasa EN | BM.** Halaman utama guna kamus `I18N` dalam `index.html` (teks BM -> EN).
  Halaman lain guna atribut `data-en="..."` pada setiap teks.
- **Penaja** disenaraikan di dua tempat: `index.html` (bahagian penaja) dan halaman pasukan (`html/<pasukan>.html`).
  Tukar kedua-duanya sekali.
- **Gambar baru:** simpan sebagai WebP dan letak `width` / `height` pada `<img>`. Gambar OG kekal JPG.
- **APK** diterbitkan di GitHub Releases. Butang muat turun sentiasa ke versi terkini (`releases/latest`).

## Uji di komputer

```
python3 -m http.server 8765
```

Kemudian buka http://localhost:8765/
