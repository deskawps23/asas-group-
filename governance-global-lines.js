import { db } from "./firebase-config.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const DEFAULT_LINES = [
  { line: "KOMISARIS", title: "Dewan Komisaris", desc: "Pengawasan tata kelola, kepatuhan, dan arah strategis ASAS Global World oleh Dewan Komisaris (3 orang)." },
  { line: "CEO", title: "Chief Executive Officer", desc: "Eksekutif tertinggi pengelolaan dan integrasi lini usaha ASAS Global World." },
  { line: "CFO", title: "Chief Financial Officer", desc: "Pengendalian keuangan korporat, struktur modal, dan pelaporan strategis." },
  { line: "CFO-F", title: "Facility Service", desc: "Pengelolaan, perawatan, dan operasional layanan fasilitas (Facility Service) serta sarana pendukung perusahaan." },
  { line: "CTO", title: "Chief Technology Officer", desc: "Arsitektur platform, keamanan sistem, dan infrastruktur digital perusahaan." },
  { line: "CHRO", title: "Chief Human Resources Officer", desc: "Pengelolaan SDM, pembinaan talenta, dan struktur peran organisasi." }
  { line: "GM", title: "General Manager", desc: "Pengelolaan operasional lintas fungsi/unit, koordinasi manajerial, dan eksekusi target perusahaan." },
];

const gridEl = document.getElementById("asasGlobalLinesGrid");
const sumEl = document.getElementById("asasGlobalLinesSummary");

function renderFallback(labelNote = "") {
  if (!gridEl) return;
  if (sumEl && labelNote) sumEl.textContent = labelNote;
  gridEl.innerHTML = DEFAULT_LINES.map((item) =>
    `<article class="governance-card" style="padding:14px;border-radius:12px;border:1px solid rgba(148,163,184,0.25);margin-bottom:10px;">
      <strong>${item.line} — ${item.title}</strong>
      <p style="margin:6px 0 0;font-size:13px;opacity:0.88;">${item.desc}</p>
    </article>`
  ).join("");
}

async function initGlobalLines() {
  if (!gridEl) return;
  try {
    const snap = await getDocs(query(collection(db, "hubAdmins"), where("active", "==", true)));
    const activeOfficers = snap.docs.map((d) => d.data()).filter((d) => Boolean(d.corporateLine || d.role));
    if (!activeOfficers.length) {
      renderFallback("Struktur lini standar ASAS Global World (menunggu penetapan pejabat aktif di panel Super Admin).");
      return;
    }
    if (sumEl) {
      sumEl.textContent = `Menampilkan ${activeOfficers.length} pemegang lini aktif ASAS Global World yang telah ditetapkan Super Admin.`;
    }
    gridEl.innerHTML = activeOfficers.map((o) => {
      const line = String(o.corporateLine || o.role || "UNIT_HEAD");
      const name = String(o.name || o.email || "Pejabat Aktif");
      const divName = String(o.division || o.enterprise || "ASAS Global World");
      return `<article class="governance-card" style="padding:14px;border-radius:12px;border:1px solid rgba(148,163,184,0.25);margin-bottom:10px;">
        <strong>${line} · ${name}</strong>
        <p style="margin:6px 0 0;font-size:13px;opacity:0.88;">Divisi / Cakupan: ${divName}</p>
      </article>`;
    }).join("");
  } catch (_) {
    renderFallback("Struktur lini standar ASAS Global World.");
  }
}

initGlobalLines();
