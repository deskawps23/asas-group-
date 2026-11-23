from pathlib import Path

admin_js = """import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = window.__FIREBASE_CONFIG__ || {
  apiKey: "ISI_API_KEY",
  authDomain: "ISI_AUTH_DOMAIN",
  projectId: "ISI_PROJECT_ID",
  storageBucket: "ISI_STORAGE_BUCKET",
  messagingSenderId: "ISI_SENDER_ID",
  appId: "ISI_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const listEl = document.getElementById("adminOrderList");
const zoneFilter = document.getElementById("filterZone");
const statusFilter = document.getElementById("filterStatus");

let latestDocs = [];

const esc = (v = "") => String(v)
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;").replaceAll('"', "&quot;");

function render() {
  if (!listEl) return;
  const zVal = zoneFilter?.value || "";
  const sVal = statusFilter?.value || "";
  const items = latestDocs.filter((snap) => {
    const d = snap.data();
    if (zVal && d.zone !== zVal) return false;
    if (sVal && d.status !== sVal) return false;
    return true;
  });

  if (!items.length) {
    listEl.innerHTML = '<div class="box"><p class="meta" style="margin:0;">Tidak ada order yang cocok dengan filter saat ini.</p></div>';
    return;
  }

  listEl.innerHTML = items.map((snap) => {
    const id = snap.id;
    const d = snap.data();
    const hasGeo = d.geo && typeof d.geo.lat === "number" && typeof d.geo.lng === "number";
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
          ${["PENDING_PICKUP","PICKUP_IN_PROGRESS","AT_HUB_VERIFICATION","IRONING_IN_PROGRESS","DELIVERING","COMPLETED","CANCELLED"]
            .map((st) => `<option value="${st}" ${d.status === st ? "selected" : ""}>${st}</option>`).join("")}
        </select>
        <label>Catatan Verifikasi Hub</label>
        <input type="text" class="inp-note" value="${esc(d.hubNote || "")}" placeholder="Catatan timbangan / pengantaran" />
        <button type="button" class="btn-save" data-save-id="${esc(id)}">Simpan Verifikasi Hub</button>
      </div>
    `;
  }).join("");
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
    setTimeout(() => { btn.textContent = "Simpan Verifikasi Hub"; btn.disabled = false; }, 1200);
  } catch (err) {
    console.error("Admin update error:", err);
    alert("Gagal memperbarui order. Pastikan akun login memiliki hak admin/operator Satu Hub.");
    btn.textContent = "Simpan Verifikasi Hub";
    btn.disabled = false;
  }
});

zoneFilter?.addEventListener("change", render);
statusFilter?.addEventListener("change", render);

onAuthStateChanged(auth, (user) => {
  if (!user) {
    if (listEl) listEl.innerHTML = '<div class="box"><p class="meta" style="margin:0;">Silakan login akun admin/operator terlebih dahulu.</p></div>';
    return;
  }
  const q = query(collection(db, "serviceOrders"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snap) => {
    latestDocs = snap.docs;
    render();
  }, (err) => {
    console.error("Admin read error:", err);
    if (listEl) listEl.innerHTML = '<div class="box"><p class="meta" style="margin:0;color:#fca5a5;">Akses ditolak oleh Firestore Rules (bukan admin/operator).</p></div>';
  });
});
"""

Path("admin-facility.js").write_text(admin_js.strip() + "\n", encoding="utf-8")
print("ADMIN_JS_OK")
