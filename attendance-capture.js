(() => {
  const checkInBtn = document.getElementById("attendanceCheckIn");
  const checkOutBtn = document.getElementById("attendanceCheckOut");
  const locationBtn = document.getElementById("attendanceLocation");
  const photoInput = document.getElementById("attendancePhoto");
  const photoWrap = document.getElementById("attendancePhotoPreviewWrap");
  const photoPreview = document.getElementById("attendancePhotoPreview");
  const submitBtn = document.getElementById("attendanceSubmit");

  const locationStatus = document.getElementById("attendanceLocationStatus");
  const latEl = document.getElementById("attendanceLat");
  const lngEl = document.getElementById("attendanceLng");
  const accuracyEl = document.getElementById("attendanceAccuracy");

  const previewType = document.getElementById("attendancePreviewType");
  const capturedAtEl = document.getElementById("attendanceCapturedAt");
  const previewLocation = document.getElementById("attendancePreviewLocation");
  const statusEl = document.getElementById("attendanceStatus");

  let attendanceType = null;
  let locationData = null;
  let photoFile = null;
  let photoUrl = null;
  let capturedAt = null;
  const MAX_LOCATION_ACCURACY_METERS = 30;

  function setStatus(message) {
    statusEl.textContent = message;
  }

  function updateReadyState() {
    const ready =
      Boolean(attendanceType) &&
      Boolean(locationData) &&
      Number.isFinite(locationData?.accuracy) &&
      locationData.accuracy <= MAX_LOCATION_ACCURACY_METERS &&
      Boolean(photoFile) &&
      Boolean(capturedAt);

    submitBtn.disabled = !ready;

    if (locationData && Number.isFinite(locationData.accuracy) && locationData.accuracy > MAX_LOCATION_ACCURACY_METERS) {
      setStatus(`Akurasi lokasi ±${locationData.accuracy.toFixed(1)} m belum memenuhi batas ${MAX_LOCATION_ACCURACY_METERS} m. Pindah ke area lebih terbuka, lalu pilih Perbarui Lokasi.`);
      return;
    }


    if (ready) {
      setStatus(
        "Attendance siap diperiksa dan dikirim."
      );
    }
  }

  function setAttendanceType(type) {
    attendanceType = type;

    checkInBtn.classList.toggle(
      "is-active",
      type === "check-in"
    );

    checkOutBtn.classList.toggle(
      "is-active",
      type === "check-out"
    );

    previewType.textContent =
      type === "check-in"
        ? "Check In"
        : "Check Out";

    updateReadyState();
  }

  checkInBtn.addEventListener("click", () => {
    setAttendanceType("check-in");
  });

  checkOutBtn.addEventListener("click", () => {
    setAttendanceType("check-out");
  });

  locationBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      locationStatus.textContent =
        "Geolocation tidak tersedia pada perangkat.";
      setStatus("Lokasi perangkat tidak tersedia.");
      return;
    }

    locationBtn.disabled = true;
    locationStatus.textContent =
      "Mencari lokasi perangkat...";
    setStatus("Mengambil geotag attendance...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        capturedAt = new Date();

        locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          capturedAt: capturedAt.toISOString()
        };

        latEl.textContent =
          locationData.latitude.toFixed(6);

        lngEl.textContent =
          locationData.longitude.toFixed(6);

        accuracyEl.textContent =
          Number.isFinite(locationData.accuracy)
            ? locationData.accuracy.toFixed(1)
            : "—";

        locationStatus.textContent =
          "Lokasi perangkat berhasil diambil.";

        capturedAtEl.textContent =
          capturedAt.toLocaleString("id-ID");

        previewLocation.textContent =
          `${locationData.latitude.toFixed(6)}, ` +
          `${locationData.longitude.toFixed(6)} · ` +
          `±${locationData.accuracy.toFixed(1)} m`;

        locationBtn.textContent =
          "Perbarui Lokasi";

        locationBtn.disabled = false;

        updateReadyState();
      },
      (error) => {
        locationBtn.disabled = false;

        locationStatus.textContent =
          "Lokasi gagal diambil.";

        if (error.code === 1) {
          setStatus(
            "Izin lokasi ditolak. Attendance memerlukan geotag."
          );
        } else if (error.code === 2) {
          setStatus(
            "Lokasi perangkat sedang tidak tersedia."
          );
        } else {
          setStatus(
            "Pengambilan lokasi melewati batas waktu."
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  });

  photoInput.addEventListener("change", () => {
    const file = photoInput.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      photoInput.value = "";
      setStatus("File attendance harus berupa gambar.");
      return;
    }

    photoFile = file;

    if (photoUrl) {
      URL.revokeObjectURL(photoUrl);
    }

    photoUrl = URL.createObjectURL(file);

    photoPreview.src = photoUrl;
    photoWrap.hidden = false;

    setStatus(
      "Foto attendance berhasil diambil."
    );

    updateReadyState();
  });

  submitBtn.addEventListener("click", () => {
    if (
      !attendanceType ||
      !locationData ||
      !photoFile ||
      !capturedAt
    ) {
      setStatus(
        "Lengkapi type, lokasi, dan foto sebelum mengirim."
      );
      return;
    }

    /*
     * Production write sengaja belum dilakukan.
     * Foto membutuhkan private Storage yang belum aktif.
     * attendanceRecords akan diaktifkan setelah
     * backend + rules final tersedia.
     */

    setStatus(
      "Capture lengkap. Penyimpanan production belum diaktifkan."
    );
  });

  window.addEventListener("beforeunload", () => {
    if (photoUrl) {
      URL.revokeObjectURL(photoUrl);
    }
  });
})();
