document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
    });

    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const domainData = {
    land: [
      "Land & Assets",
      "Business → People → Geography → Asset → Project → Data"
    ],
    property: [
      "Property & Housing",
      "Development → Project → People → Asset → Geo → Data"
    ],
    healthcare: [
      "Healthcare",
      "Healthcare → People → Facility → Project → Geo → Data"
    ],
    facility: [
      "Facility Services",
      "Client Need → People → Site → Service → Evidence → Data"
    ],
    aviation: [
      "Aviation",
      "Aviation → People → Facility → Operations → Geo → Data"
    ],
    maritime: [
      "Maritime",
      "Maritime → Asset → People → Environment → Geo → Data"
    ]
  };

  const domainTitle = document.getElementById("domainTitle");
  const domainFlow = document.getElementById("domainFlow");

  document.querySelectorAll(".domain-card").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".domain-card").forEach(item => {
        item.classList.remove("active");
      });

      card.classList.add("active");

      const selected = domainData[card.dataset.domain];

      if (selected && domainTitle && domainFlow) {
        domainTitle.textContent = selected[0];
        domainFlow.textContent = selected[1];
      }
    });
  });

  const geoNames = {
    land: "Land & Assets",
    healthcare: "Healthcare",
    property: "Property & Housing",
    facility: "Facility Services",
    aviation: "Aviation",
    maritime: "Maritime",
    people: "People & Culture",
    projects: "Projects",
    environment: "Environment",
    risk: "Risk"
  };

  const geoTitle = document.getElementById("geoLayerTitle");

  document.querySelectorAll(".layer-toggle").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".layer-toggle").forEach(item => {
        item.classList.remove("active");
      });

      button.classList.add("active");

      if (geoTitle) {
        geoTitle.textContent =
          geoNames[button.dataset.layer] || button.textContent.trim();
      }
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
      const selector = link.getAttribute("href");

      if (!selector || selector === "#") return;

      const target = document.querySelector(selector);

      if (!target) return;

      event.preventDefault();

      const reduceMotion =
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const header = document.querySelector(".nexus-header");
      const headerHeight = header ? header.offsetHeight : 68;
      const targetTop =
        window.scrollY +
        target.getBoundingClientRect().top -
        headerHeight;

      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: reduceMotion ? "auto" : "smooth"
      });
    });
  });

  const scenes = document.querySelectorAll(".scene");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("scene-visible");
        }
      });
    }, {
      threshold: 0.18
    });

    scenes.forEach(scene => observer.observe(scene));
  }

  console.log("ASAS Nexus 2.0 initialized");
});

/* BUSINESS DOMAIN DRILLDOWN */
(() => {
  const panel = document.getElementById("domainDrilldown");
  if (!panel) return;

  const details = {
    land: [
      "Land Acquisition",
      "Land Management",
      "Asset Management",
      "GIS & Mapping",
      "Project / Site",
      "Evidence",
      "Metadata"
    ],
    property: [
      "Property Development",
      "Housing & Residential",
      "Construction",
      "Asset Management",
      "Project / Site",
      "GIS & Mapping",
      "Metadata"
    ],
    healthcare: [
      "Hospital Development",
      "Healthcare Facility",
      "Workforce",
      "Project / Site",
      "Service",
      "Evidence",
      "Metadata"
    ],
    facility: [
      "Facility Management",
      "Building Operations",
      "Maintenance",
      "Utilities",
      "Workforce",
      "Service Evidence",
      "Metadata"
    ],
    aviation: [
      "Aviation Operations",
      "Ground Operations",
      "Facility",
      "Safety & HSE",
      "Fleet & Equipment",
      "Workforce",
      "Metadata"
    ],
    maritime: [
      "Maritime Services",
      "Ship Recycling",
      "Asset Management",
      "Environment",
      "Material Recovery",
      "Project / Site",
      "Metadata"
    ]
  };

  const render = key => {
    const items = details[key];
    if (!items) return;

    panel.innerHTML = items
      .map(item => `<button type="button">${item}</button>`)
      .join("");
  };

  document.querySelectorAll(".domain-card").forEach(card => {
    card.addEventListener("click", () => {
      render(card.dataset.domain);
    });
  });

  render("land");
})();

/* NEXUS BUSINESS DETAIL */
(() => {
  const overlay = document.getElementById("businessDetail");
  const panel = document.getElementById("domainDrilldown");
  const title = document.getElementById("businessDetailTitle");
  const domain = document.getElementById("businessDetailDomain");
  const content = document.getElementById("businessDetailContent");

  if (!overlay || !panel || !title || !content) return;

  let activeDomain = "Land & Assets";

  document.querySelectorAll(".domain-card").forEach(card => {
    card.addEventListener("click", () => {
      const strong = card.querySelector("strong");
      if (strong) activeDomain = strong.textContent.trim();
    });
  });

  const showContent = label => {
    content.innerHTML = `
      <strong>Menunggu Integrasi Data</strong>
      <p>
        ${label} akan menampilkan data terverifikasi,
        metadata, evidence dan hubungan Nexus yang
        tersedia sesuai role serta kewenangan pengguna.
      </p>
    `;
  };

  panel.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;

    title.textContent = button.textContent.trim();
    domain.textContent = activeDomain.toUpperCase();
    showContent(button.textContent.trim());

    overlay.hidden = false;
    document.body.style.overflow = "hidden";
  });

  document.querySelectorAll("[data-close-detail]").forEach(button => {
    button.addEventListener("click", () => {
      overlay.hidden = true;
      document.body.style.overflow = "";
    });
  });

  document.querySelectorAll("[data-detail-tab]").forEach(button => {
    button.addEventListener("click", () => {
      showContent(button.textContent.trim());
    });
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !overlay.hidden) {
      overlay.hidden = true;
      document.body.style.overflow = "";
    }
  });
})();

/* BUSINESS SELECTOR SEPARATION */
(() => {
  const selector = document.querySelector(".business-network");
  const focus = document.querySelector(".domain-focus");

  if (!selector || !focus) return;

  if (focus.parentElement === selector) {
    selector.after(focus);
  }
})();
