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
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const loginBox = document.getElementById("saLoginBox");
const loginErr = document.getElementById("saLoginError");
const dashboard = document.getElementById("saDashboard");
const sessionInfo = document.getElementById("saSessionInfo");

const kpiOfficers = document.getElementById("kpiOfficers");
const kpiPending = document.getElementById("kpiPending");
const kpiLines = document.getElementById("kpiLines");

const pendingList = document.getElementById("saPendingList");
const officerList = document.getElementById("saOfficerList");
const adminMsg = document.getElementById("saAdminMsg");

let unsubs = [];

const esc = (v = "") =>
  String(v)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

function clearSubs() {
  unsubs.forEach((fn) => {
    try { fn(); } catch (_) {}
  });
  unsubs = [];
}

document.getElementById("btnSaLogin")?.addEventListener("click", async () => {
  const email = (document.getElementById("saEmail")?.value || "").trim();
  const pass = document.getElementById("saPassword")?.value || "";
  if (loginErr) loginErr.textContent = "";
  if (!email || !pass) {
    if (loginErr) loginErr.textContent = "Masukkan email dan kata sandi Super Admin.";
    return;
  }
  try {
    await loginHubAdmin(email, pass);
  } catch (err) {
    console.error("Super admin login error:", err);
    if (loginErr) loginErr.textContent = "Login gagal. Periksa kredensial Firebase Auth.";
  }
});

document.getElementById("btnSaLogout")?.addEventListener("click", () => {
  clearSubs();
  logoutHubSession();
});

document.getElementById("btnSaSaveOfficer")?.addEventListener("click", async () => {
  const uid = (document.getElementById("saTargetUid")?.value || "").trim();
  const email = (document.getElementById("saTargetEmail")?.value || "").trim();
  const name = (document.getElementById("saTargetName")?.value || "").trim();
  const lineRole = document.getElementById("saTargetLine")?.value || "CEO";
  const division = (document.getElementById("saTargetDivision")?.value || "ASAS Global World").trim();

  if (!uid || !email || !name) {
    if (adminMsg) adminMsg.innerHTML = '<span style="color:#fca5a5;">Lengkapi UID, Email, dan Nama lengkap.</span>';
    return;
  }

  const accessRole = lineRole === "SUPER_ADMIN" ? "SUPER_ADMIN" : "EXEC_OFFICER";

  try {
    await setDoc(doc(db, "hubAdmins", uid), {
      uid,
      email,
      name,
      role: accessRole,
      corporateLine: lineRole,
      division,
      enterprise: "ASAS Global World",
      active: true,
      assignedByUid: auth.currentUser?.uid || "",
      assignedByHandle: "deskawps",
      updatedAt: serverTimestamp()
    }, { merge: true });

    if (adminMsg) {
      adminMsg.innerHTML = `<span style="color:#5eead4;">Lini <strong>${esc(lineRole)}</strong> (${esc(division)}) untuk <strong>${esc(name)}</strong> aktif.</span>`;
    }
    document.getElementById("saTargetUid").value = "";
    document.getElementById("saTargetEmail").value = "";
    document.getElementById("saTargetName").value = "";
  } catch (err) {
    console.error("Save officer error:", err);
    if (adminMsg) adminMsg.innerHTML = '<span style="color:#fca5a5;">Gagal menyimpan. Pastikan hak SUPER_ADMIN &amp; Firestore Rules aktif.</span>';
  }
});

pendingList?.addEventListener("click", async (e) => {
  const appBtn = e.target.closest("[data-approve]");
  const rejBtn = e.target.closest("[data-reject]");
  if (appBtn) {
    const reqId = appBtn.dataset.approve;
    const targetUid = (appBtn.dataset.uid || "").trim();
    const email = (appBtn.dataset.email || "").trim();
    const name = (appBtn.dataset.name || "").trim();
    const lineRole = (appBtn.dataset.line || "UNIT_HEAD").trim();
    const division = (appBtn.dataset.division || "ASAS Global World").trim();
    if (!targetUid) return alert("UID calon pejabat/admin kosong.");
    appBtn.disabled = true;
    try {
      await setDoc(doc(db, "hubAdmins", targetUid), {
        uid: targetUid,
        email,
        name,
        role: lineRole === "SUPER_ADMIN" ? "SUPER_ADMIN" : "EXEC_OFFICER",
        corporateLine: lineRole,
        division,
        enterprise: "ASAS Global World",
        active: true,
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
      console.error("Approve officer error:", err);
      alert("Gagal menyetujui pengajuan.");
      appBtn.disabled = false;
    }
  } else if (rejBtn) {
    const reqId = rejBtn.dataset.reject;
    rejBtn.disabled = true;
    try {
      await updateDoc(doc(db, "adminRequests", reqId), {
        status: "REJECTED",
        approved: false,
        reviewedByUid: auth.currentUser?.uid || "",
        reviewedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Reject officer error:", err);
      rejBtn.disabled = false;
    }
  }
});

officerList?.addEventListener("click", async (e) => {
  const toggleBtn = e.target.closest("[data-toggle-officer]");
  if (!toggleBtn) return;
  const uid = toggleBtn.dataset.toggleOfficer;
  const nextActive = toggleBtn.dataset.nextActive === "true";
  toggleBtn.disabled = true;
  try {
    await updateDoc(doc(db, "hubAdmins", uid), {
      active: nextActive,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Toggle officer active error:", err);
    alert("Gagal memperbarui status aktif.");
    toggleBtn.disabled = false;
  }
});

function startGlobalSuperAdminStreams(user) {
  clearSubs();
  if (sessionInfo) sessionInfo.textContent = `${user.email || user.uid} - UID: ${user.uid}`;

  unsubs.push(
    onSnapshot(
      query(collection(db, "adminRequests"), where("status", "==", "PENDING_APPROVAL")),
      (snap) => {
        if (kpiPending) kpiPending.textContent = String(snap.size);
        if (!pendingList) return;
        if (!snap.docs.length) {
          pendingList.innerHTML = '<p class="meta">Tidak ada antrean approval jabatan baru.</p>';
          return;
        }
        pendingList.innerHTML = snap.docs.map((d) => {
          const r = d.data();
          const uid = r.uid || d.id;
          const line = r.corporateLine || r.requestedRole || "UNIT_HEAD";
          const divName = r.division || "ASAS Global World";
          return `
            <div class="item">
              <div class="meta">
                <strong>${esc(r.name || "-")}</strong> - Lini: <strong>${esc(line)}</strong> - Divisi: <strong>${esc(divName)}</strong><br>
                Email: ${esc(r.email || "-")} - UID: <strong>${esc(uid)}</strong>
              </div>
              <div class="row-actions">
                <button type="button" class="btn-sm btn-approve" data-approve="${esc(d.id)}" data-uid="${esc(uid)}" data-email="${esc(r.email || "")}" data-name="${esc(r.name || "")}" data-line="${esc(line)}" data-division="${esc(divName)}">Approve Jabatan</button>
                <button type="button" class="btn-sm btn-danger" data-reject="${esc(d.id)}">Tolak</button>
              </div>
            </div>
          `;
        }).join("");
      }
    )
  );

  unsubs.push(
    onSnapshot(collection(db, "hubAdmins"), (snap) => {
      const activeDocs = snap.docs.filter((d) => d.data().active === true);
      const uniqueLines = new Set(
        activeDocs.map((d) => d.data().corporateLine || d.data().role).filter(Boolean)
      );
      if (kpiOfficers) kpiOfficers.textContent = String(activeDocs.length);
      if (kpiLines) kpiLines.textContent = String(uniqueLines.size);
      if (!officerList) return;
      if (!snap.docs.length) {
        officerList.innerHTML = '<p class="meta">Belum ada lini pejabat/admin yang ditetapkan.</p>';
        return;
      }
      officerList.innerHTML = snap.docs.map((d) => {
        const a = d.data();
        const isActive = a.active === true;
        const lineLabel = a.corporateLine || a.role || "UNIT_HEAD";
        const divLabel = a.division || a.enterprise || "ASAS Global World";
        return `
          <div class="item">
            <div class="meta">
              <strong>${esc(a.name || d.id)}</strong> - <strong>${esc(lineLabel)}</strong> - ${esc(divLabel)} - Status: <strong>${isActive ? "AKTIF" : "NONAKTIF"}</strong><br>
              Email: ${esc(a.email || "-")} - UID: ${esc(d.id)}
            </div>
            <div class="row-actions">
              <button type="button" class="btn-sm" data-toggle-officer="${esc(d.id)}" data-next-active="${!isActive}">${isActive ? "Nonaktifkan" : "Aktifkan"}</button>
            </div>
          </div>
        `;
      }).join("");
    })
  );
}

onAuthStateChanged(auth, async (user) => {
  clearSubs();
  if (!user || user.isAnonymous) {
    if (dashboard) dashboard.style.display = "none";
    if (loginBox) loginBox.style.display = "block";
    return;
  }

  try {
    const snap = await getDoc(doc(db, "hubAdmins", user.uid));
    const data = snap.exists() ? snap.data() : null;
    if (data && data.active === true && data.role === "SUPER_ADMIN") {
      if (loginBox) loginBox.style.display = "none";
      if (dashboard) dashboard.style.display = "block";
      startGlobalSuperAdminStreams(user);
    } else {
      if (dashboard) dashboard.style.display = "none";
      if (loginBox) loginBox.style.display = "block";
      if (loginErr) loginErr.textContent = "Akun ini bukan SUPER_ADMIN aktif di ASAS Global World.";
    }
  } catch (err) {
    console.error("Super admin check error:", err);
    if (dashboard) dashboard.style.display = "none";
    if (loginBox) loginBox.style.display = "block";
    if (loginErr) loginErr.textContent = "Gagal memverifikasi akses SUPER_ADMIN.";
  }
});
