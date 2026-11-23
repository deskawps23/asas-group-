from pathlib import Path

p = Path("admin-facility.js")
s = p.read_text(encoding="utf-8")

imports_old = """import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";"""

imports_new = """import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";"""

if imports_old in s:
    s = s.replace(imports_old, imports_new, 1)

reg_logic = """
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

async function refreshSuperAdminVisibility(user) {
  if (!regBox) return;
  if (!user || user.isAnonymous) {
    regBox.style.display = "none";
    return;
  }
  try {
    const snap = await getDoc(doc(db, "hubAdmins", user.uid));
    const data = snap.exists() ? snap.data() : null;
    const isSuper = Boolean(data && data.active === true && data.role === "SUPER_ADMIN");
    regBox.style.display = isSuper ? "block" : "none";
  } catch (_) {
    regBox.style.display = "none";
  }
}
"""

auth_hook_old = """onAuthStateChanged(auth, (user) => {"""
auth_hook_new = """onAuthStateChanged(auth, async (user) => {
  await refreshSuperAdminVisibility(user);"""

if "refreshSuperAdminVisibility" not in s and auth_hook_old in s:
    s = s.replace("onAuthStateChanged(auth, (user) => {", reg_logic.strip() + "\n\n" + auth_hook_new, 1)
    p.write_text(s, encoding="utf-8")
    print("SUPER_ADMIN_JS_OK")
else:
    print("SKIPPED_JS")
