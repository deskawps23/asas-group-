async function loadASASData() {
  try {
    const response = await fetch(
      "./data/dashboard-data.json?ts=" + Date.now(),
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }

    const data = await response.json();

    document.querySelectorAll("[data-sync-time]").forEach((element) => {
      element.textContent = data.generatedAt || "-";
    });

    const records = data.datasets?.CHRO_People || [];

    const workforceRecords = records.filter((record) => {
      return (
        record.Metric === "Headcount" &&
        record.Status === "Published"
      );
    });

    if (workforceRecords.length === 0) {
      throw new Error("Published Headcount tidak ditemukan");
    }

    workforceRecords.sort((a, b) =>
      String(a.Period).localeCompare(String(b.Period))
    );

    const latest = workforceRecords[workforceRecords.length - 1];

    const actual = Number(latest.Actual || 0);
    const plan = Number(latest.Plan || 0);

    document
      .querySelectorAll('[data-kpi="workforce-actual"]')
      .forEach((element) => {
        element.textContent = actual.toLocaleString("id-ID");
      });

    document
      .querySelectorAll('[data-kpi="workforce-period"]')
      .forEach((element) => {
        element.textContent = latest.Period || "-";
      });

    document
      .querySelectorAll('[data-kpi="workforce-achievement"]')
      .forEach((element) => {
        element.textContent =
          plan > 0
            ? ((actual / plan) * 100).toFixed(1) + "%"
            : "-";
      });

  } catch (error) {
    console.error("ASAS DATA ERROR:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadASASData);
      
