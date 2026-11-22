(() => {
  const bookingPanel = document.querySelector("#booking-panel");
  const bookingTitle = document.querySelector("#booking-title");
  const bookingStage = document.querySelector("#booking-stage");

  const services = {
    ironing: "Jasa Setrika"
  };

  const activeServiceConfig = {
    serviceCategory: "LAUNDRY_GARMENT_CARE",
    serviceType: "IRONING",
    orderMode: "ONE_TIME",
    engagementType: "SAM_NON_CONTRACT",
    fulfillmentMode: "PICKUP_DELIVERY",
    marketArea: "PANDEGLANG",
    serviceZone: "ZONE_1"
  };

  import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged, getIdTokenResult } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp , addDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig } from "./portal/portal/firebase-auth.js";

const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
let unsubscribeOrders = null;

function ensureAdminOrdersContainer() {
  const section = document.getElementById("orders");
  if (!section) return null;
  let wrap = document.getElementById("admin-ironing-orders");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.id = "admin-ironing-orders";
    wrap.hidden = true;
    section.appendChild(wrap);
  }
  return wrap;
}

const ZONA_1_PANDEGLANG_KECAMATAN = [
  "pandeglang",
  "majasari",
  "karangtanjung",
  "cadasari",
  "koroncong",
  "kaduhejo"
];

function isIroningPilotZona1(item) {
  const isIroning = String(item.serviceType || "").toUpperCase() === "IRONING";
  if (!isIroning) return false;
  const rawKec = String(
    item.kecamatan || item.subdistrict || item.district || item.area || ""
  ).trim().toLowerCase();
  if (rawKec) {
    return ZONA_1_PANDEGLANG_KECAMATAN.some((k) => rawKec.includes(k));
  }
  const zone = String(item.serviceZone || "").toUpperCase();
  const market = String(item.marketArea || "").toUpperCase();
  return zone === "ZONE_1" && (!market || market === "PANDEGLANG");
}

async function handleOrderDecision(orderId, nextStatus) {
  if (!["APPROVED", "CANCELLED"].includes(nextStatus)) return;
  try {
    await updateDoc(doc(db, "serviceOrders", orderId), {
      status: nextStatus,
      reviewedAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Gagal memperbarui status order:", err);
    alert("Gagal memperbarui status order: " + (err && err.message ? err.message : err));
  }
}

function renderRequestedOrders(wrap, snap) {
  const emptyState = document.getElementById("orders-state");
  const items = [];
  snap.forEach((d) => {
    const data = { id: d.id, ...d.data() };
    if (isIroningPilotZona1(data)) items.push(data);
  });
  if (!items.length) {
    wrap.innerHTML = "<p><strong>Pilot Zona 1 Pandeglang (6 Kec. - Jasa Setrika):</strong> Tidak ada order REQUESTED.</p>";
    if (emptyState) emptyState.hidden = false;
    return;
  }
  if (emptyState) emptyState.hidden = true;
  wrap.innerHTML = items.map((item) => {
    const label = item.serviceName || "Jasa Setrika";
    const kec = item.kecamatan || item.subdistrict || item.district || item.serviceZone || "ZONE_1";
    const owner = item.ownerUid || "-";
    return `<div class="admin-order-card" data-order-id="${item.id}" style="border:1px solid #cbd5e1;border-radius:10px;padding:12px;margin-top:10px;"><div><strong>${label}</strong> (${kec}) — <span class="order-status">${item.status || "REQUESTED"}</span></div><div style="font-size:12px;opacity:.8;">ID: ${item.id} | Owner: ${owner}</div><div style="display:flex;gap:8px;margin-top:8px;"><button type="button" class="btn-approve-order" data-id="${item.id}">Setujui (APPROVED)</button><button type="button" class="btn-cancel-order" data-id="${item.id}">Batalkan (CANCELLED)</button></div></div>`;
  }).join("");
  wrap.querySelectorAll(".btn-approve-order").forEach((btn) => {
    btn.addEventListener("click", () => handleOrderDecision(btn.dataset.id, "APPROVED"));
  });
  wrap.querySelectorAll(".btn-cancel-order").forEach((btn) => {
    btn.addEventListener("click", () => handleOrderDecision(btn.dataset.id, "CANCELLED"));
  });
}

onAuthStateChanged(auth, async (user) => {
  const wrap = ensureAdminOrdersContainer();
  if (unsubscribeOrders) {
    unsubscribeOrders();
    unsubscribeOrders = null;
  }
  if (!user) {
    if (wrap) {
      wrap.hidden = true;
      wrap.innerHTML = "";
    }
    return;
  }
  const tokenResult = await getIdTokenResult(user);
  const isSuperAdmin = Boolean(tokenResult.claims && tokenResult.claims.admin === true);
  if (!isSuperAdmin || !wrap) {
    if (wrap) {
      wrap.hidden = true;
      wrap.innerHTML = "";
    }
    return;
  }
  wrap.hidden = false;
  const q = query(
    collection(db, "serviceOrders"),
    where("serviceType", "==", "IRONING"),
    where("status", "==", "REQUESTED")
  );
  unsubscribeOrders = onSnapshot(q, (snap) => renderRequestedOrders(wrap, snap), (err) => {
    console.error("Gagal memuat serviceOrders:", err);
  });
});

function scrollToSection(id) {
    const target = document.getElementById(id);
    if (!target) return;

    target.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function openBooking(serviceKey = "") {
    if (!bookingPanel || !bookingTitle || !bookingStage) return;

    bookingPanel.hidden = false;

    const serviceName = services[serviceKey];

    bookingTitle.textContent = serviceName
      ? `Pesan ${serviceName}`
      : "Mulai pesanan";

    bookingStage.innerHTML = serviceName
      ? `
        <div class="estimate-card">
          <strong>${serviceName}</strong>
          <p>Pickup &amp; Delivery · Pandeglang Zona 1</p>

          <label class="estimate-label" for="estimated-weight">
            Estimasi berat
          </label>

          <div class="estimate-input-row">
            <input
              id="estimated-weight"
              class="estimate-input"
              type="number"
              inputmode="decimal"
              min="0.1"
              max="100"
              step="0.1"
              value="3"
            >
            <span>kg</span>
          </div>

          <div class="estimate-breakdown">
            <div>
              <span>Berat ditagihkan</span>
              <strong id="billable-weight">3 kg</strong>
            </div>

            <div>
              <span>Jasa Setrika</span>
              <strong id="service-cost">Rp15.000</strong>
            </div>

            <div>
              <span>Antar-jemput</span>
              <strong>Rp5.000</strong>
            </div>

            <div class="estimate-total">
              <span>Estimasi Total</span>
              <strong id="estimated-total">Rp20.000</strong>
            </div>
          </div>
        <div class="estimate-field">
          <label class="estimate-label" for="ironing-district">Kecamatan (Zona 1 Pandeglang)</label>
          <select id="ironing-district" class="estimate-input">
            <option value="">-- Pilih Kecamatan --</option>
            <option value="pandeglang">Pandeglang</option>
            <option value="majasari">Majasari</option>
            <option value="karangtanjung">Karangtanjung</option>
            <option value="cadasari">Cadasari</option>
            <option value="koroncong">Koroncong</option>
            <option value="kaduhejo">Kaduhejo</option>
          </select>
        </div>
        <div class="estimate-field">
          <label class="estimate-label" for="ironing-customer-name">Nama Pelanggan</label>
          <input id="ironing-customer-name" class="estimate-input" type="text" placeholder="Nama lengkap" required />
        </div>
        <div class="estimate-field">
          <label class="estimate-label" for="ironing-customer-phone">No. WhatsApp / Kontak</label>
          <input id="ironing-customer-phone" class="estimate-input" type="tel" placeholder="08xxxxxxxxxx" required />
        </div>
        <div class="estimate-field">
          <label class="estimate-label" for="ironing-pickup-address">Alamat Penjemputan</label>
          <textarea id="ironing-pickup-address" class="estimate-input" rows="2" placeholder="Nama jalan, kampung/kelurahan, patokan" required></textarea>
          <div style="margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;"><button type="button" id="share-ironing-location" class="btn-secondary">Bagikan Lokasi Saya</button><span id="ironing-location-status" style="font-size:0.85rem;">Belum membagikan lokasi (opsional, bisa isi alamat manual).</span></div><div id="ironing-location-preview" style="font-size:0.85rem;margin-top:4px;"></div>
        </div>
        <button type="button" id="submit-ironing-order" class="btn-primary">Ajukan Pesanan Setrika</button>
        <div id="ironing-submit-status" aria-live="polite" style="margin-top:8px;font-size:13px;"></div>


          <p class="estimate-note">
            Minimum 3 kg. Berat pada booking adalah estimasi.
            Tagihan final mengikuti berat terverifikasi di hub.
          </p>
        </div>
      `
      : `
        <p>
          Pilih layanan untuk memulai.
          Booking production belum diaktifkan.
        </p>
      `;

    if (serviceName) {
      const weightInput =
        bookingStage.querySelector("#estimated-weight");

      const billableWeightEl =
        bookingStage.querySelector("#billable-weight");

      const serviceCostEl =
        bookingStage.querySelector("#service-cost");

      const estimatedTotalEl =
        bookingStage.querySelector("#estimated-total");

      const formatRupiah = (value) =>
        new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0
        }).format(value);

      const updateEstimate = () => {
        let requestedWeight =
          Number.parseFloat(weightInput.value);

        if (!Number.isFinite(requestedWeight)) {
          requestedWeight = 3;
        }

        requestedWeight =
          Math.min(Math.max(requestedWeight, 0.1), 100);

        const billableWeight =
          Math.max(requestedWeight, 3);

        const serviceCost =
          billableWeight * 5000;

        const deliveryCost = 5000;
        const total = serviceCost + deliveryCost;

        billableWeightEl.textContent =
          `${billableWeight.toLocaleString("id-ID")} kg`;

        serviceCostEl.textContent =
          formatRupiah(serviceCost);

        estimatedTotalEl.textContent =
          formatRupiah(total);
      };

      weightInput.addEventListener(
        "input",
        updateEstimate
      );

      updateEstimate();
    }

    bookingPanel.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
const ZONA_1_DISTRICTS = [
  "pandeglang",
  "majasari",
  "karangtanjung",
  "cadasari",
  "koroncong",
  "kaduhejo"
];

const submitOrderBtn = bookingStage.querySelector("#submit-ironing-order");
const submitStatusEl = bookingStage.querySelector("#ironing-submit-status");

let ironingLocationData = null;
const shareLocationBtn = bookingStage.querySelector("#share-ironing-location");
const locationStatusEl = bookingStage.querySelector("#ironing-location-status");
const locationPreviewEl = bookingStage.querySelector("#ironing-location-preview");

if (shareLocationBtn) {
  shareLocationBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      if (locationStatusEl) locationStatusEl.textContent = "Perangkat tidak mendukung GPS/Geolocation. Silakan isi alamat manual.";
      return;
    }
    shareLocationBtn.disabled = true;
    shareLocationBtn.textContent = "Mengambil lokasi...";
    if (locationStatusEl) locationStatusEl.textContent = "Mencari titik koordinat perangkat...";

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const acc = Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null;
        const mapsUrl = `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
        ironingLocationData = {
          latitude: lat,
          longitude: lng,
          accuracy: acc,
          mapsUrl,
          capturedAtIso: new Date().toISOString()
        };
        if (locationStatusEl) locationStatusEl.textContent = "Lokasi perangkat berhasil diambil.";
        if (locationPreviewEl) {
          const accText = acc !== null ? ` · ±${acc.toFixed(1)} m` : "";
          locationPreviewEl.innerHTML = `${lat.toFixed(6)}, ${lng.toFixed(6)}${accText} · <a href="${mapsUrl}" target="_blank" rel="noopener">Buka di Maps</a>`;
        }
        shareLocationBtn.disabled = false;
        shareLocationBtn.textContent = "Perbarui Lokasi Saya";
      },
      (err) => {
        shareLocationBtn.disabled = false;
        shareLocationBtn.textContent = "Bagikan Lokasi Saya";
        if (locationStatusEl) {
          locationStatusEl.textContent = `Gagal mengambil lokasi (${err.message || "izin ditolak/timeout"}). Anda tetap bisa mengisi alamat manual.`;
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  });
}

if (submitOrderBtn) {
  submitOrderBtn.addEventListener("click", async () => {
    const districtEl = bookingStage.querySelector("#ironing-district");
    const nameEl = bookingStage.querySelector("#ironing-customer-name");
    const phoneEl = bookingStage.querySelector("#ironing-customer-phone");
    const addressEl = bookingStage.querySelector("#ironing-pickup-address");

    const district = (districtEl?.value || "").trim().toLowerCase();
    const customerName = (nameEl?.value || "").trim();
    const customerPhone = (phoneEl?.value || "").trim();
    const pickupAddress = (addressEl?.value || "").trim();

    if (!ZONA_1_DISTRICTS.includes(district)) {
      if (submitStatusEl) submitStatusEl.textContent = "Pilih kecamatan yang termasuk Zona 1 Pandeglang.";
      return;
    }
    if (!customerName || !customerPhone || !pickupAddress) {
      if (submitStatusEl) submitStatusEl.textContent = "Lengkapi nama, nomor WhatsApp/kontak, dan alamat penjemputan.";
      return;
    }

    let requestedWeight = Number.parseFloat(weightInput?.value);
    if (!Number.isFinite(requestedWeight)) requestedWeight = 3;
    requestedWeight = Math.min(Math.max(requestedWeight, 0.1), 100);

    const billableWeight = Math.max(requestedWeight, 3);
    const serviceCost = billableWeight * 5000;
    const deliveryCost = 5000;
    const estimatedTotal = serviceCost + deliveryCost;

    submitOrderBtn.disabled = true;
    if (submitStatusEl) submitStatusEl.textContent = "Menyimpan pesanan...";

    try {
      const docRef = await addDoc(collection(db, "serviceOrders"), {
        serviceType: "IRONING",
        pickupLocation: ironingLocationData || null,
          status: "REQUESTED",
        zone: "ZONA_1_PANDEGLANG",
        district,
        weightKg: requestedWeight,
        billableWeightKg: billableWeight,
        serviceCost,
        deliveryCost,
        estimatedTotal,
        customerName,
        customerPhone,
        pickupAddress,
        createdAt: serverTimestamp()
      });

      if (submitStatusEl) {
        submitStatusEl.textContent = `Pesanan tersimpan (ID: ${docRef.id}) · Status: REQUESTED · Total: ${formatRupiah(estimatedTotal)}`;
      }
      if (nameEl) nameEl.value = "";
      if (phoneEl) phoneEl.value = "";
      if (addressEl) addressEl.value = "";
    } catch (err) {
      console.error("Gagal menyimpan pesanan IRONING:", err);
      if (submitStatusEl) submitStatusEl.textContent = `Gagal mengirim pesanan: ${err.message || err}`;
    } finally {
      submitOrderBtn.disabled = false;
    }
  });
}

  }

  document.querySelectorAll("[data-service]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-service]").forEach((item) => {
        item.classList.remove("is-selected");
      });

      button.classList.add("is-selected");
      openBooking(button.dataset.service || "");
    });
  });

  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.mode;

      if (mode === "enterprise") {
        scrollToSection("enterprise");
        return;
      }

      openBooking();

      if (bookingStage) {
        bookingStage.innerHTML =
          mode === "scheduled"
            ? `
              <strong>Layanan Terjadwal</strong>
              <p>
                Pilih layanan terlebih dahulu.
                Availability production belum diaktifkan.
              </p>
            `
            : `
              <strong>Pesan Sekarang</strong>
              <p>
                Pilih layanan untuk memulai pesanan tanpa kontrak.
                Booking production belum diaktifkan.
              </p>
            `;
      }
    });
  });

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;

      if (action === "book-now") {
        scrollToSection("services");
      }

      if (action === "orders") {
        scrollToSection("orders");
      }

      if (action === "enterprise") {
        scrollToSection("enterprise");
      }
    });
  });

  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-nav]").forEach((item) => {
        item.classList.remove("is-active");
      });

      button.classList.add("is-active");

      const target = button.dataset.nav;
      if (target) scrollToSection(target);
    });
  });
})();
