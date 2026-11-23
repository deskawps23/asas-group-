export const WA_HUB_NUMBER = "6285779308809";

export function buildHubWhatsAppUrl(order) {
  const geoLine =
    order.geo && typeof order.geo.lat === "number" && typeof order.geo.lng === "number"
      ? `Geotag: ${order.geo.lat}, ${order.geo.lng} (±${Math.round(order.geo.accuracy || 0)}m)\nPeta: https://www.google.com/maps?q=${order.geo.lat},${order.geo.lng}`
      : "Geotag: Konfirmasi titik jemput kurir Zona 1";

  const landmarkLine = order.landmark
    ? `Patokan: ${order.landmark}`
    : "Patokan: -";

  const text = [
    "Halo Admin ASAS Facility Services (Satu Hub)",
    `Order Baru: *${order.orderCode}*`,
    "Layanan: Jasa Setrika (Zona 1)",
    `Kecamatan: *${order.zone}*`,
    `Estimasi Berat: *${order.estimatedWeightKg} kg*`,
    landmarkLine,
    geoLine,
    "Catatan: Berat timbangan & billing final diverifikasi di Satu Hub."
  ].join("\n");

  return `https://wa.me/${WA_HUB_NUMBER}?text=${encodeURIComponent(text)}`;
}
