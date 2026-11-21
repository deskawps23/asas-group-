import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getFirestore,
  collection,
  query,
  where,
  getDocs
} from
  "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import { firebaseConfig } from "./portal/portal/firebase-auth.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const gridMap = {
  "Board of Commissioners": "commissionersGrid",
  "Board of Directors": "directorsGrid",
  "General Manager": "generalManagersGrid",
  "Manager": "managersGrid",
  "Branch Business Manager": "branchManagersGrid"
};

const grids = Object.values(gridMap)
  .map((id) => document.getElementById(id))
  .filter(Boolean);

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createLeadershipCard(profile) {
  const card = document.createElement("article");
  card.className = "leadership-card";

  const name = escapeHTML(profile.fullName || "ASAS Leadership");
  const position = escapeHTML(profile.positionTitle || "");
  const unit = escapeHTML(profile.businessDomain || "");
  const branch = escapeHTML(profile.branch || "");
  const location = escapeHTML(profile.location || "");
  const bio = escapeHTML(profile.publicBio || "");

  card.innerHTML = `
    <div class="leadership-card-content">
      <span class="leadership-status">Published</span>
      <h3>${name}</h3>
      ${position ? `<strong>${position}</strong>` : ""}
      ${unit ? `<p>${unit}</p>` : ""}
      ${branch ? `<p>${branch}</p>` : ""}
      ${location ? `<p>${location}</p>` : ""}
      ${bio ? `<p>${bio}</p>` : ""}
    </div>
  `;

  return card;
}

function resetGrid(grid) {
  if (!grid) return;

  grid.innerHTML = `
    <div class="awaiting-profile">
      <span>+</span>
      <strong>Published Leadership</strong>
      <p>Belum ada profil Leadership yang dipublikasikan.</p>
    </div>
  `;
}

async function loadPublishedLeadership() {
  grids.forEach(resetGrid);

  try {
    const leadershipQuery = query(
      collection(db, "publicLeadership"),
      where("status", "==", "published")
    );

    const snapshot = await getDocs(leadershipQuery);

    const groupedProfiles = {};

    snapshot.forEach((documentSnapshot) => {
      const profile = documentSnapshot.data();
      const gridId = gridMap[profile.leadershipLevel];

      if (!gridId) return;

      if (!groupedProfiles[gridId]) {
        groupedProfiles[gridId] = [];
      }

      groupedProfiles[gridId].push(profile);
    });

    Object.entries(groupedProfiles).forEach(([gridId, profiles]) => {
      const grid = document.getElementById(gridId);

      if (!grid || profiles.length === 0) return;

      grid.innerHTML = "";

      profiles.forEach((profile) => {
        grid.appendChild(createLeadershipCard(profile));
      });
    });

  } catch (error) {
    console.error("Failed to load published Leadership:", error);

    grids.forEach((grid) => {
      if (!grid) return;

      grid.innerHTML = `
        <div class="awaiting-profile">
          <strong>Leadership Data Unavailable</strong>
          <p>Data Leadership belum dapat dimuat.</p>
        </div>
      `;
    });
  }
}

loadPublishedLeadership();
                     
