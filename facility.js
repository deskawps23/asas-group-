(() => {
  const bookingPanel = document.querySelector("#booking-panel");
  const bookingTitle = document.querySelector("#booking-title");
  const bookingStage = document.querySelector("#booking-stage");

  const services = {
    ironing: "Jasa Setrika"
  };

  const activeServiceConfig = {
    serviceCategory: "LAUNDRY_GARMENT_CARE",
    serviceType: "IRONING",
    orderMode: "ONE_TIME",
    engagementType: "SAM_NON_CONTRACT",
    fulfillmentMode: "PICKUP_DELIVERY",
    marketArea: "PANDEGLANG",
    serviceZone: "ZONE_1"
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
        <div class="estimate-card">
          <strong>${serviceName}</strong>
          <p>Pickup &amp; Delivery · Pandeglang Zona 1</p>

          <label class="estimate-label" for="estimated-weight">
            Estimasi berat
          </label>

          <div class="estimate-input-row">
            <input
              id="estimated-weight"
              class="estimate-input"
              type="number"
              inputmode="decimal"
              min="0.1"
              max="100"
              step="0.1"
              value="3"
            >
            <span>kg</span>
          </div>

          <div class="estimate-breakdown">
            <div>
              <span>Berat ditagihkan</span>
              <strong id="billable-weight">3 kg</strong>
            </div>

            <div>
              <span>Jasa Setrika</span>
              <strong id="service-cost">Rp15.000</strong>
            </div>

            <div>
              <span>Antar-jemput</span>
              <strong>Rp5.000</strong>
            </div>

            <div class="estimate-total">
              <span>Estimasi Total</span>
              <strong id="estimated-total">Rp20.000</strong>
            </div>
          </div>

          <p class="estimate-note">
            Minimum 3 kg. Berat pada booking adalah estimasi.
            Tagihan final mengikuti berat terverifikasi di hub.
          </p>
        </div>
      `
      : `
        <p>
          Pilih layanan untuk memulai.
          Booking production belum diaktifkan.
        </p>
      `;

    if (serviceName) {
      const weightInput =
        bookingStage.querySelector("#estimated-weight");

      const billableWeightEl =
        bookingStage.querySelector("#billable-weight");

      const serviceCostEl =
        bookingStage.querySelector("#service-cost");

      const estimatedTotalEl =
        bookingStage.querySelector("#estimated-total");

      const formatRupiah = (value) =>
        new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0
        }).format(value);

      const updateEstimate = () => {
        let requestedWeight =
          Number.parseFloat(weightInput.value);

        if (!Number.isFinite(requestedWeight)) {
          requestedWeight = 3;
        }

        requestedWeight =
          Math.min(Math.max(requestedWeight, 0.1), 100);

        const billableWeight =
          Math.max(requestedWeight, 3);

        const serviceCost =
          billableWeight * 5000;

        const deliveryCost = 5000;
        const total = serviceCost + deliveryCost;

        billableWeightEl.textContent =
          `${billableWeight.toLocaleString("id-ID")} kg`;

        serviceCostEl.textContent =
          formatRupiah(serviceCost);

        estimatedTotalEl.textContent =
          formatRupiah(total);
      };

      weightInput.addEventListener(
        "input",
        updateEstimate
      );

      updateEstimate();
    }

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
