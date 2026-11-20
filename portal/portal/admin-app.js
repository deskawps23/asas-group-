import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  getIdTokenResult
} from
  "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs
} from
  "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


import { firebaseConfig } from "./firebase-auth.js";
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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

  } catch (error) {
    console.error("Admin verification failed:", error);

    alert(
      "Verifikasi hak Super Admin gagal. Silakan coba kembali."
    );

    window.location.href = "/asas-group-/portal/dashboard.html";

  
  }

});

async function loadLeadershipProfiles() {
  const snapshot = await getDocs(collection(db, "leadershipProfiles"));

  let pending = 0;
  let approved = 0;
  let published = 0;

  snapshot.forEach((profileDoc) => {
    const data = profileDoc.data();

    if (data.status === "pending") pending++;
    if (data.status === "approved") approved++;
    if (data.status === "published") published++;
  });

  document.getElementById("pendingCount").textContent = pending;
  document.getElementById("approvedCount").textContent = approved;
  document.getElementById("publishedCount").textContent = published;
}

