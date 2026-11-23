from pathlib import Path

p = Path("facility.html")
s = p.read_text(encoding="utf-8")

patokan_field = """
<label class="fs-field-label" for="fsLandmarkInput">Patokan / Catatan Lokasi (Opsional)</label>
<input id="fsLandmarkInput" class="fs-input" type="text" placeholder="Contoh: Dekat masjid / pagar hijau" />
"""

if 'id="fsLandmarkInput"' not in s:
    s = s.replace(
        '<div class="fs-hero-actions">',
        patokan_field.strip() + '\n<div class="fs-hero-actions">',
        1
    )

geo_js = """
<script>
(() => {
  const toast = document.getElementById("fsToast");
  const orderSec = document.getElementById("sec-order");
  const orderList = document.getElementById("orderListContainer");
  const bookingSec = document.getElementById("sec-booking");
  const zoneSel = document.getElementById("fsZoneSelect");
  const zoneInfo = document.getElementById("fsZoneInfo");
  const weightInp = document.getElementById("fsWeightInput");
  const landmarkInp = document.getElementById("fsLandmarkInput");
  const locStatus = document.getElementById("fsLocStatus");
  const shareBtn = document.getElementById("fsBtnShareLoc");
  const navBtns = document.querySelectorAll(".fs-nav button[data-nav]");
  let toastTimer = null;
  let geoData = null;
  const orders = [];

  const zoneHubNotes = {
    "Pandeglang": "Zona 1 · Pandeglang — Jemput terjadwal menuju Satu Hub (timbangan & tagihan final di hub).",
    "Majasari": "Zona 1 · Majasari — Cakupan aktif Satu Hub dengan verifikasi berat aktual di hub.",
    "Karang Tanjung": "Zona 1 · Karang Tanjung — Rute jemput pilot Satu Hub aktif.",
    "Cadasari": "Zona 1 · Cadasari — Rute jemput pilot Satu Hub aktif.",
    "Kaduhejo": "Zona 1 · Kaduhejo — Rute jemput pilot Satu Hub aktif.",
    "Koroncong": "Zona 1 · Koroncong — Rute jemput pilot Satu Hub aktif."
  };

  function notify(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 3400);
  }

  function setNav(key) {
    navBtns.forEach((b) => b.classList.toggle("is-active", b.dataset.nav === key));
  }

  function goEl(el, key) {
    if (!el) return;
    if (key) setNav(key);
    const y = el.getBoundingClientRect().top + window.scrollY - 68;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  }

  function openBooking() {
    if (bookingSec) {
      bookingSec.hidden = false;
      goEl(bookingSec, "services");
    }
    notify("Form Jasa Setrika (02 AKTIF) siap diisi untuk Zona 1.");
  }

  function renderGeoStatus(htmlText) {
    if (!locStatus) return;
    locStatus.innerHTML = htmlText;
  }

  function renderOrders() {
    if (!orderList) return;
    if (!orders.length) {
      orderList.innerHTML = '<p style="margin:0;font-size:13.5px;color:#cbd5e1;">Belum ada pesanan aktif. Tekan <strong>Pesan Sekarang</strong> atau pilih kartu <strong>02 Jasa Setrika</strong>.</p>';
      return;
    }
    orderList.innerHTML = orders.map((o) => {
      const geoLine = o.geo && typeof o.geo.lat === "number"
        ? `Geotag: <strong>${o.geo.lat.toFixed(6)}, ${o.geo.lng.toFixed(6)}</strong> (±${Math.round(o.geo.acc)}m) · <a href="https://www.google.com/maps?q=${o.geo.lat},${o.geo.lng}" target="_blank" rel="noopener" style="color:#5eead4;text-decoration:underline;">Buka Peta</a>`
        : `Geotag: <strong>${o.geoLabel || "Manual / Konfirmasi Kurir"}</strong>`;
      const markLine = o.landmark ? `<br>Patokan: <strong>${o.landmark}</strong>` : "";
      return `
        <div style="padding:12px;border-radius:14px;background:#07192f;border:1px solid #1e3a5f;margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;">
            <strong style="font-size:14px;color:#ffffff;">${o.code} · Jasa Setrika</strong>
            <span style="font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;background:#0f766e;color:#ccfbf1;">Menunggu Jemput</span>
          </div>
          <div style="margin-top:6px;font-size:12.5px;color:#cbd5e1;line-height:1.5;">
            Kecamatan: <strong>${o.zone}</strong> · Est. Berat: <strong>${o.weight} kg</strong><br>
            ${geoLine}${markLine}<br>
            <span style="color:#94a3b8;">Verifikasi berat aktual &amp; tagihan final dilakukan di Satu Hub.</span>
          </div>
        </div>
      `;
    }).join("");
  }

  zoneSel?.addEventListener("change", () => {
    if (!zoneInfo) return;
    const z = zoneSel.value;
    zoneInfo.innerHTML = z && zoneHubNotes[z]
      ? zoneHubNotes[z]
      : 'Pilih salah satu dari 6 kecamatan <strong>Zona 1</strong> untuk penjemputan &amp; verifikasi timbangan di <strong>Satu Hub</strong>.';
  });

  shareBtn?.addEventListener("click", () => {
    if (!navigator.geolocation) {
      geoData = null;
      renderGeoStatus('Browser tidak mendukung GPS otomatis; isi <strong>Patokan Lokasi</strong> atau lanjutkan dengan konfirmasi kurir.');
      return notify("GPS otomatis tidak tersedia; gunakan patokan lokasi.");
    }
    if (shareBtn) { shareBtn.disabled = true; shareBtn.textContent = "Mencari GPS..."; }
    renderGeoStatus("Mengambil titik koordinat pemesan...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (shareBtn) { shareBtn.disabled = false; shareBtn.textContent = "Bagikan Lokasi"; }
        geoData = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          acc: Number(pos.coords.accuracy || 0)
        };
        const mapUrl = `https://www.google.com/maps?q=${geoData.lat},${geoData.lng}`;
        renderGeoStatus(
          `Geotag aktif: <strong>${geoData.lat}, ${geoData.lng}</strong> (±${Math.round(geoData.acc)}m) · <a href="${mapUrl}" target="_blank" rel="noopener" style="color:#5eead4;text-decoration:underline;">Cek Peta</a>`
        );
        notify("Titik geotag pemesan berhasil dikunci.");
      },
      (err) => {
        if (shareBtn) { shareBtn.disabled = false; shareBtn.textContent = "Bagikan Lokasi"; }
        geoData = null;
        const reason = err && err.code === 1
          ? "Izin lokasi ditolak."
          : "Sinyal GPS belum terbaca.";
        renderGeoStatus(`${reason} Anda tetap bisa mengisi patokan lokasi atau melanjutkan pemesanan.`);
        notify(reason + " Titik jemput bisa dikonfirmasi saat penjemputan.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });

  document.getElementById("fsBtnSubmitOrder")?.addEventListener("click", () => {
    const zone = zoneSel?.value?.trim() || "";
    const weight = parseFloat(weightInp?.value || "0");
    const landmark = landmarkInp?.value?.trim() || "";
    if (!zone) {
      zoneSel?.focus();
      return notify("Silakan pilih kecamatan Zona 1 terlebih dahulu.");
    }
    if (!weight || weight <= 0) {
      weightInp?.focus();
      return notify("Masukkan estimasi berat pakaian (minimal 0.5 kg).");
    }
    const seq = String(orders.length + 1).padStart(3, "0");
    orders.unshift({
      code: `ASAS-Z1-${seq}`,
      zone,
      weight,
      geo: geoData,
      geoLabel: geoData ? `${geoData.lat}, ${geoData.lng}` : "Konfirmasi Kurir Zona 1",
      landmark
    });
    renderOrders();
    if (weightInp) weightInp.value = "";
    if (landmarkInp) landmarkInp.value = "";
    geoData = null;
    renderGeoStatus("");
    goEl(orderSec, "orders");
    notify(`Pesanan ASAS-Z1-${seq} (${zone}) tersimpan dengan info geotag.`);
  });

  document.addEventListener("click", (e) => {
    const act = e.target.closest("[data-action]")?.dataset.action;
    if (act === "open-booking") return openBooking();
    if (act === "go-orders") {
      goEl(orderSec, "orders");
      return notify("Menampilkan daftar Order Saya.");
    }
    if (e.target.closest(".fs-card.is-active")) return openBooking();
    const dis = e.target.closest(".fs-card.is-disabled");
    if (dis) {
      const label = dis.querySelector("strong")?.textContent?.trim() || "Layanan ini";
      return notify(`${label} belum tersedia pada pilot Zona 1.`);
    }
    const nb = e.target.closest(".fs-nav button[data-nav]");
    if (nb) {
      const k = nb.dataset.nav;
      setNav(k);
      if (k === "home") window.scrollTo({ top: 0, behavior: "smooth" });
      else if (k === "services") goEl(document.getElementById("sec-layanan"), "services");
      else if (k === "orders") goEl(orderSec, "orders");
      else if (k === "help") notify("Pilot Zona 1 · Satu Hub: berat timbangan & billing final diverifikasi di hub.");
    }
  });
})();
</script>
"""

start_idx = s.rfind("<script>")
end_idx = s.rfind("</script>")
if start_idx != -1 and end_idx != -1:
    s = s[:start_idx] + geo_js.strip() + s[end_idx + len("</script>"):]
else:
    s = s.replace("</body>", geo_js.strip() + "\n</body>", 1)

p.write_text(s, encoding="utf-8")
print("GEOTAG_ADDED_OK")
