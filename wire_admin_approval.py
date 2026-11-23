from pathlib import Path

p = Path("admin-facility.js")
s = p.read_text(encoding="utf-8")

old_imp = """  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp"""

new_imp = """  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp"""

if "where," not in s and old_imp in s:
    s = s.replace(old_imp, new_imp, 1)

approval_js = """
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
"""

old_vis = """    const isSuper = Boolean(data && data.active === true && data.role === "SUPER_ADMIN");
    regBox.style.display = isSuper ? "block" : "none";
  } catch (_) {
    regBox.style.display = "none";
  }"""

new_vis = """    const isSuper = Boolean(data && data.active === true && data.role === "SUPER_ADMIN");
    regBox.style.display = isSuper ? "block" : "none";
    subscribePendingAdmins(isSuper);
  } catch (_) {
    regBox.style.display = "none";
    subscribePendingAdmins(false);
  }"""

old_anon = """  if (!user || user.isAnonymous) {
    regBox.style.display = "none";
    return;
  }"""

new_anon = """  if (!user || user.isAnonymous) {
    regBox.style.display = "none";
    subscribePendingAdmins(false);
    return;
  }"""

if "subscribePendingAdmins" not in s and "async function refreshSuperAdminVisibility(user)" in s:
    s = s.replace("async function refreshSuperAdminVisibility(user) {", approval_js.strip() + "\n\nasync function refreshSuperAdminVisibility(user) {", 1)
    s = s.replace(old_anon, new_anon, 1)
    s = s.replace(old_vis, new_vis, 1)
    p.write_text(s, encoding="utf-8")
    print("APPROVAL_JS_OK")
else:
    print("SKIPPED_APPROVAL_JS")
