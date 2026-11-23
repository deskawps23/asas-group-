from pathlib import Path

p = Path("facility.html")
s = p.read_text(encoding="utf-8")

extra_ui = """
<div id="fsZoneInfo" style="margin:-4px 0 12px;padding:10px 12px;border-radius:12px;background:#07192f;border:1px solid #1e3a5f;font-size:12px;color:#cbd5e1;line-height:1.45;">
  Pilih salah satu dari 6 kecamatan <strong>Zona 1</strong> untuk penjemputan &amp; verifikasi timbangan di <strong>Satu Hub</strong>.
</div>
"""

if 'id="fsZoneInfo"' not in s:
    s = s.replace('<select id="fsZoneSelect" class="fs-input">', '<select id="fsZoneSelect" class="fs-input">', 1)
    s = s.replace(
        '<label class="fs-field-label" for="fsWeightInput">Estimasi Berat (kg)</label>',
        extra_ui + '<label class="fs-field-label" for="fsWeightInput">Estimasi Berat (kg)</label>',
        1
    )

enhanced_script = """
<script>
(() => {
  const toast = document.getElementById("fsToast");
  const orderSec = document.getElementById("sec-order");
  const orderList = document.getElementById("orderListContainer");
  const bookingSec = document.getElementById("sec-booking");
  const zoneSel = document.getElementById("fsZoneSelect");
  const zoneInfo = document.getElementById("fsZoneInfo");
  const weightInp = document.getElementById("fsWeightInput");
  const locStatus = document.getElementById("fsLocStatus");
  const navBtns = document.querySelectorAll(".fs-nav button[data-nav]");
  let toastTimer = null;
  let sharedCoords = null;
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

  function renderOrders() {
    if (!orderList) return;
    if (!orders.length) {
      orderList.innerHTML = '<p style="margin:0;font-size:13.5px;color:#cbd5e1;">Belum ada pesanan aktif. Tekan <strong>Pesan Sekarang</strong> atau pilih kartu <strong>02 Jasa Setrika</strong>.</p>';
      return;
    }
    orderList.innerHTML = orders.map((o) => `
      <div style="padding:12px;border-radius:14px;background:#07192f;border:1px solid #1e3a5f;margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;">
          <strong style="font-size:14px;color:#ffffff;">${o.code} · Jasa Setrika</strong>
          <span style="font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;background:#0f766e;color:#ccfbf1;">Menunggu Jemput</span>
        </div>
        <div style="margin-top:6px;font-size:12.5px;color:#cbd5e1;line-height:1.45;">
          Kecamatan: <strong>${o.zone}</strong> · Est. Berat: <strong>${o.weight} kg</strong>${o.loc ? ` · Lokasi: <strong>${o.loc}</strong>` : ""}<br>
          <span style="color:#94a3b8;">Verifikasi berat aktual &amp; tagihan final dilakukan di Satu Hub.</span>
        </div>
      </div>
    `).join("");
  }

  zoneSel?.addEventListener("change", () => {
    if (!zoneInfo) return;
    const z = zoneSel.value;
    zoneInfo.innerHTML = z && zoneHubNotes[z]
      ? zoneHubNotes[z]
      : 'Pilih salah satu dari 6 kecamatan <strong>Zona 1</strong> untuk penjemputan &amp; verifikasi timbangan di <strong>Satu Hub</strong>.';
  });

  document.getElementById("fsBtnShareLoc")?.addEventListener("click", () => {
    if (!navigator.geolocation) {
      sharedCoords = "Titik manual Zona 1";
      if (locStatus) locStatus.textContent = "Geolocation tidak tersedia di browser ini; dicatat sebagai titik manual Zona 1.";
      return notify("Titik lokasi manual Zona 1 dicatat.");
    }
    if (locStatus) locStatus.textContent = "Mengambil koordinat lokasi...";
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(5);
        const lng = pos.coords.longitude.toFixed(5);
        sharedCoords = `${lat}, ${lng}`;
        if (locStatus) locStatus.textContent = `Lokasi terpasang: ${sharedCoords}`;
        notify("Lokasi penjemputan berhasil dipasang.");
      },
      () => {
        sharedCoords = "Titik disepakati saat jemput";
        if (locStatus) locStatus.textContent = "Izin GPS ditolak/tidak aktif; koordinasi titik jemput mengikuti konfirmasi kurir.";
        notify("Lokasi akan dikonfirmasi saat penjemputan.");
      },
      { timeout: 6000 }
    );
  });

  document.getElementById("fsBtnSubmitOrder")?.addEventListener("click", () => {
    const zone = zoneSel?.value?.trim() || "";
    const weight = parseFloat(weightInp?.value || "0");
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
      loc: sharedCoords
    });
    renderOrders();
    if (weightInp) weightInp.value = "";
    goEl(orderSec, "orders");
    notify(`Pesanan ASAS-Z1-${seq} (${zone}) tercatat untuk verifikasi Satu Hub.`);
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
    s = s[:start_idx] + enhanced_script.strip() + s[end_idx + len("</script>"):]
else:
    s = s.replace("</body>", enhanced_script.strip() + "\n</body>", 1)

p.write_text(s, encoding="utf-8")
print("MENUS_FILLED_OK")
