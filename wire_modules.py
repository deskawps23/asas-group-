from pathlib import Path

facility_js = """import {
  auth,
  db,
  ensureCustomerAuth,
  onAuthStateChanged
} from "./firebase-config.js";
import { buildHubWhatsAppUrl } from "./wa_order_helper.js";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const VALID_ZONES = new Set([
  "Pandeglang",
  "Majasari",
  "Karang Tanjung",
  "Cadasari",
  "Kaduhejo",
  "Koroncong"
]);

const STATUS_LABELS = {
  PENDING_PICKUP: "Menunggu Jemput",
  PICKUP_IN_PROGRESS: "Kurir Menuju Lokasi",
  AT_HUB_VERIFICATION: "Verifikasi Timbangan di Hub",
  IRONING_IN_PROGRESS: "Sedang Disetrika",
  DELIVERING: "Dalam Pengantaran",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan"
};

const toastEl = document.getElementById("fsToast");
const orderSec = document.getElementById("sec-order");
const orderListEl = document.getElementById("orderListContainer");
const bookingSec = document.getElementById("sec-booking");
const zoneSel = document.getElementById("fsZoneSelect");
const weightInp = document.getElementById("fsWeightInput");
const landmarkInp = document.getElementById("fsLandmarkInput");
const locStatusEl = document.getElementById("fsLocStatus");
const shareBtn = document.getElementById("fsBtnShareLoc");
const submitBtn = document.getElementById("fsBtnSubmitOrder");

let toastTimer = null;
let geoPayload = null;
let currentUser = null;
let unsubscribeOrders = null;

function notify(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.hidden = true;
  }, 3400);
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderOrdersSnapshot(docs) {
  if (!orderListEl) return;
  if (!docs.length) {
    orderListEl.innerHTML =
      '<p style="margin:0;font-size:13.5px;color:#cbd5e1;">Belum ada pesanan di Cloud Firestore. Tekan <strong>Pesan Sekarang</strong> untuk membuat order Zona 1.</p>';
    return;
  }

  orderListEl.innerHTML = docs
    .map((docSnap) => {
      const d = docSnap.data();
      const code = d.orderCode || docSnap.id;
      const badge = STATUS_LABELS[d.status] || d.status || "Menunggu Jemput";
      const hasGeo =
        d.geo && typeof d.geo.lat === "number" && typeof d.geo.lng === "number";

      const geoHtml = hasGeo
        ? `Geotag: <strong>${d.geo.lat}, ${d.geo.lng}</strong> (±${Math.round(d.geo.accuracy || 0)}m) · <a href="https://www.google.com/maps?q=${d.geo.lat},${d.geo.lng}" target="_blank" rel="noopener" style="color:#5eead4;">Peta</a>`
        : `Geotag: <strong>Konfirmasi Kurir Zona 1</strong>`;

      const landmarkHtml = d.landmark
        ? `<br>Patokan: <strong>${escapeHtml(d.landmark)}</strong>`
        : "";

      const verifiedHtml =
        typeof d.verifiedWeightKg === "number"
          ? `<br>Timbangan Hub: <strong>${d.verifiedWeightKg} kg</strong>${
              typeof d.finalAmount === "number"
                ? ` · Tagihan Final: <strong>Rp${Number(d.finalAmount).toLocaleString("id-ID")}</strong>`
                : ""
            }`
          : `<br><span style="color:#94a3b8;">Timbangan &amp; billing final diverifikasi di Satu Hub.</span>`;

      const waUrl = buildHubWhatsAppUrl({
        orderCode: code,
        zone: d.zone || "-",
        estimatedWeightKg: d.estimatedWeightKg || 0,
        landmark: d.landmark || "",
        geo: hasGeo ? d.geo : null
      });

      return `
        <div style="padding:12px;border-radius:14px;background:#07192f;border:1px solid #1e3a5f;margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;">
            <strong style="font-size:14px;color:#fff;">${escapeHtml(code)} · Jasa Setrika</strong>
            <span style="font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;background:#0f766e;color:#ccfbf1;">${escapeHtml(badge)}</span>
          </div>
          <div style="margin-top:6px;font-size:12.5px;color:#cbd5e1;line-height:1.5;">
            Kecamatan: <strong>${escapeHtml(d.zone || "-")}</strong> · Est. Berat: <strong>${escapeHtml(d.estimatedWeightKg)} kg</strong><br>
            ${geoHtml}${landmarkHtml}${verifiedHtml}
          </div>
          <div style="margin-top:8px;">
            <a href="${waUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:7px 12px;border-radius:10px;background:#16b981;color:#07192f;font-weight:700;font-size:12px;text-decoration:none;">Kirim Order ke WA (+6285779308809)</a>
          </div>
        </div>
      `;
    })
    .join("");
}

function subscribeUserOrders(uid) {
  if (unsubscribeOrders) {
    unsubscribeOrders();
    unsubscribeOrders = null;
  }
  const q = query(
    collection(db, "serviceOrders"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc")
  );
  unsubscribeOrders = onSnapshot(
    q,
    (snap) => renderOrdersSnapshot(snap.docs),
    (err) => {
      console.error("Firestore read error:", err);
      if (orderListEl) {
        orderListEl.innerHTML =
          '<p style="margin:0;font-size:13px;color:#fca5a5;">Gagal memuat daftar pesanan. Periksa koneksi atau aturan Firestore.</p>';
      }
    }
  );
}

shareBtn?.addEventListener("click", () => {
  if (!navigator.geolocation) {
    geoPayload = null;
    if (locStatusEl) {
      locStatusEl.innerHTML =
        "GPS tidak tersedia; isi <strong>Patokan Lokasi</strong> atau lanjutkan konfirmasi kurir.";
    }
    return notify("GPS otomatis tidak tersedia.");
  }

  shareBtn.disabled = true;
  shareBtn.textContent = "Mencari GPS...";
  if (locStatusEl) locStatusEl.textContent = "Mengambil koordinat pemesan...";

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      shareBtn.disabled = false;
      shareBtn.textContent = "Bagikan Lokasi";
      geoPayload = {
        lat: Number(pos.coords.latitude.toFixed(6)),
        lng: Number(pos.coords.longitude.toFixed(6)),
        accuracy: Number((pos.coords.accuracy || 0).toFixed(1))
      };
      if (locStatusEl) {
        locStatusEl.innerHTML = `Geotag aktif: <strong>${geoPayload.lat}, ${geoPayload.lng}</strong> (±${Math.round(geoPayload.accuracy)}m) · <a href="https://www.google.com/maps?q=${geoPayload.lat},${geoPayload.lng}" target="_blank" rel="noopener" style="color:#5eead4;">Cek Peta</a>`;
      }
      notify("Titik geotag pemesan berhasil dikunci.");
    },
    () => {
      shareBtn.disabled = false;
      shareBtn.textContent = "Bagikan Lokasi";
      geoPayload = null;
      if (locStatusEl) {
        locStatusEl.textContent =
          "Lokasi GPS belum aktif/diizinkan; lanjutkan dengan patokan atau konfirmasi kurir.";
      }
      notify("Lokasi akan dikonfirmasi saat penjemputan.");
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
});

submitBtn?.addEventListener("click", async () => {
  const zone = zoneSel?.value?.trim() || "";
  const estimatedWeightKg = parseFloat(weightInp?.value || "0");
  const landmark = (landmarkInp?.value || "").trim().slice(0, 180);

  if (!VALID_ZONES.has(zone)) {
    zoneSel?.focus();
    return notify("Pilih kecamatan Zona 1 yang valid.");
  }
  if (!Number.isFinite(estimatedWeightKg) || estimatedWeightKg <= 0) {
    weightInp?.focus();
    return notify("Masukkan estimasi berat (minimal 0.5 kg).");
  }
  if (!currentUser) {
    return notify("Sesi pengguna belum siap, silakan tunggu sebentar.");
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Mengirim...";

  try {
    const orderCode = `ASAS-Z1-${String(Date.now()).slice(-4)}`;
    const geoSnapshot = geoPayload ? { ...geoPayload } : null;

    await addDoc(collection(db, "serviceOrders"), {
      orderCode,
      serviceCode: "IRONING",
      zone,
      estimatedWeightKg,
      landmark,
      geo: geoSnapshot,
      status: "PENDING_PICKUP",
      uid: currentUser.uid,
      createdAt: serverTimestamp()
    });

    const waUrl = buildHubWhatsAppUrl({
      orderCode,
      zone,
      estimatedWeightKg,
      landmark,
      geo: geoSnapshot
    });

    if (weightInp) weightInp.value = "";
    if (landmarkInp) landmarkInp.value = "";
    geoPayload = null;
    if (locStatusEl) locStatusEl.textContent = "";

    if (orderSec) {
      const y = orderSec.getBoundingClientRect().top + window.scrollY - 68;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }
    notify(`Pesanan ${orderCode} (${zone}) tersimpan. Membuka WA Satu Hub...`);
    window.open(waUrl, "_blank", "noopener,noreferrer");
  } catch (err) {
    console.error("Firestore create error:", err);
    notify("Gagal mengirim pesanan. Cek konfigurasi Firebase & Firestore Rules.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Kirim Pesanan";
  }
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    subscribeUserOrders(user.uid);
    return;
  }
  try {
    currentUser = await ensureCustomerAuth();
    if (currentUser) subscribeUserOrders(currentUser.uid);
  } catch (err) {
    console.error("Auth error:", err);
    notify("Gagal memulai sesi anonim. Cek Firebase Auth.");
  }
});

if (bookingSec) {
  bookingSec.hidden = false;
}
"""

admin_js = """import {
  auth,
  db,
  loginHubAdmin,
  logoutHubSession,
  onAuthStateChanged
} from "./firebase-config.js";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const listEl = document.getElementById("adminOrderList");
const zoneFilter = document.getElementById("filterZone");
const statusFilter = document.getElementById("filterStatus");

let latestDocs = [];
let unsubOrders = null;

const esc = (v = "") =>
  String(v)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

function renderAuthBox(errorMsg = "") {
  if (!listEl) return;
  listEl.innerHTML = `
    <div class="box" id="hubLoginBox">
      <strong style="display:block;font-size:15px;margin-bottom:6px;">Login Admin / Operator Satu Hub</strong>
      <p class="meta" style="margin:0 0 10px;">Masuk menggunakan akun email/password yang terdaftar sebagai admin/operator Zona 1.</p>
      ${errorMsg ? `<p class="meta" style="margin:0 0 10px;color:#fca5a5;">${esc(errorMsg)}</p>` : ""}
      <label for="hubEmail">Email Admin</label>
      <input id="hubEmail" type="email" placeholder="admin@asas.local" autocomplete="username" />
      <label for="hubPassword">Kata Sandi</label>
      <input id="hubPassword" type="password" placeholder="••••••••" autocomplete="current-password" />
      <button type="button" id="btnHubLogin" class="btn-save">Masuk ke Panel Satu Hub</button>
    </div>
  `;
  document.getElementById("btnHubLogin")?.addEventListener("click", async () => {
    const email = (document.getElementById("hubEmail")?.value || "").trim();
    const pass = document.getElementById("hubPassword")?.value || "";
    if (!email || !pass) {
      renderAuthBox("Isi email dan kata sandi terlebih dahulu.");
      return;
    }
    try {
      await loginHubAdmin(email, pass);
    } catch (err) {
      console.error("Admin login error:", err);
      renderAuthBox("Login gagal. Periksa email/kata sandi atau status akun di Firebase Auth.");
    }
  });
}

function renderOrders() {
  if (!listEl) return;
  const zVal = zoneFilter?.value || "";
  const sVal = statusFilter?.value || "";
  const items = latestDocs.filter((snap) => {
    const d = snap.data();
    if (zVal && d.zone !== zVal) return false;
    if (sVal && d.status !== sVal) return false;
    return true;
  });

  const sessionBar = `
    <div class="box" style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
      <span class="meta">Sesi: <strong>${esc(auth.currentUser?.email || auth.currentUser?.uid || "Aktif")}</strong></span>
      <button type="button" id="btnHubLogout" style="padding:7px 12px;border-radius:999px;border:1px solid #334155;background:#07192f;color:#e2e8f0;font-size:12px;font-weight:700;cursor:pointer;">Keluar</button>
    </div>
  `;

  if (!items.length) {
    listEl.innerHTML =
      sessionBar +
      '<div class="box"><p class="meta" style="margin:0;">Tidak ada order yang cocok dengan filter saat ini.</p></div>';
    document.getElementById("btnHubLogout")?.addEventListener("click", () => logoutHubSession());
    return;
  }

  listEl.innerHTML =
    sessionBar +
    items
      .map((snap) => {
        const id = snap.id;
        const d = snap.data();
        const hasGeo =
          d.geo && typeof d.geo.lat === "number" && typeof d.geo.lng === "number";
        const mapLink = hasGeo
          ? `<a class="btn-link" href="https://www.google.com/maps?q=${d.geo.lat},${d.geo.lng}" target="_blank" rel="noopener">Buka Geotag (${d.geo.lat}, ${d.geo.lng})</a>`
          : `<span class="meta">Geotag: Konfirmasi kurir</span>`;

        return `
          <div class="box" data-order-id="${esc(id)}">
            <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:6px;">
              <strong style="font-size:15px;">${esc(d.orderCode || id)} · ${esc(d.zone || "-")}</strong>
              <span style="font-size:11px;font-weight:800;padding:3px 9px;border-radius:999px;background:#0f766e;color:#ccfbf1;">${esc(d.status || "PENDING_PICKUP")}</span>
            </div>
            <div class="meta">
              Estimasi Awal: <strong>${esc(d.estimatedWeightKg)} kg</strong> · Patokan: <strong>${esc(d.landmark || "-")}</strong><br>
              ${mapLink}
            </div>
            <div class="row2" style="margin-top:12px;">
              <div>
                <label>Berat Aktual Hub (kg)</label>
                <input type="number" step="0.1" min="0" class="inp-weight" value="${d.verifiedWeightKg ?? ""}" placeholder="cth: 3.5" />
              </div>
              <div>
                <label>Tagihan Final (Rp)</label>
                <input type="number" step="500" min="0" class="inp-amount" value="${d.finalAmount ?? ""}" placeholder="cth: 17500" />
              </div>
            </div>
            <label>Status Operasional Satu Hub</label>
            <select class="inp-status">
              ${[
                "PENDING_PICKUP",
                "PICKUP_IN_PROGRESS",
                "AT_HUB_VERIFICATION",
                "IRONING_IN_PROGRESS",
                "DELIVERING",
                "COMPLETED",
                "CANCELLED"
              ]
                .map(
                  (st) =>
                    `<option value="${st}" ${d.status === st ? "selected" : ""}>${st}</option>`
                )
                .join("")}
            </select>
            <label>Catatan Verifikasi Hub</label>
            <input type="text" class="inp-note" value="${esc(d.hubNote || "")}" placeholder="Catatan timbangan / pengantaran" />
            <button type="button" class="btn-save" data-save-id="${esc(id)}">Simpan Verifikasi Hub</button>
          </div>
        `;
      })
      .join("");

  document.getElementById("btnHubLogout")?.addEventListener("click", () => logoutHubSession());
}

listEl?.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-save-id]");
  if (!btn) return;
  const orderId = btn.dataset.saveId;
  const card = btn.closest("[data-order-id]");
  if (!card) return;

  const wRaw = parseFloat(card.querySelector(".inp-weight")?.value ?? "");
  const aRaw = parseFloat(card.querySelector(".inp-amount")?.value ?? "");
  const status = card.querySelector(".inp-status")?.value || "PENDING_PICKUP";
  const hubNote = (card.querySelector(".inp-note")?.value || "").trim().slice(0, 240);

  const payload = { status, hubNote, updatedAt: serverTimestamp() };
  if (Number.isFinite(wRaw) && wRaw > 0) payload.verifiedWeightKg = wRaw;
  if (Number.isFinite(aRaw) && aRaw >= 0) payload.finalAmount = aRaw;

  btn.disabled = true;
  btn.textContent = "Menyimpan...";
  try {
    await updateDoc(doc(db, "serviceOrders", orderId), payload);
    btn.textContent = "Tersimpan!";
    setTimeout(() => {
      btn.textContent = "Simpan Verifikasi Hub";
      btn.disabled = false;
    }, 1200);
  } catch (err) {
    console.error("Admin update error:", err);
    alert("Gagal memperbarui order. Pastikan akun login memiliki hak admin/operator Satu Hub.");
    btn.textContent = "Simpan Verifikasi Hub";
    btn.disabled = false;
  }
});

zoneFilter?.addEventListener("change", renderOrders);
statusFilter?.addEventListener("change", renderOrders);

onAuthStateChanged(auth, (user) => {
  if (unsubOrders) {
    unsubOrders();
    unsubOrders = null;
  }
  if (!user || user.isAnonymous) {
    latestDocs = [];
    renderAuthBox();
    return;
  }
  const q = query(collection(db, "serviceOrders"), orderBy("createdAt", "desc"));
  unsubOrders = onSnapshot(
    q,
    (snap) => {
      latestDocs = snap.docs;
      renderOrders();
    },
    (err) => {
      console.error("Admin read error:", err);
      if (listEl) {
        listEl.innerHTML =
          '<div class="box"><p class="meta" style="margin:0;color:#fca5a5;">Akses ditolak oleh Firestore Rules (bukan admin/operator).</p></div>';
      }
    }
  );
});
"""

Path("facility.js").write_text(facility_js.strip() + "\n", encoding="utf-8")
Path("admin-facility.js").write_text(admin_js.strip() + "\n", encoding="utf-8")
print("MODULES_WIRED_OK")
