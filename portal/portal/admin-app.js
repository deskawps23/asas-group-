import {
  initializeApp } from   "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";  import {   getAuth,
  onAuthStateChanged,
  getIdTokenResult } from   "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"; import {   getFirestore,
  collection,
  getDocs,
  doc,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


import { firebaseConfig } from "./firebase-auth.js";
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function escapeAdminText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function approveLeadershipProfile(profileId) {
  if (!profileId) {
    throw new Error("Document ID Leadership tidak tersedia.");
  }

  const user = auth.currentUser;

  if (!user) {
    throw new Error("Sesi Super Admin tidak tersedia.");
  }

  const tokenResult = await getIdTokenResult(user, true);

  if (tokenResult.claims.admin !== true) {
    throw new Error("Approval hanya dapat dilakukan oleh Super Admin.");
  }

  const profileRef = doc(db, "leadershipProfiles", profileId);
  const auditRef = doc(collection(db, "auditLogs"));

  await runTransaction(db, async (transaction) => {
    const profileSnapshot = await transaction.get(profileRef);

    if (!profileSnapshot.exists()) {
      throw new Error("Profil Leadership tidak ditemukan.");
    }

    const currentData = profileSnapshot.data();
    const previousStatus = String(
      currentData.status || ""
    ).trim().toLowerCase();

    if (previousStatus !== "pending") {
      throw new Error(
        "Profil tidak lagi berstatus Pending. Muat ulang halaman."
      );
    }

    transaction.update(profileRef, {
      status: "approved",
      approvedAt: serverTimestamp(),
      approvedBy: user.uid
    });

    transaction.set(auditRef, {
      action: "APPROVE",
      targetType: "leadership",
      targetId: profileId,
      actorUid: user.uid,
      actorRole: "super_admin",
      previousStatus: "pending",
      newStatus: "approved",
      timestamp: serverTimestamp()
    });
  });
}


onAuthStateChanged(auth, async (user) => {

  if (!user) {
    alert("Akses Super Admin memerlukan login.");
    window.location.href = "../login.html";
    return;
  }

  try {
    const tokenResult = await getIdTokenResult(user, true);

    if (tokenResult.claims.admin !== true) {
      alert(
        "Akses ditolak. Akun ini belum memiliki hak Super Admin."
      );

      window.location.href = "/asas-group-/portal/dashboard.html";


      return;
    }

    console.log("Super Admin access verified.");
try {
  await loadLeadershipProfiles();
} catch (loaderError) {
  console.error("Leadership loader failed:", loaderError);

  document.getElementById("reviewQueue").innerHTML =
    "<strong>Loader error:</strong><br>" +
    (loaderError.code || "unknown") +
    "<br>" +
    loaderError.message;
}




  } catch (error) {
    console.error("Admin verification failed:", error);

    alert(
  "Admin error: " + error.code + " | " + error.message
);


    window.location.href = "/asas-group-/portal/dashboard.html";


  }

});

async function loadLeadershipProfiles() {
  const snapshot = await getDocs(collection(db, "leadershipProfiles"));

  let pending = 0;
  let approved = 0;
  let published = 0;
    const pendingProfiles = [];

  snapshot.forEach((profileDoc) => {
    const data = profileDoc.data();
const status = String(data.status || "").trim().toLowerCase();

if (status === "pending") {
        pending++;
        pendingProfiles.push({
          id: profileDoc.id,
          ...data
        });
      }
if (status === "approved") approved++;
if (status === "published") published++;

  });

  const pendingEl = document.getElementById("pendingCount");
const approvedEl = document.getElementById("approvedCount");
const publishedEl = document.getElementById("publishedCount");

if (pendingEl) pendingEl.textContent = pending;
if (approvedEl) approvedEl.textContent = approved;
if (publishedEl) publishedEl.textContent = published;

    const reviewQueue = document.getElementById("reviewQueue");

    if (reviewQueue) {
      if (pendingProfiles.length === 0) {
        reviewQueue.innerHTML = `
          <strong>Tidak ada profil Pending</strong>
          <p>Semua pengajuan Leadership telah diproses.</p>
        `;
      } else {
        reviewQueue.innerHTML = pendingProfiles.map((profile) => {
          const profileName = escapeAdminText(
            profile.fullName ||
            profile.name ||
            profile.displayName ||
            "Nama belum tersedia"
          );

          const profilePosition = escapeAdminText(
            profile.positionTitle ||
            profile.position ||
            profile.role ||
            "Jabatan belum tersedia"
          );

          return `
            <article class="review-card">
              <strong>${profileName}</strong>
              <p>${profilePosition}</p>
              <small>Status: Pending</small>
              <button
                type="button"
                class="approve-leadership-button"
                data-approve-id="${escapeAdminText(profile.id)}">
                Approve
              </button>
            </article>
          `;
        }).join("");
      }

      reviewQueue.onclick = async (event) => {
        const button = event.target.closest("[data-approve-id]");

        if (!button || !reviewQueue.contains(button)) {
          return;
        }

        const profileId = button.dataset.approveId;

        if (!window.confirm("Setujui profil Leadership ini?")) {
          return;
        }

        const originalLabel = button.textContent;

        button.disabled = true;
        button.textContent = "Approving...";

        try {
          await approveLeadershipProfile(profileId);
          alert("Profil Leadership berhasil disetujui.");
          window.location.reload();
        } catch (error) {
          console.error("Leadership approval failed:", error);

          alert(
            error?.message ||
            "Approval gagal. Periksa Firestore Rules."
          );

          button.disabled = false;
          button.textContent = originalLabel;
        }
      };
    }

}

