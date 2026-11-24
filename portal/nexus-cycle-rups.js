(function () {
  "use strict";
  const STORAGE_KEY = "asas_nexus_cycle_rups_v1";
  const CYCLES = [
    { id: "daily", label: "Daily Activity", next: "weekly" },
    { id: "weekly", label: "Weekly", next: "monthly" },
    { id: "monthly", label: "Monthly", next: "yearly" },
    { id: "yearly", label: "Yearly Report", next: "rups" },
    { id: "rups", label: "Annual Meeting / RUPS", next: null }
  ];
  const ROLES = [
    "Supervisor",
    "Branch Manager",
    "Direksi",
    "Presdir / Dewan Komisaris / RUPS"
  ];
  const PROJECTS = [
    {
      id: "pilot_jasa_setrika",
      name: "Pilot Project Jasa Setrika (Z1 Pandeglang)",
      route: "../operations.html",
      defaultStatus: "Terverifikasi Dokumen / Bukti"
    },
    {
      id: "master_plan_serang",
      name: "Master Plan, Anggaran & Struktur Organisasi (Serang)",
      route: "../governance.html",
      defaultStatus: "Terverifikasi Dokumen / Bukti"
    },
    {
      id: "satu_data_geo_pandeglang",
      name: "Satu Data & Geospasial Wilayah (Pandeglang)",
      route: "../geo.html",
      defaultStatus: "Terverifikasi Dokumen / Bukti"
    },
    {
      id: "badan_usaha_kemitraan",
      name: "Legalitas Badan Usaha, Kemitraan & Tata Kelola",
      route: "../governance.html",
      defaultStatus: "Terverifikasi Dokumen / Bukti"
    },
    {
      id: "agenda_telaah_menunggu_bukti",
      name: "Agenda Telaah & Rencana Jangka Panjang (Lahan 450 Ha / RS Serang / Bandara / PT BST / 2026-2041)",
      route: "../roadmap.html",
      defaultStatus: "Menunggu Data Nyata"
    }
  ];

  function loadEntries() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveEntries(entries) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (_) {}
  }

  function esc(v) {
    return String(v || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function findHost() {
    return (
      document.getElementById("nexus-cycle-rups-root") ||
      document.querySelector("main") ||
      document.body
    );
  }

  function renderApp() {
    const host = findHost();
    if (!host) return;

    let mount = document.getElementById("nexus-cycle-rups-module");
    if (!mount) {
      mount = document.createElement("section");
      mount.id = "nexus-cycle-rups-module";
      mount.setAttribute("aria-label", "Pelaporan Siklus dan RUPS ASAS Nexus");
      host.appendChild(mount);
    }

    let entries = loadEntries();
    let activeCycle = "all";
    let activeProject = "all";

    function cycleLabel(id) {
      const f = CYCLES.find((c) => c.id === id);
      return f ? f.label : id;
    }

    function projectName(id) {
      const f = PROJECTS.find((p) => p.id === id);
      return f ? f.name : id;
    }

    function renderCycleCards(list) {
      return CYCLES.map((c) => {
        const items = list.filter((x) => x.cycle === c.id);
        const ver = items.filter((x) => x.verificationStatus === "Terverifikasi Dokumen / Bukti").length;
        const wait = items.filter((x) => x.verificationStatus === "Menunggu Data Nyata").length;
        return (
          '<div class="nx-card">' +
          '<div class="nx-card-t">' + esc(c.label) + "</div>" +
          '<div class="nx-card-l">Catatan: <strong>' + items.length + "</strong></div>" +
          '<div class="nx-card-l">Terverifikasi: <strong>' + ver + "</strong></div>" +
          '<div class="nx-card-l">Menunggu Data Nyata: <strong>' + wait + "</strong></div>" +
          "</div>"
        );
      }).join("");
    }

    function renderTableRows(list) {
      return PROJECTS.map((p) => {
        const items = list.filter((x) => x.projectId === p.id);
        const cov = CYCLES.filter((c) => items.some((x) => x.cycle === c.id)).map((c) => c.label);
        return (
          "<tr>" +
          "<td><strong>" + esc(p.name) + "</strong></td>" +
          "<td>" + esc(cov.length ? cov.join(" -> ") : "Belum ada catatan siklus") + "</td>" +
          "<td>" + items.length + " catatan</td>" +
          "<td>" + esc(p.defaultStatus) + "</td>" +
          "</tr>"
        );
      }).join("");
    }

    function renderLogs(list) {
      const rows = list.filter((x) => {
        const okC = activeCycle === "all" || x.cycle === activeCycle;
        const okP = activeProject === "all" || x.projectId === activeProject;
        return okC && okP;
      });
      if (!rows.length) {
        return '<p class="nx-empty">Belum ada catatan untuk filter yang dipilih.</p>';
      }
      return rows.slice().reverse().map((x) => (
        '<article class="nx-log">' +
        '<div class="nx-meta"><strong>' + esc(cycleLabel(x.cycle)) + "</strong> • " + esc(x.role) + " • <strong>" + esc(x.verificationStatus) + "</strong></div>" +
        '<h4 class="nx-proj">' + esc(projectName(x.projectId)) + "</h4>" +
        '<p class="nx-txt"><strong>Bukti / Fakta:</strong> ' + esc(x.evidence || "-") + "</p>" +
        '<p class="nx-txt"><strong>Tindak Lanjut / RUPS:</strong> ' + esc(x.followUp || "-") + "</p>" +
        "</article>"
      )).join("");
    }

    const cycleOpts = CYCLES.map((c) => '<option value="' + esc(c.id) + '">' + esc(c.label) + "</option>").join("");
    const roleOpts = ROLES.map((r) => '<option value="' + esc(r) + '">' + esc(r) + "</option>").join("");
    const projOpts = PROJECTS.map((p) => '<option value="' + esc(p.id) + '">' + esc(p.name) + "</option>").join("");
    const cycleBtns = '<button type="button" class="nx-btn ' + (activeCycle === "all" ? "is-on" : "") + '" data-c="all">Semua Siklus</button>' +
      CYCLES.map((c) => '<button type="button" class="nx-btn ' + (activeCycle === c.id ? "is-on" : "") + '" data-c="' + esc(c.id) + '">' + esc(c.label) + "</button>").join("");

    mount.innerHTML =
      "<style>" +
      "#nexus-cycle-rups-module{margin:20px 0;padding:18px;border:1px solid #d4d8dd;border-radius:10px;background:#fff;color:#16191d;font-family:inherit}" +
      ".nx-top{display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;border-bottom:1px solid #e5e8ec;padding-bottom:10px;margin-bottom:14px}" +
      ".nx-top h3{margin:0 0 4px;font-size:17px}.nx-sub{margin:0;font-size:12px;color:#4a525d}" +
      ".nx-tag{padding:5px 9px;border-radius:6px;background:#f1f4f8;border:1px solid #cfd6df;font-size:11px;font-weight:700}" +
      ".nx-bar{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}" +
      ".nx-btn{padding:7px 11px;border-radius:6px;border:1px solid #b8c2ce;background:#f8fafc;color:#16191d;font-size:12px;cursor:pointer}" +
      ".nx-btn.is-on{background:#16191d;color:#fff;border-color:#16191d}" +
      ".nx-btn-save{background:#1d4ed8;border-color:#1d4ed8;color:#fff;font-weight:600}" +
      ".nx-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-bottom:10px}" +
      ".nx-f label{display:block;font-size:12px;font-weight:600;margin-bottom:4px}" +
      ".nx-f select,.nx-f textarea{width:100%;box-sizing:border-box;padding:7px 9px;border:1px solid #c5cdd7;border-radius:6px;font-size:13px;font-family:inherit;background:#fff}" +
      ".nx-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:8px;margin:16px 0}" +
      ".nx-card{padding:10px;border:1px solid #dde2e8;border-radius:8px;background:#fafbfd}" +
      ".nx-card-t{font-weight:700;font-size:12px;margin-bottom:4px}.nx-card-l{font-size:12px;margin:2px 0;color:#333b45}" +
      ".nx-tw{overflow-x:auto;margin-bottom:16px}.nx-tbl{width:100%;border-collapse:collapse;font-size:12px}" +
      ".nx-tbl th,.nx-tbl td{border:1px solid #e1e6ec;padding:7px 9px;text-align:left}.nx-tbl th{background:#f4f6f9}" +
      ".nx-log{padding:10px;border:1px solid #e1e6ec;border-radius:8px;margin-bottom:8px}.nx-meta{font-size:12px;color:#4a525d;margin-bottom:4px}" +
      ".nx-proj{margin:2px 0 5px;font-size:14px}.nx-txt{margin:3px 0;font-size:12px}.nx-empty{font-size:12px;color:#555e68}" +
      "</style>" +
      '<div class="nx-top"><div><h3>Pelaporan Siklus &amp; RUPS — ASAS Nexus</h3><p class="nx-sub">Supervisor -> Branch Manager -> Direksi -> Presdir / Dewan Komisaris / RUPS</p></div><span class="nx-tag">NO FAKE KPI</span></div>' +
      '<div class="nx-bar" id="nx-c-bar">' + cycleBtns + "</div>" +
      '<form id="nx-form"><div class="nx-grid">' +
      '<div class="nx-f"><label for="nx-c">Siklus</label><select id="nx-c" name="cycle">' + cycleOpts + "</select></div>" +
      '<div class="nx-f"><label for="nx-r">Jenjang</label><select id="nx-r" name="role">' + roleOpts + "</select></div>" +
      '<div class="nx-f"><label for="nx-p">Proyek / Topik</label><select id="nx-p" name="projectId">' + projOpts + "</select></div>" +
      '<div class="nx-f"><label for="nx-s">Status Bukti</label><select id="nx-s" name="verificationStatus"><option value="Terverifikasi Dokumen / Bukti">Terverifikasi Dokumen / Bukti</option><option value="Menunggu Data Nyata">Menunggu Data Nyata</option></select></div>' +
      '</div><div class="nx-grid">' +
      '<div class="nx-f"><label for="nx-e">Fakta / Bukti Nyata</label><textarea id="nx-e" name="evidence" rows="2"></textarea></div>' +
      '<div class="nx-f"><label for="nx-fu">Tindak Lanjut / RUPS</label><textarea id="nx-fu" name="followUp" rows="2"></textarea></div>' +
      '</div><button type="submit" class="nx-btn nx-btn-save">Simpan Catatan Siklus</button></form>' +
      '<div class="nx-cards" id="nx-cards">' + renderCycleCards(entries) + "</div>" +
      '<div class="nx-tw"><table class="nx-tbl"><thead><tr><th>Proyek / Topik</th><th>Cakupan Siklus</th><th>Jumlah</th><th>Status Acuan</th></tr></thead><tbody id="nx-tbody">' + renderTableRows(entries) + "</tbody></table></div>" +
      '<div class="nx-f" style="max-width:340px;margin-bottom:10px;"><label for="nx-fp">Filter Proyek / Topik</label><select id="nx-fp"><option value="all">Semua Proyek / Topik</option>' + projOpts + "</select></div>" +
      '<div id="nx-logs">' + renderLogs(entries) + "</div>";

    function refresh() {
      entries = loadEntries();
      const cEl = document.getElementById("nx-cards");
      const tEl = document.getElementById("nx-tbody");
      const lEl = document.getElementById("nx-logs");
      if (cEl) cEl.innerHTML = renderCycleCards(entries);
      if (tEl) tEl.innerHTML = renderTableRows(entries);
      if (lEl) lEl.innerHTML = renderLogs(entries);
      document.querySelectorAll("#nx-c-bar [data-c]").forEach((b) => {
        b.classList.toggle("is-on", b.getAttribute("data-c") === activeCycle);
      });
    }

    document.querySelectorAll("#nx-c-bar [data-c]").forEach((b) => {
      b.addEventListener("click", () => {
        activeCycle = b.getAttribute("data-c") || "all";
        const sel = document.getElementById("nx-c");
        if (sel && activeCycle !== "all") sel.value = activeCycle;
        refresh();
      });
    });

    const fp = document.getElementById("nx-fp");
    if (fp) {
      fp.addEventListener("change", () => {
        activeProject = fp.value || "all";
        refresh();
      });
    }

    const pInp = document.getElementById("nx-p");
    const sInp = document.getElementById("nx-s");
    if (pInp && sInp) {
      const sync = () => {
        const f = PROJECTS.find((x) => x.id === pInp.value);
        if (f) sInp.value = f.defaultStatus;
      };
      pInp.addEventListener("change", sync);
      sync();
    }

    const form = document.getElementById("nx-form");
    if (form) {
      form.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const fd = new FormData(form);
        const evd = String(fd.get("evidence") || "").trim();
        const fu = String(fd.get("followUp") || "").trim();
        if (!evd && !fu) return;
        saveEntries(loadEntries().concat({
          id: String(Date.now()),
          cycle: String(fd.get("cycle") || "daily"),
          role: String(fd.get("role") || ROLES[0]),
          projectId: String(fd.get("projectId") || PROJECTS[0].id),
          verificationStatus: String(fd.get("verificationStatus") || "Menunggu Data Nyata"),
          evidence: evd,
          followUp: fu,
          createdAt: new Date().toISOString()
        }));
        form.reset();
        if (pInp && sInp) {
          const f = PROJECTS.find((x) => x.id === pInp.value);
          if (f) sInp.value = f.defaultStatus;
        }
        refresh();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderApp);
  } else {
    renderApp();
  }
})();
