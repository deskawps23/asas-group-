(() => {
  const mapEl = document.getElementById("geoMap");
  const earlyStatus = document.getElementById("geoMeasureStatus");

  if (!mapEl) {
    if (earlyStatus) {
      earlyStatus.textContent = "ERROR: container peta tidak ditemukan.";
    }
    return;
  }

  if (typeof L === "undefined") {
    if (earlyStatus) {
      earlyStatus.textContent =
        "ERROR: mesin peta Leaflet gagal dimuat. Periksa koneksi atau pemuatan CDN.";
    }
    mapEl.innerHTML =
      '<div style="padding:20px;color:#fff">Peta gagal dimuat.</div>';
    return;
  }

  const standardBtn = document.getElementById("geoMapStandard");
  const satelliteBtn = document.getElementById("geoMapSatellite");
  const locateBtn = document.getElementById("geoLocate");
  const measureBtn = document.getElementById("geoMeasure");
  const finishBtn = document.getElementById("geoFinish");
  const undoBtn = document.getElementById("geoUndo");
  const resetBtn = document.getElementById("geoReset");
  const editBtn = document.getElementById("geoEdit");
  const exportBtn = document.getElementById("geoExport");

  const statusEl = document.getElementById("geoMeasureStatus");
  const areaSqmEl = document.getElementById("geoAreaSqm");
  const areaHaEl = document.getElementById("geoAreaHa");
  const perimeterEl = document.getElementById("geoPerimeter");

  let measuring = false;
  let finished = false;
  let editing = false;
  let points = [];
  let vertexMarkers = [];

  let lineLayer = null;
  let polygonLayer = null;
  let pointLayer = null;
  let locationMarker = null;
  let locationCircle = null;

  const map = L.map(mapEl, {
    zoomControl: true,
    attributionControl: true
  });

  const standardLayer = L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }
  );

  const satelliteLayer = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom: 19,
      attribution:
        'Powered by Esri | Sources: Esri and imagery providers'
    }
  );

  standardLayer.addTo(map);

  function setBasemap(mode) {
    const useSatellite = mode === "satellite";

    if (useSatellite) {
      if (map.hasLayer(standardLayer)) {
        map.removeLayer(standardLayer);
      }
      if (!map.hasLayer(satelliteLayer)) {
        satelliteLayer.addTo(map);
      }
    } else {
      if (map.hasLayer(satelliteLayer)) {
        map.removeLayer(satelliteLayer);
      }
      if (!map.hasLayer(standardLayer)) {
        standardLayer.addTo(map);
      }
    }

    standardBtn.classList.toggle("is-active", !useSatellite);
    satelliteBtn.classList.toggle("is-active", useSatellite);

    setStatus(
      useSatellite
        ? "Basemap Satellite aktif."
        : "Basemap Standard aktif."
    );
  }

  standardBtn.addEventListener("click", () => {
    setBasemap("standard");
  });

  satelliteBtn.addEventListener("click", () => {
    setBasemap("satellite");
  });

  /*
   * Tidak menggunakan koordinat contoh.
   * Peta menunggu geolocation perangkat sebelum menentukan view awal.
   */
  map.fitWorld();

  function setStatus(message) {
    statusEl.textContent = message;
  }

  function setButtons() {
    finishBtn.disabled = !measuring || points.length < 3;
    undoBtn.disabled = !measuring || points.length === 0;
    resetBtn.disabled = points.length === 0;
    editBtn.disabled = !finished || points.length < 3;
    exportBtn.disabled = !finished || points.length < 3;
  }

  function formatNumber(value, decimals = 2) {
    if (!Number.isFinite(value)) return "—";

    return value.toLocaleString("id-ID", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function distanceMeters(a, b) {
    return map.distance(a, b);
  }

  function perimeterMeters(coords) {
    if (coords.length < 2) return 0;

    let total = 0;

    for (let i = 1; i < coords.length; i += 1) {
      total += distanceMeters(coords[i - 1], coords[i]);
    }

    if (coords.length >= 3) {
      total += distanceMeters(
        coords[coords.length - 1],
        coords[0]
      );
    }

    return total;
  }

  /*
   * Spherical polygon area.
   * Menghitung luas permukaan dari koordinat lat/lng pengguna.
   */
  function sphericalAreaSqm(coords) {
    if (coords.length < 3) return 0;

    const radius = 6378137;
    const rad = Math.PI / 180;
    let sum = 0;

    for (let i = 0; i < coords.length; i += 1) {
      const current = coords[i];
      const next = coords[(i + 1) % coords.length];

      const lon1 = current.lng * rad;
      const lon2 = next.lng * rad;
      const lat1 = current.lat * rad;
      const lat2 = next.lat * rad;

      sum +=
        (lon2 - lon1) *
        (2 + Math.sin(lat1) + Math.sin(lat2));
    }

    return Math.abs(sum * radius * radius / 2);
  }

  function clearGeometryLayers() {
    if (lineLayer) {
      map.removeLayer(lineLayer);
      lineLayer = null;
    }

    if (polygonLayer) {
      map.removeLayer(polygonLayer);
      polygonLayer = null;
    }

    if (pointLayer) {
      map.removeLayer(pointLayer);
      pointLayer = null;
    }
  }

  function renderGeometry() {
    clearGeometryLayers();

    if (!points.length) return;

    pointLayer = L.layerGroup(
      points.map((latlng) =>
        L.circleMarker(latlng, {
          radius: 5,
          color: "#ffffff",
          weight: 2,
          fillColor: "#d92c38",
          fillOpacity: 1
        })
      )
    ).addTo(map);

    if (finished && points.length >= 3) {
      polygonLayer = L.polygon(points, {
        color: "#ff5f68",
        weight: 3,
        fillColor: "#d92c38",
        fillOpacity: 0.18
      }).addTo(map);
    } else if (points.length >= 2) {
      lineLayer = L.polyline(points, {
        color: "#ff5f68",
        weight: 3,
        dashArray: "7 6"
      }).addTo(map);
    }
 }

  function updateMeasurements() {
    if (!finished || points.length < 3) {
      areaSqmEl.textContent = "—";
      areaHaEl.textContent = "—";
      perimeterEl.textContent = "—";
      return;
    }

    const area = sphericalAreaSqm(points);
    const hectares = area / 10000;
    const perimeter = perimeterMeters(points);

    areaSqmEl.textContent = formatNumber(area);
    areaHaEl.textContent = formatNumber(hectares, 4);
    perimeterEl.textContent = formatNumber(perimeter);
  }

  function clearVertexMarkers() {
    vertexMarkers.forEach((marker) => map.removeLayer(marker));
    vertexMarkers = [];
  }

  function renderVertexMarkers() {
    clearVertexMarkers();

    if (!editing || !finished) return;

    vertexMarkers = points.map((latlng, index) => {
      const marker = L.marker(latlng, {
        draggable: true,
        icon: L.divIcon({
          className: "geo-vertex-icon",
          html: '<span class="geo-vertex-handle"></span>',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      }).addTo(map);

      marker.on("drag", (event) => {
        points[index] = event.target.getLatLng();

        if (polygonLayer) {
          polygonLayer.setLatLngs(points);
        }

        updateMeasurements();
      });

      marker.on("dragend", (event) => {
        points[index] = event.target.getLatLng();

        if (polygonLayer) {
          polygonLayer.setLatLngs(points);
        }

        updateMeasurements();
        setStatus(
          `Vertex ${index + 1} diperbarui. Luas dihitung ulang.`
        );
      });

      return marker;
    });
  }

  function resetMeasurement() {
    measuring = false;
    finished = false;
    editing = false;
    points = [];

    clearVertexMarkers();
    clearGeometryLayers();
    updateMeasurements();

    mapEl.classList.remove("is-measuring");
    measureBtn.textContent = "Ukur Bidang";

    setStatus("Peta siap.");
    setButtons();
  }

  measureBtn.addEventListener("click", () => {
    if (finished) {
      resetMeasurement();
    }

    measuring = !measuring;

    mapEl.classList.toggle("is-measuring", measuring);

    measureBtn.textContent = measuring
      ? "Batalkan Ukur"
      : "Ukur Bidang";

    setStatus(
      measuring
        ? "Ketuk titik-titik batas bidang pada peta."
        : "Mode ukur dijeda."
    );

    setButtons();
  });

  map.on("click", (event) => {
    if (!measuring || finished) return;

    points.push(event.latlng);

    renderGeometry();

    setStatus(
      `${points.length} titik batas dipilih.`
    );

    setButtons();
  });

  undoBtn.addEventListener("click", () => {
    if (!measuring || !points.length) return;

    points.pop();
    renderGeometry();

    setStatus(
      points.length
        ? `${points.length} titik batas tersisa.`
        : "Belum ada titik batas."
    );

    setButtons();
  });

  finishBtn.addEventListener("click", () => {
    if (!measuring || points.length < 3) return;

    measuring = false;
    finished = true;

    mapEl.classList.remove("is-measuring");
    measureBtn.textContent = "Ukur Bidang Baru";

    renderGeometry();
    updateMeasurements();

    setStatus(
      "Polygon selesai. Luas digital telah dihitung."
    );

    setButtons();
  });

  editBtn.addEventListener("click", () => {
    if (!finished || points.length < 3) return;

    editing = !editing;

    editBtn.textContent = editing
      ? "Selesai Edit"
      : "Edit Vertex";

    if (editing) {
      renderVertexMarkers();
      setStatus(
        "Mode Edit Vertex aktif. Geser marker pada sudut polygon."
      );
    } else {
      clearVertexMarkers();
      renderGeometry();
      updateMeasurements();
      setStatus(
        "Edit Vertex selesai. Luas digital telah dihitung ulang."
      );
    }

    setButtons();
  });

  resetBtn.addEventListener("click", resetMeasurement);

  locateBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      setStatus("Geolocation tidak tersedia pada perangkat.");
      return;
    }

    setStatus("Mencari lokasi perangkat...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latlng = L.latLng(
          position.coords.latitude,
          position.coords.longitude
        );

        if (locationMarker) {
          map.removeLayer(locationMarker);
        }

        if (locationCircle) {
          map.removeLayer(locationCircle);
        }

        locationMarker = L.circleMarker(latlng, {
          radius: 7,
          color: "#ffffff",
          weight: 2,
          fillColor: "#2979ff",
          fillOpacity: 1
        }).addTo(map);

        if (
          Number.isFinite(position.coords.accuracy) &&
          position.coords.accuracy > 0
        ) {
          locationCircle = L.circle(latlng, {
            radius: position.coords.accuracy,
            color: "#2979ff",
            weight: 1,
            fillColor: "#2979ff",
            fillOpacity: 0.08
          }).addTo(map);
        }

        map.setView(latlng, 19);

        setStatus(
          "Lokasi perangkat ditemukan. Silakan mulai ukur bidang."
        );
      },
      () => {
        setStatus(
          "Lokasi tidak tersedia atau izin lokasi belum diberikan."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  });

  exportBtn.addEventListener("click", () => {
    if (!finished || points.length < 3) return;

    const coordinates = points.map((point) => [
      point.lng,
      point.lat
    ]);

    coordinates.push([...coordinates[0]]);

    const geojson = {
      type: "Feature",
      properties: {
        source: "ASAS Nexus Geo Workspace",
        measurementType: "digital-analysis",
        areaSqm: sphericalAreaSqm(points),
        perimeterM: perimeterMeters(points)
      },
      geometry: {
        type: "Polygon",
        coordinates: [coordinates]
      }
    };

    const blob = new Blob(
      [JSON.stringify(geojson, null, 2)],
      { type: "application/geo+json" }
    );

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "asas-nexus-field.geojson";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);

    setStatus("GeoJSON berhasil disiapkan untuk diunduh.");
  });

  setButtons();

  window.addEventListener("resize", () => {
    map.invalidateSize();
  });
})();
