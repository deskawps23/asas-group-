import {
  initializeApp,
  getApps,
  getApp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  getStorage,
  ref,
  uploadBytes
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

import {
  firebaseConfig
} from "./portal/firebase-auth.js";

const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

const auth = getAuth(app);
const storage = getStorage(app);

const MAX_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp"
]);

function findUploadButton() {
  const buttons = [
    ...document.querySelectorAll("button, label")
  ];

  return buttons.find((element) =>
    /upload foto profil/i.test(
      element.textContent || ""
    )
  ) || null;
}

function createFileInput() {
  let input = document.getElementById(
    "nexusPrivateProfilePhoto"
  );

  if (input) return input;

  input = document.createElement("input");
  input.id = "nexusPrivateProfilePhoto";
  input.type = "file";
  input.accept = "image/jpeg,image/png,image/webp";
  input.hidden = true;

  document.body.appendChild(input);

  return input;
}

function showMessage(message) {
  const current = document.getElementById(
    "nexusPhotoUploadStatus"
  );

  if (current) {
    current.textContent = message;
    return current;
  }

  const status = document.createElement("p");
  status.id = "nexusPhotoUploadStatus";
  status.className = "nexus-photo-status";
  status.textContent = message;

  const button = findUploadButton();

  if (button?.parentNode) {
    button.parentNode.insertBefore(
      status,
      button.nextSibling
    );
  }
}

function setPrivatePreview(file) {
  const oldPreview = document.getElementById(
    "nexusPrivatePhotoPreview"
  );

  if (oldPreview) {
    URL.revokeObjectURL(oldPreview.src);
    oldPreview.remove();
  }

  const preview = document.createElement("img");

  preview.id = "nexusPrivatePhotoPreview";
  preview.className = "nexus-private-photo-preview";
  preview.alt = "Preview foto profil privat";
  preview.src = URL.createObjectURL(file);

  const button = findUploadButton();

  if (button?.parentNode) {
    button.parentNode.insertBefore(
      preview,
      button
    );
  }
}

function validateImage(file) {
  if (!file) {
    throw new Error(
      "Tidak ada foto yang dipilih."
    );
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error(
      "Gunakan JPEG, PNG, atau WebP."
    );
  }

  if (file.size <= 0 || file.size > MAX_SIZE) {
    throw new Error(
      "Ukuran foto maksimal 5 MB."
    );
  }
}

async function uploadPrivateProfilePhoto(file) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "Login diperlukan untuk upload foto."
    );
  }

  validateImage(file);

  const extension = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp"
  }[file.type];

  const path =
    `profilePhotos/${user.uid}/profile.${extension}`;

  const photoRef = ref(storage, path);

  await uploadBytes(
    photoRef,
    file,
    {
      contentType: file.type,
      customMetadata: {
        ownerUid: user.uid,
        visibility: "private"
      }
    }
  );

  return path;
}

function initializePhotoUpload() {
  const button = findUploadButton();

  if (!button) return;

  if (button.dataset.nexusPhotoReady === "true") {
    return;
  }

  button.dataset.nexusPhotoReady = "true";

  const input = createFileInput();

  button.addEventListener("click", () => {
    input.value = "";
    input.click();
  });

  input.addEventListener("change", async () => {
    const file = input.files?.[0];

    if (!file) return;

    try {
      validateImage(file);

      setPrivatePreview(file);
      showMessage("Mengunggah foto privat...");

      const path =
        await uploadPrivateProfilePhoto(file);

      showMessage(
        "Foto privat tersimpan. " +
        "Foto belum dipublikasikan."
      );

      window.dispatchEvent(
        new CustomEvent(
          "asas:profile-photo-uploaded",
          {
            detail: { path }
          }
        )
      );
    } catch (error) {
      console.error(
        "Profile photo upload failed:",
        error
      );

      showMessage(
        error?.message ||
        "Upload foto gagal."
      );
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializePhotoUpload
  );
} else {
  initializePhotoUpload();
}

window.addEventListener(
  "hashchange",
  initializePhotoUpload
);
