from pathlib import Path

p = Path("facility.html")
s = p.read_text(encoding="utf-8")

helper_snippet = """
<script type="module">
import { buildHubWhatsAppUrl } from "./wa_order_helper.js";

const submitBtn = document.getElementById("fsBtnSubmitOrder");
const zoneSel = document.getElementById("fsZoneSelect");
const weightInp = document.getElementById("fsWeightInput");
const landmarkInp = document.getElementById("fsLandmarkInput");
const locStatus = document.getElementById("fsLocStatus");
const orderList = document.getElementById("orderListContainer");

let lastGeo = null;
document.getElementById("fsBtnShareLoc")?.addEventListener("click", () => {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      lastGeo = {
        lat: Number(pos.coords.latitude.toFixed(6)),
        lng: Number(pos.coords.longitude.toFixed(6)),
        accuracy: Number((pos.coords.accuracy || 0).toFixed(1))
      };
    },
    () => { lastGeo = null; },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
});

submitBtn?.addEventListener("click", () => {
  const zone = zoneSel?.value?.trim() || "";
  const w = parseFloat(weightInp?.value || "0");
  const lm = (landmarkInp?.value || "").trim();
  if (!zone || !Number.isFinite(w) || w <= 0) return;
  const code = "ASAS-Z1-" + String(Date.now()).slice(-4);
  const waUrl = buildHubWhatsAppUrl({
    orderCode: code,
    zone,
    estimatedWeightKg: w,
    landmark: lm,
    geo: lastGeo
  });
  if (orderList && orderList.firstElementChild) {
    const linkBox = document.createElement("div");
    linkBox.style.marginTop = "8px";
    linkBox.innerHTML = `<a href="${waUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:8px 12px;border-radius:10px;background:#16b981;color:#07192f;font-weight:700;font-size:12px;text-decoration:none;">Kirim Order ke WA (+6285779308809)</a>`;
    orderList.firstElementChild.appendChild(linkBox);
  }
  lastGeo = null;
  if (locStatus) locStatus.textContent = "";
  window.open(waUrl, "_blank", "noopener,noreferrer");
}, true);
</script>
"""

if "buildHubWhatsAppUrl" not in s:
    s = s.replace("</body>", helper_snippet.strip() + "\n</body>", 1)
    p.write_text(s, encoding="utf-8")
print("WIRED_WA_OK")
