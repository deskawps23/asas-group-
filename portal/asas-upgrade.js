
const ASAS_CONFIG = {
  hubName: "SATU HUB • PILOT ZONA 1",
  baseTariffPerOrder: 5000,
  defaultRatePerKg: 5000
};

const ORDER_STATUSES = [
  "menunggu_penjemputan",
  "sedang_dijemput",
  "verifikasi_timbangan_billing",
  "sedang_disetrika",
  "siap_antar_ambil",
  "selesai"
];

function resolveOrdersCollection() {
  if (window.asasFirestore && typeof window.asasFirestore.collection === "function") {
    return window.asasFirestore.collection("serviceOrders");
  }
  if (window.db && typeof window.db.collection === "function") {
    return window.db.collection("serviceOrders");
  }
  return null;
}

export function calculateBilling(weightKg, ratePerKg = ASAS_CONFIG.defaultRatePerKg, extraFee = 0) {
  const w = Math.max(0, Number(weightKg) || 0);
  const r = Math.max(0, Number(ratePerKg) || 0);
  const e = Number(extraFee) || 0;
  const total = w > 0 ? Math.round(w * r + e) : Math.max(0, ASAS_CONFIG.baseTariffPerOrder + e);
  return { weightKg: w, ratePerKg: r, extraFee: e, totalBilling: total };
}

export function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(amount) || 0);
}

export function buildReceiptText(order = {}) {
  const billing = formatRupiah(order.billingTotal ?? order.totalBilling ?? ASAS_CONFIG.baseTariffPerOrder);
  const weight = order.weightKg ?? order.beratKg ?? "-";
  const status = order.status ?? "menunggu_penjemputan";
  const customer = order.customerName || order.namaPelanggan || "Pelanggan";
  const location = order.locationNote || order.patokanLokasi || order.alamat || "-";
  const orderId = order.id || "-";

  return [
    "*STRUK LAYANAN - ASAS FACILITY SERVICES*",
    ASAS_CONFIG.hubName,
    "--------------------------------",
    "ID Order : " + orderId,
    "Pelanggan: " + customer,
    "Lokasi   : " + location,
    "Berat    : " + weight + " kg",
    "Status   : " + status,
    "Total    : *" + billing + "*",
    "--------------------------------",
    "Terima kasih telah menggunakan ASAS Facility Services."
  ].join("\n");
}

export function summarizeDailyOrders(orders = [], targetDatePrefix = "") {
  const list = targetDatePrefix
    ? orders.filter((item) => String(item.createdAt || item.tanggal || "").startsWith(targetDatePrefix))
    : orders;
  let totalOmzet = 0;
  let completedCount = 0;
  const byStatus = {};
  for (const st of ORDER_STATUSES) byStatus[st] = 0;

  for (const item of list) {
    const st = item.status || "menunggu_penjemputan";
    byStatus[st] = (byStatus[st] || 0) + 1;
    const amount = Number(item.billingTotal ?? item.totalBilling ?? 0);
    if (st === "selesai" || amount > 0) totalOmzet += amount;
    if (st === "selesai") completedCount += 1;
  }

  return {
    totalOrders: list.length,
    completedCount,
    totalOmzet,
    totalOmzetFormatted: formatRupiah(totalOmzet),
    byStatus
  };
}

export async function updateOrderVerification(orderId, payload = {}) {
  if (!orderId) throw new Error("orderId wajib diisi.");
  const col = resolveOrdersCollection();
  if (!col) throw new Error("Koneksi Firestore belum tersedia di window.");

  const billingCalc = calculateBilling(
    payload.weightKg,
    payload.ratePerKg ?? ASAS_CONFIG.defaultRatePerKg,
    payload.extraFee ?? 0
  );

  const updateData = {
    weightKg: billingCalc.weightKg,
    ratePerKg: billingCalc.ratePerKg,
    billingTotal: billingCalc.totalBilling,
    status: ORDER_STATUSES.includes(payload.status) ? payload.status : "verifikasi_timbangan_billing",
    verifiedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await col.doc(String(orderId)).set(updateData, { merge: true });
  return { id: orderId, ...updateData };
}

const LOCAL_FAQ_RULES = [
  {
    keywords: ["tarif", "harga", "biaya", "5000", "rp5.000", "kg", "timbangan"],
    answer:
      "Layanan Jasa Setrika ASAS Facility Services (PILOT ZONA 1 • SATU HUB) mulai Rp5.000/order, dan berat timbangan serta total billing akan diverifikasi langsung di Satu Hub."
  },
  {
    keywords: ["cara pesan", "pesan", "order", "lokasi", "patokan", "jemput", "antar"],
    answer:
      "Untuk memesan Jasa Setrika, isi Patokan / Catatan Lokasi (opsional) lalu ketuk 'Pesan Sekarang'. Anda bisa memantau statusnya melalui tombol 'Lihat Order Saya' atau tab 'Order'."
  },
  {
    keywords: ["status", "cek order", "order saya", "riwayat", "sampai mana"],
    answer:
      "Silakan buka menu 'Order Saya' atau tab 'Order' di aplikasi untuk melihat status pesanan terbaru Anda."
  },
  {
    keywords: ["cleaning", "bersih", "layanan lain", "kapan buka"],
    answer:
      "Saat ini layanan aktif di PILOT ZONA 1 adalah Jasa Setrika. Layanan lain seperti Cleaning sedang dipersiapkan secara bertahap dan belum tersedia."
  },
  {
    keywords: ["hub", "satu hub", "kasir", "admin", "komplain", "bantuan"],
    answer:
      "Verifikasi timbangan dan billing dilakukan di Satu Hub. Jika butuh bantuan lanjutan atau penanganan khusus, silakan hubungi admin/petugas Satu Hub."
  }
];

export async function askAsasAssistant(question = "") {
  const text = String(question || "").trim();
  if (!text) {
    return {
      source: "system",
      reply: "Silakan ketik pertanyaan Anda seputar Jasa Setrika, tarif/timbangan, cara pesan, atau cek order."
    };
  }

  const lower = text.toLowerCase();
  for (const rule of LOCAL_FAQ_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return { source: "local-faq", reply: rule.answer };
    }
  }

  return {
    source: "fallback-hub",
    reply:
      "Pertanyaan Anda memerlukan pengecekan lanjutan oleh tim Satu Hub. Silakan cek menu 'Order Saya' untuk status pesanan atau hubungi admin/kasir Satu Hub."
  };
}
