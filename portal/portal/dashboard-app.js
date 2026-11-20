import { initializeApp }
  from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

import { firebaseConfig }
  from "./firebase-auth.js";


/* =========================
   FIREBASE
   ========================= */

const app = initializeApp(
  firebaseConfig,
  "asas-leadership-dashboard"
);

const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;


/* =========================
   ELEMENT DASHBOARD
   ========================= */

const headerName =
  document.getElementById("headerName");

const headerEmail =
  document.getElementById("headerEmail");

const accountEmail =
  document.getElementById("accountEmail");

const fullName =
  document.getElementById("fullName");

const leadershipLevel =
  document.getElementById("leadershipLevel");

const position =
  document.getElementById("position");

const businessUnit =
  document.getElementById("businessUnit");

const branch =
  document.getElementById("branch");

const locationField =
  document.getElementById("location");

const bio =
  document.getElementById("bio");

const previewName =
  document.getElementById("previewName");

const previewPosition =
  document.getElementById("previewPosition");

const statusBadge =
  document.getElementById("statusBadge");

const saveDraftButton =
  document.getElementById("saveDraftButton");

const submitButton =
  document.getElementById("submitButton");

const profileForm =
  document.getElementById("profileForm");

const logoutButton =
  document.getElementById("logoutButton");


/* =========================
   STATUS
   ========================= */

function showStatus(status = "draft") {

  const allowedStatus = [
    "draft",
    "pending",
    "approved",
    "published"
  ];

  const safeStatus =
    allowedStatus.includes(status)
      ? status
      : "draft";


  const steps = {
    draft:
      document.getElementById("stepDraft"),

    pending:
      document.getElementById("stepPending"),

    approved:
      document.getElementById("stepApproved"),

    published:
      document.getElementById("stepPublished")
  };


  Object.values(steps).forEach(
    step => {
      if (step) {
        step.classList.remove("active");
      }
    }
  );


  if (steps[safeStatus]) {
    steps[safeStatus].classList.add("active");
  }


  if (statusBadge) {
    statusBadge.textContent =
      safeStatus.toUpperCase();
  }
}


/* =========================
   PREVIEW PROFIL
   ========================= */

function updatePreview() {

  if (previewName) {
    previewName.textContent =
      fullName?.value.trim()
      || currentUser?.displayName
      || "Leadership ASAS";
  }


  if (previewPosition) {
    previewPosition.textContent =
      position?.value.trim()
      || "Position not completed";
  }
}


fullName?.addEventListener(
  "input",
  updatePreview
);


position?.addEventListener(
  "input",
  updatePreview
);


/* =========================
   DATA FORM
   ========================= */

function collectProfileData(status) {

  return {
    uid:
      currentUser.uid,

    email:
      currentUser.email,

    fullName:
      fullName.value.trim(),

    leadershipLevel:
      leadershipLevel.value,

    position:
      position.value.trim(),

    businessUnit:
      businessUnit.value.trim(),

    branch:
      branch.value.trim(),

    location:
      locationField.value.trim(),

    bio:
      bio.value.trim(),

    status:
      status,

    updatedAt:
      serverTimestamp()
  };
}


/* =========================
   LOAD PROFILE
   ========================= */

async function loadProfile(user) {

  const profileRef = doc(
    db,
    "leadershipProfiles",
    user.uid
  );


  const profileSnapshot =
    await getDoc(profileRef);


  if (!profileSnapshot.exists()) {

    fullName.value =
      user.displayName || "";

    leadershipLevel.value = "";
    position.value = "";
    businessUnit.value = "";
    branch.value = "";
    locationField.value = "";
    bio.value = "";

    updatePreview();
    showStatus("draft");

    return;
  }


  const data =
    profileSnapshot.data();


  fullName.value =
    data.fullName || "";

  leadershipLevel.value =
    data.leadershipLevel || "";

  position.value =
    data.position || "";

  businessUnit.value =
    data.businessUnit || "";

  branch.value =
    data.branch || "";

  locationField.value =
    data.location || "";

  bio.value =
    data.bio || "";


  updatePreview();

  showStatus(
    data.status || "draft"
  );
}


/* =========================
   SIMPAN DRAFT
   ========================= */

saveDraftButton?.addEventListener(
  "click",
  async event => {

    event.preventDefault();
    event.stopImmediatePropagation();


    if (!currentUser) {

      alert(
        "Sesi login belum tersedia."
      );

      return;
    }


    saveDraftButton.disabled = true;
    saveDraftButton.textContent =
      "Menyimpan...";


    try {

      const profileRef = doc(
        db,
        "leadershipProfiles",
        currentUser.uid
      );


      await setDoc(
        profileRef,
        collectProfileData("draft"),
        {
          merge: true
        }
      );


      showStatus("draft");


      alert(
        "Draft profil berhasil disimpan."
      );


    } catch (error) {

      console.error(
        "Gagal menyimpan draft:",
        error
      );


      alert(
        "Draft belum berhasil disimpan. Periksa koneksi dan coba kembali."
      );


    } finally {

      saveDraftButton.disabled = false;
      saveDraftButton.textContent =
        "Simpan Draft";
    }
  },
  true
);


/* =========================
   AJUKAN APPROVAL
   ========================= */

profileForm?.addEventListener(
  "submit",
  async event => {

    event.preventDefault();
    event.stopImmediatePropagation();


    if (!currentUser) {

      alert(
        "Sesi login belum tersedia."
      );

      return;
    }


    if (!fullName.value.trim()) {

      alert(
        "Nama lengkap wajib diisi."
      );

      fullName.focus();

      return;
    }


    if (!leadershipLevel.value) {

      alert(
        "Leadership Level wajib dipilih."
      );

      leadershipLevel.focus();

      return;
    }


    if (!position.value.trim()) {

      alert(
        "Jabatan wajib diisi."
      );

      position.focus();

      return;
    }


    submitButton.disabled = true;
    submitButton.textContent =
      "Mengajukan...";


    try {

      const profileRef = doc(
        db,
        "leadershipProfiles",
        currentUser.uid
      );


      await setDoc(
        profileRef,
        {
          ...collectProfileData(
            "pending"
          ),

          submittedAt:
            serverTimestamp()
        },
        {
          merge: true
        }
      );


      showStatus("pending");


      alert(
        "Profil berhasil diajukan. Status profil sekarang Pending dan menunggu persetujuan Admin ASAS."
      );


    } catch (error) {

      console.error(
        "Gagal mengajukan profil:",
        error
      );


      alert(
        "Profil belum berhasil diajukan. Periksa koneksi dan coba kembali."
      );


    } finally {

      submitButton.disabled = false;
      submitButton.textContent =
        "Ajukan Approval";
    }
  },
  true
);


/* =========================
   CEK LOGIN
   ========================= */

onAuthStateChanged(
  auth,
  async user => {

    if (!user) {
  alert("DIAGNOSIS: Sesi login tidak terbaca di Dashboard.");
  window.location.href = "login.html";
  return;
}



    if (!user.emailVerified) {

      await signOut(auth);

      alert(
        "Email belum diverifikasi. Silakan verifikasi email terlebih dahulu."
      );

      window.location.href =
        "login.html";

      return;
    }


    currentUser = user;


    if (headerName) {
      headerName.textContent =
        user.displayName
        || "Leadership ASAS";
    }


    if (headerEmail) {
      headerEmail.textContent =
        user.email || "";
    }


    if (accountEmail) {
      accountEmail.textContent =
        user.email || "";
    }


    try {

      await loadProfile(user);

    } catch (error) {

      console.error(
        "Gagal memuat profil:",
        error
      );


      alert(
        "Profil belum dapat dimuat dari database."
      );
    }
  }
);


/* =========================
   LOGOUT
   ========================= */

logoutButton?.addEventListener(
  "click",
  async event => {

    event.preventDefault();
    event.stopImmediatePropagation();


    try {

      await signOut(auth);

      window.location.href =
        "login.html";


    } catch (error) {

      console.error(
        "Logout gagal:",
        error
      );


      alert(
        "Logout gagal. Silakan coba kembali."
      );
    }
  },
  true
);
      
