import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  getIdTokenResult
} from
  "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import { firebaseConfig } from "./firebase-auth.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

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
