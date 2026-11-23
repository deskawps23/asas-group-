from pathlib import Path
from _ui_parts import CSS, CARDS

html = f"""<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ASAS Facility Services — Pilot Zona 1</title>
  <style>{CSS}</style>
</head>
<body>
  <header class="fs-topbar">
    <div class="fs-topbar-inner">
      <div class="fs-brand"><strong>ASAS</strong><span>Facility Services</span></div>
      <button type="button" class="fs-pill-top" data-action="go-orders">Order Saya</button>
    </div>
  </header>
  <main class="fs-wrap">
    <section class="fs-hero">
      <div class="fs-badges"><span class="fs-badge-dark">PILOT ZONA 1</span><span class="fs-badge-light">SATU HUB</span></div>
      <h1>Anda yang Utama</h1>
      <p>Jasa Setrika yang datang kepada Anda. Berat timbangan dan billing akan diverifikasi langsung di Satu Hub.</p>
      <div class="fs-hero-actions">
        <button type="button" class="fs-btn-coral" data-action="open-booking">Pesan Sekarang</button>
        <button type="button" class="fs-btn-outline" data-action="go-orders">Lihat Order Saya</button>
      </div>
    </section>
    <section id="sec-layanan" class="fs-sec">
      <span class="fs-kicker">LAYANAN</span>
      <h2>Layanan yang siap membantu</h2>
      <p class="fs-sec-sub">Jasa Setrika sudah tersedia. Layanan lainnya sedang kami persiapkan secara bertahap.</p>
      <div class="fs-grid-panel">{CARDS}</div>
    </section>
    <section id="sec-booking" class="fs-sec" hidden>
      <span class="fs-kicker">FORM PEMESANAN · ZONA 1</span>
      <h2>Pesan Jasa Setrika</h2>
      <div class="fs-dark-panel">
        <input type="hidden" id="fsServiceCode" value="IRONING" />
        <label for="fsZoneSelect" style="display:block;font-size:12.5px;font-weight:700;margin-bottom:6px;">Kecamatan Zona 1 (Satu Hub)</label>
        <select id="fsZoneSelect" class="fs-input">
          <option value="">Pilih kecamatan Zona 1</option>
          <option value="Pandeglang">Pandeglang</option><option value="Majasari">Majasari</option>
          <option value="Karang Tanjung">Karang Tanjung</option><option value="Cadasari">Cadasari</option>
          <option value="Kaduhejo">Kaduhejo</option><option value="Koroncong">Koroncong</option>
        </select>
        <label for="fsWeightInput" style="display:block;font-size:12.5px;font-weight:700;margin-bottom:6px;">Estimasi Berat (kg)</label>
        <input id="fsWeightInput" type="number" min="1" step="0.5" placeholder="Contoh: 3" class="fs-input" />
        <div class="fs-hero-actions">
          <button type="button" id="fsBtnShareLoc" class="fs-btn-outline">Bagikan Lokasi</button>
          <button type="button" id="fsBtnSubmitOrder" class="fs-btn-coral">Kirim Pesanan</button>
        </div>
        <p id="fsLocStatus" style="margin:10px 0 0;font-size:12.5px;color:#cbd5e1;"></p>
      </div>
    </section>
    <section id="sec-order" class="fs-sec">
      <span class="fs-kicker">ORDER SAYA</span>
      <h2>Pantau Pesanan</h2>
      <div id="orderListContainer" class="fs-dark-panel">
        <p style="margin:0;font-size:13.5px;color:#cbd5e1;">Pilot Jasa Setrika Zona 1 aktif. Timbangan &amp; billing diverifikasi di Satu Hub.</p>
      </div>
    </section>
    <footer class="fs-credit" aria-label="Kredit pengembang">created design &amp; development by <strong>deskawps</strong></footer>
  </main>
  <div id="fsToast" class="fs-toast" role="status" aria-live="polite" hidden></div>
  <nav class="fs-nav" aria-label="Navigasi utama">
    <div class="fs-nav-inner">
      <button type="button" class="is-active" data-nav="home"><span>&#8962;</span><span>Beranda</span></button>
      <button type="button" data-nav="services"><span>&#9776;</span><span>Layanan</span></button>
      <button type="button" data-nav="orders"><span>&#9779;</span><span>Order</span></button>
      <button type="button" data-nav="help"><span>&#63;</span><span>Bantuan</span></button>
    </div>
  </nav>
  <script>
    (() => {{
      const toast = document.getElementById("fsToast");
      const orderSec = document.getElementById("sec-order");
      const bookingSec = document.getElementById("sec-booking");
      const navBtns = document.querySelectorAll(".fs-nav button[data-nav]");
      let t = null;
      const notify = (m) => {{ if (!toast) return; toast.textContent = m; toast.hidden = false; clearTimeout(t); t = setTimeout(() => {{ toast.hidden = true; }}, 3200); }};
      const setNav = (k) => navBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.nav === k));
      const goEl = (el, k) => {{ if (!el) return; if (k) setNav(k); window.scrollTo({{ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 68), behavior: "smooth" }}); }};
      const openBook = () => {{ if (bookingSec) {{ bookingSec.hidden = false; goEl(bookingSec, "services"); }} notify("Anda siap melanjutkan pesanan Jasa Setrika Zona 1."); }};
      document.addEventListener("click", (e) => {{
        const act = e.target.closest("[data-action]")?.dataset.action;
        if (act === "open-booking") return openBook();
        if (act === "go-orders") {{ goEl(orderSec, "orders"); return notify("Menampilkan bagian Order Saya."); }}
        if (e.target.closest(".fs-card.is-active")) return openBook();
        const dis = e.target.closest(".fs-card.is-disabled");
        if (dis) return notify(`${{dis.querySelector("strong")?.textContent?.trim() || "Layanan ini"}} belum tersedia pada pilot Zona 1.`);
        const nb = e.target.closest(".fs-nav button[data-nav]");
        if (nb) {{
          const k = nb.dataset.nav; setNav(k);
          if (k === "home") window.scrollTo({{ top: 0, behavior: "smooth" }});
          else if (k === "services") goEl(document.getElementById("sec-layanan"), "services");
          else if (k === "orders") goEl(orderSec, "orders");
          else if (k === "help") notify("Pilot Zona 1 · Satu Hub: verifikasi berat & tagihan di hub.");
        }}
      }});
    }})();
  </script>
</body>
</html>"""

Path("facility.html").write_text(html.strip() + "\n", encoding="utf-8")
print("ASSEMBLED_OK")
