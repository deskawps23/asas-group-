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

/* NEXUS GLIDE 2.2 */
(() => {
  if (!window.matchMedia("(max-width: 560px)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const scenes = [...document.querySelectorAll(".scene")];
  if (!scenes.length) return;

  let startY = 0;
  let startX = 0;
  let locked = false;

  const nearestScene = () => {
    let best = 0;
    let distance = Infinity;

    scenes.forEach((scene, index) => {
      const d = Math.abs(scene.getBoundingClientRect().top - 68);
      if (d < distance) {
        distance = d;
        best = index;
      }
    });

    return best;
  };

  document.addEventListener("touchstart", event => {
    if (locked || !event.touches.length) return;

    startY = event.touches[0].clientY;
    startX = event.touches[0].clientX;
  }, { passive: true });

  document.addEventListener("touchend", event => {
    if (locked || !event.changedTouches.length) return;

    const endY = event.changedTouches[0].clientY;
    const endX = event.changedTouches[0].clientX;

    const dy = startY - endY;
    const dx = startX - endX;

    if (Math.abs(dx) > Math.abs(dy)) return;
    if (Math.abs(dy) < 45) return;

    const current = nearestScene();
    const next = dy > 0
      ? Math.min(current + 1, scenes.length - 1)
      : Math.max(current - 1, 0);

    if (next === current) return;

    locked = true;

    scenes[next].scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    window.setTimeout(() => {
      locked = false;
    }, 650);
  }, { passive: true });
})();
