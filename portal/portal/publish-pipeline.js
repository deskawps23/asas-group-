import {
  initializeApp,
  getApps,
  getApp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getAuth,
  getIdTokenResult,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
  firebaseConfig
} from "./firebase-auth.js";

const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

function escapeText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildPublicLeadership(data, profileId) {
  return {
    profileId,
    fullName:
      data.fullName ||
      data.name ||
      data.displayName ||
      "",
    positionTitle:
      data.positionTitle ||
      data.position ||
      data.role ||
      "",
    positionId: data.positionId || "",
    leadershipLevel: data.leadershipLevel || "",
    businessDomain:
      data.businessDomain ||
      data.businessUnit ||
      "",
    branch: data.branch || "",
    location: data.location || "",
    publicBio:
      data.publicBio ||
      data.bio ||
      "",
    publicPhotoPath:
      data.publicPhotoPath || "",
    status: "published",
    publishedAt: serverTimestamp()
  };
}

async function requireSuperAdmin() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Sesi Super Admin tidak tersedia.");
  }

  const tokenResult =
    await getIdTokenResult(user, true);

  if (tokenResult.claims.admin !== true) {
    throw new Error(
      "Publish hanya dapat dilakukan oleh Super Admin."
    );
  }

  return user;
}

async function publishLeadershipProfile(profileId) {
  const user = await requireSuperAdmin();

  const sourceRef =
    doc(db, "leadershipProfiles", profileId);

  const publicRef =
    doc(db, "publicLeadership", profileId);

  const auditRef =
    doc(collection(db, "auditLogs"));

  await runTransaction(db, async (transaction) => {
    const sourceSnapshot =
      await transaction.get(sourceRef);

    if (!sourceSnapshot.exists()) {
      throw new Error(
        "Profil Leadership tidak ditemukan."
      );
    }

    const data = sourceSnapshot.data();

    const status = String(
      data.status || ""
    ).trim().toLowerCase();

    if (status !== "approved") {
      throw new Error(
        "Hanya profil Approved yang dapat dipublikasikan."
      );
    }

    transaction.set(
      publicRef,
      buildPublicLeadership(data, profileId)
    );

    transaction.update(sourceRef, {
      status: "published",
      publishedAt: serverTimestamp(),
      publishedBy: user.uid
    });

    transaction.set(auditRef, {
      action: "PUBLISH",
      targetType: "leadership",
      targetId: profileId,
      actorUid: user.uid,
      actorRole: "super_admin",
      previousStatus: "approved",
      newStatus: "published",
      timestamp: serverTimestamp()
    });
  });
}

function ensurePublishQueue() {
  let queue = document.getElementById(
    "approvedPublishQueue"
  );

  if (queue) return queue;

  queue = document.createElement("section");
  queue.id = "approvedPublishQueue";
  queue.className = "publish-pipeline-panel";

  const reviewQueue =
    document.getElementById("reviewQueue");

  if (reviewQueue?.parentNode) {
    reviewQueue.parentNode.insertBefore(
      queue,
      reviewQueue.nextSibling
    );
  } else {
    document.body.appendChild(queue);
  }

  return queue;
}

async function renderApprovedQueue() {
  const queue = ensurePublishQueue();

  queue.innerHTML = `
    <h2>Approved Queue</h2>
    <p>Memuat profil yang siap dipublikasikan...</p>
  `;

  const snapshot =
    await getDocs(collection(db, "leadershipProfiles"));

  const approved = [];

  snapshot.forEach((profileDoc) => {
    const data = profileDoc.data();

    const status = String(
      data.status || ""
    ).trim().toLowerCase();

    if (status === "approved") {
      approved.push({
        id: profileDoc.id,
        ...data
      });
    }
  });

  if (approved.length === 0) {
    queue.innerHTML = `
      <h2>Approved Queue</h2>
      <div class="publish-empty">
        <strong>Belum ada profil Approved</strong>
        <p>
          Profil akan muncul setelah proses approval selesai.
        </p>
      </div>
    `;
    return;
  }

  const cards = approved.map((profile) => {
    const name = escapeText(
      profile.fullName ||
      profile.name ||
      profile.displayName ||
      "Nama belum tersedia"
    );

    const position = escapeText(
      profile.positionTitle ||
      profile.position ||
      profile.role ||
      "Jabatan belum tersedia"
    );

    return `
      <article class="publish-card">
        <div>
          <strong>${name}</strong>
          <p>${position}</p>
          <small>Status: Approved</small>
        </div>

        <button
          type="button"
          class="publish-button"
          data-publish-id="${escapeText(profile.id)}">
          Publish
        </button>
      </article>
    `;
  }).join("");

  queue.innerHTML = `
    <h2>Approved Queue</h2>
    <p>
      Publikasi hanya membuat field profesional
      yang telah ditentukan menjadi data publik.
    </p>
    <div class="publish-list">${cards}</div>
  `;
}

document.addEventListener(
  "click",
  async (event) => {
    const button =
      event.target.closest("[data-publish-id]");

    if (!button) return;

    const profileId =
      button.dataset.publishId;

    if (!profileId) return;

    const confirmed = window.confirm(
      "Publikasikan profil Leadership ini?"
    );

    if (!confirmed) return;

    const originalLabel =
      button.textContent;

    button.disabled = true;
    button.textContent = "Publishing...";

    try {
      await publishLeadershipProfile(profileId);

      window.alert(
        "Profil Leadership berhasil dipublikasikan."
      );

      await renderApprovedQueue();

      window.dispatchEvent(
        new CustomEvent(
          "asas:leadership-published",
          {
            detail: { profileId }
          }
        )
      );
    } catch (error) {
      console.error(
        "Leadership publish failed:",
        error
      );

      window.alert(
        error?.message ||
        "Publish gagal. Periksa Firestore Rules."
      );

      button.disabled = false;
      button.textContent = originalLabel;
    }
  }
);

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  try {
    const tokenResult =
      await getIdTokenResult(user, true);

    if (tokenResult.claims.admin === true) {
      await renderApprovedQueue();
    }
  } catch (error) {
    console.error(
      "Publish Pipeline initialization failed:",
      error
    );
  }
});
