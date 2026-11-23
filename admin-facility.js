import {
  auth,
  db,
  loginHubAdmin,
  logoutHubSession,
  onAuthStateChanged
} from "./firebase-config.js";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
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

const regBox = document.getElementById("superAdminRegBox");
const regForm = document.getElementById("superAdminRegForm");
const btnToggleReg = document.getElementById("btnToggleRegForm");
const btnSaveAdmin = document.getElementById("btnSaveHubAdmin");
const regStatus = document.getElementById("regAdminStatus");

btnToggleReg?.addEventListener("click", () => {
  if (!regForm || !btnToggleReg) return;
  const open = regForm.style.display === "none";
  regForm.style.display = open ? "block" : "none";
  btnToggleReg.textContent = open ? "Tutup Form" : "Buka Form";
});

btnSaveAdmin?.addEventListener("click", async () => {
  const uid = (document.getElementById("regAdminUid")?.value || "").trim();
  const email = (document.getElementById("regAdminEmail")?.value || "").trim();
  const name = (document.getElementById("regAdminName")?.value || "").trim();
  const role = document.getElementById("regAdminRole")?.value || "HUB_ADMIN";

  if (!uid || !email || !name) {
    if (regStatus) regStatus.innerHTML = '<span style="color:#fca5a5;">Lengkapi UID, Email, dan Nama operator terlebih dahulu.</span>';
    return;
  }

  btnSaveAdmin.disabled = true;
  btnSaveAdmin.textContent = "Menyimpan...";
  try {
    await setDoc(doc(db, "hubAdmins", uid), {
      uid,
      email,
      name,
      role,
      active: true,
      zoneScope: ["Pandeglang", "Majasari", "Karang Tanjung", "Cadasari", "Kaduhejo", "Koroncong"],
      assignedByUid: auth.currentUser?.uid || "",
      assignedByHandle: "deskawps",
      updatedAt: serverTimestamp()
    }, { merge: true });
    if (regStatus) regStatus.innerHTML = `<span style="color:#5eead4;">Akses ${esc(role)} untuk <strong>${esc(name)}</strong> (${esc(uid)}) tersimpan.</span>`;
    document.getElementById("regAdminUid").value = "";
    document.getElementById("regAdminEmail").value = "";
    document.getElementById("regAdminName").value = "";
  } catch (err) {
    console.error("Save hub admin error:", err);
    if (regStatus) regStatus.innerHTML = '<span style="color:#fca5a5;">Gagal menyimpan admin. Pastikan akun Anda berstatus SUPER_ADMIN di Firestore Rules.</span>';
  } finally {
    btnSaveAdmin.disabled = false;
    btnSaveAdmin.textContent = "Simpan Akses Admin Satu Hub";
  }
});

const approvalBox = document.getElementById("superAdminApprovalBox");
const pendingListEl = document.getElementById("pendingAdminList");
let unsubRequests = null;

function subscribePendingAdmins(isSuper) {
  if (unsubRequests) {
    unsubRequests();
    unsubRequests = null;
  }
  if (!approvalBox || !pendingListEl) return;
  if (!isSuper) {
    approvalBox.style.display = "none";
    pendingListEl.innerHTML = "";
    return;
  }
  approvalBox.style.display = "block";
  const rq = query(
    collection(db, "adminRequests"),
    where("status", "==", "PENDING_APPROVAL")
  );
  unsubRequests = onSnapshot(rq, (snap) => {
    if (!snap.docs.length) {
      pendingListEl.innerHTML = '<p class="meta" style="margin:0;">Tidak ada pengajuan admin yang menunggu persetujuan.</p>';
      return;
    }
    pendingListEl.innerHTML = snap.docs.map((dSnap) => {
      const id = dSnap.id;
      const r = dSnap.data();
      const targetUid = (r.uid || id || "").trim();
      return `
        <div style="padding:10px;border-radius:12px;background:#07192f;border:1px solid #1e3a5f;margin-bottom:8px;">
          <div class="meta">
            Nama: <strong>${esc(r.name || "-")}</strong> · Email: <strong>${esc(r.email || "-")}</strong><br>
            UID Target: <strong>${esc(targetUid || "-")}</strong>
          </div>
          <div style="margin-top:8px;display:flex;gap:8px;">
            <button type="button" class="btn-save" style="padding:8px 12px;" data-approve-req="${esc(id)}" data-target-uid="${esc(targetUid)}" data-req-email="${esc(r.email || "")}" data-req-name="${esc(r.name || "")}">Approve Admin</button>
            <button type="button" style="padding:8px 12px;border-radius:999px;border:1px solid #475569;background:#1e293b;color:#f8fafc;font-weight:700;font-size:12px;cursor:pointer;" data-reject-req="${esc(id)}">Tolak</button>
          </div>
        </div>
      `;
    }).join("");
  }, (err) => {
    console.error("Pending admin read error:", err);
    pendingListEl.innerHTML = '<p class="meta" style="margin:0;color:#fca5a5;">Gagal memuat antrean approval admin.</p>';
  });
}

pendingListEl?.addEventListener("click", async (e) => {
  const approveBtn = e.target.closest("[data-approve-req]");
  const rejectBtn = e.target.closest("[data-reject-req]");

  if (approveBtn) {
    const reqId = approveBtn.dataset.approveReq;
    const targetUid = (approveBtn.dataset.targetUid || "").trim();
    const email = (approveBtn.dataset.reqEmail || "").trim();
    const name = (approveBtn.dataset.reqName || "").trim();
    if (!targetUid) {
      alert("UID calon admin belum diisi pada pengajuan ini.");
      return;
    }
    approveBtn.disabled = true;
    approveBtn.textContent = "Menyetujui...";
    try {
      await setDoc(doc(db, "hubAdmins", targetUid), {
        uid: targetUid,
        email,
        name,
        role: "HUB_ADMIN",
        active: true,
        zoneScope: ["Pandeglang", "Majasari", "Karang Tanjung", "Cadasari", "Kaduhejo", "Koroncong"],
        approvedByUid: auth.currentUser?.uid || "",
        approvedByHandle: "deskawps",
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      await updateDoc(doc(db, "adminRequests", reqId), {
        status: "APPROVED",
        approved: true,
        approvedByUid: auth.currentUser?.uid || "",
        approvedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Approve admin error:", err);
      alert("Gagal menyetujui admin. Pastikan hak SUPER_ADMIN aktif.");
      approveBtn.disabled = false;
      approveBtn.textContent = "Approve Admin";
    }
    return;
  }

  if (rejectBtn) {
    const reqId = rejectBtn.dataset.rejectReq;
    rejectBtn.disabled = true;
    try {
      await updateDoc(doc(db, "adminRequests", reqId), {
        status: "REJECTED",
        approved: false,
        reviewedByUid: auth.currentUser?.uid || "",
        reviewedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Reject admin error:", err);
      rejectBtn.disabled = false;
    }
  }
});

async function refreshSuperAdminVisibility(user) {
  if (!regBox) return;
  if (!user || user.isAnonymous) {
    regBox.style.display = "none";
    subscribePendingAdmins(false);
    return;
  }
  try {
    const snap = await getDoc(doc(db, "hubAdmins", user.uid));
    const data = snap.exists() ? snap.data() : null;
    const isSuper = Boolean(data && data.active === true && data.role === "SUPER_ADMIN");
    regBox.style.display = isSuper ? "block" : "none";
    subscribePendingAdmins(isSuper);
  } catch (_) {
    regBox.style.display = "none";
    subscribePendingAdmins(false);
  }
}

onAuthStateChanged(auth, async (user) => {
  await refreshSuperAdminVisibility(user);
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
