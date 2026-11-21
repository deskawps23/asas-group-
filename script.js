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

      target.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start"
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
