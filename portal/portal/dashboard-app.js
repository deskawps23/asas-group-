import { initializeApp }
  from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

import { firebaseConfig }
  from "./firebase-auth.js";


const app = initializeApp(
  firebaseConfig,
  "asas-dashboard"
);

const auth = getAuth(app);


const userName =
  document.getElementById("userName");

const userEmail =
  document.getElementById("userEmail");

const emailStatus =
  document.getElementById("emailStatus");

const profileName =
  document.getElementById("profileName");

const logoutBtn =
  document.getElementById("logoutBtn");


onAuthStateChanged(auth, (user) => {

  if (!user) {
    window.location.href = "../login.html";
    return;
  }


  if (userName) {
    userName.textContent =
      user.displayName || "Leadership";
  }


  if (userEmail) {
    userEmail.textContent =
      user.email || "";
  }


  if (profileName && !profileName.value) {
    profileName.value =
      user.displayName || "";
  }


  if (emailStatus) {

    if (user.emailVerified) {

      emailStatus.textContent =
        "Verified";

      emailStatus.className =
        "verified";

    } else {

      emailStatus.textContent =
        "Not Verified";

      emailStatus.className =
        "pending";

    }

  }

});


logoutBtn?.addEventListener(
  "click",
  async () => {

    try {

      await signOut(auth);

      window.location.href =
        "../login.html";

    } catch (error) {

      console.error(error);

      alert(
        "Logout gagal. Silakan coba kembali."
      );

    }

  }
);
