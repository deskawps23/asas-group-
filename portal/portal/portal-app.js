import { initializeApp }
  from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signOut,
  setPersistence,
  browserLocalPersistence
}

} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

import { firebaseConfig }
  from "./firebase-auth.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const loginForm =
  document.getElementById("loginForm");

const registerForm =
  document.getElementById("registerForm");

/* REGISTER */
registerForm?.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();
    event.stopImmediatePropagation();

    const name =
      document.getElementById("fullName").value.trim();

    const email =
      document.getElementById("registerEmail").value.trim();

    const password =
      document.getElementById("registerPassword").value;

    const button =
      registerForm.querySelector(".portal-submit");

    try {

      button.disabled = true;
      button.textContent = "Mendaftarkan...";

      const result =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      await updateProfile(result.user, {
        displayName: name
      });

      await sendEmailVerification(result.user);

      await signOut(auth);

      alert(
        "Pendaftaran berhasil. Silakan periksa email untuk verifikasi akun."
      );

      registerForm.reset();

    } catch (error) {

      console.error(error);

      alert(
        error.code === "auth/email-already-in-use"
          ? "Email sudah terdaftar."
          : "Pendaftaran gagal. Periksa data dan coba kembali."
      );

    } finally {

      button.disabled = false;
      button.textContent = "Ajukan Pendaftaran";
    }
  },
  true
);


/* LOGIN */
loginForm?.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();
    event.stopImmediatePropagation();

    const email =
      document.getElementById("loginEmail").value.trim();

    const password =
      document.getElementById("loginPassword").value;

    const button =
      loginForm.querySelector(".portal-submit");

    try {

      button.disabled = true;
      button.textContent = "Memproses...";

      const result =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      if (!result.user.emailVerified) {

        await signOut(auth);

        alert(
          "Email belum diverifikasi. Periksa email terlebih dahulu."
        );

        return;
      }

    window.location.href = "dashboard.html";
      
      
    } catch (error) {

      console.error(error);

      alert("Email atau password tidak sesuai.");

    } finally {

      button.disabled = false;
      button.textContent = "Login";
    }
  },
  true
);
      
