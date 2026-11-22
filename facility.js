(() => {
  const bookingPanel = document.querySelector("#booking-panel");
  const bookingTitle = document.querySelector("#booking-title");
  const bookingStage = document.querySelector("#booking-stage");

  const services = {
    cleaning: "Cleaning",
    "garment-care": "Laundry & Garment Care",
    maintenance: "Maintenance",
    building: "Building & Facility"
  };

  function scrollToSection(id) {
    const target = document.getElementById(id);
    if (!target) return;

    target.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function openBooking(serviceKey = "") {
    if (!bookingPanel || !bookingTitle || !bookingStage) return;

    bookingPanel.hidden = false;

    const serviceName = services[serviceKey];

    bookingTitle.textContent = serviceName
      ? `Pesan ${serviceName}`
      : "Mulai pesanan";

    bookingStage.innerHTML = serviceName
      ? `
        <strong>${serviceName}</strong>
        <p>
          Pilih mode layanan untuk melanjutkan.
          Booking production belum diaktifkan.
        </p>
      `
      : `
        <p>
          Pilih layanan untuk memulai.
          Booking production belum diaktifkan.
        </p>
      `;

    bookingPanel.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  document.querySelectorAll("[data-service]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-service]").forEach((item) => {
        item.classList.remove("is-selected");
      });

      button.classList.add("is-selected");
      openBooking(button.dataset.service || "");
    });
  });

  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.mode;

      if (mode === "enterprise") {
        scrollToSection("enterprise");
        return;
      }

      openBooking();

      if (bookingStage) {
        bookingStage.innerHTML =
          mode === "scheduled"
            ? `
              <strong>Layanan Terjadwal</strong>
              <p>
                Pilih layanan terlebih dahulu.
                Availability production belum diaktifkan.
              </p>
            `
            : `
              <strong>Pesan Sekarang</strong>
              <p>
                Pilih layanan untuk memulai pesanan tanpa kontrak.
                Booking production belum diaktifkan.
              </p>
            `;
      }
    });
  });

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;

      if (action === "book-now") {
        scrollToSection("services");
      }

      if (action === "orders") {
        scrollToSection("orders");
      }

      if (action === "enterprise") {
        scrollToSection("enterprise");
      }
    });
  });

  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-nav]").forEach((item) => {
        item.classList.remove("is-active");
      });

      button.classList.add("is-active");

      const target = button.dataset.nav;
      if (target) scrollToSection(target);
    });
  });
})();
