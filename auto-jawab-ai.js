const ADMIN_WA = "6285695272863";
const fmt = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");

function jawabOtomatis(teks) {
  const q = String(teks || "").trim();
  const s = q.toLowerCase();
  if (!q) return "Ketik pertanyaan: tarif/kg, cara pesan, bayar (CASH/QRIS), bagi hasil, atau admin.";
  if (s.includes("tarif") || s.includes("harga") || s.includes("kg")) {
    return "Tarif setrika standar Rp 6.000/kg. Total akhir dihitung dari berat aktual kasir x tarif/kg. WA Admin: " + ADMIN_WA;
  }
  if (s.includes("pesan") || s.includes("order") || s.includes("cara")) {
    return "Pesan lewat order.html (Nama, No. WA, Alamat Jemput, Estimasi Berat), lalu konfirmasi ke WA Admin " + ADMIN_WA + ".";
  }
  if (s.includes("bayar") || s.includes("cash") || s.includes("qris") || s.includes("lunas")) {
    return "Pembayaran mendukung CASH dan QRIS. Order masuk berstatus MENUNGGU_VERIFIKASI hingga ditimbang & dilunasi kasir (LUNAS).";
  }
  if (s.includes("bagi") || s.includes("tim") || s.includes("setrika") || s.includes("kurir")) {
    return "Bagi hasil: Tim 15% (Setrika 40%, Kurir 25%, Admin 20%, PIC 15%), Operasional 25%, Pusat 60%.";
  }
  if (s.includes("admin") || s.includes("wa") || s.includes("kontak")) {
    return "Kontak Admin: " + ADMIN_WA + " (https://wa.me/" + ADMIN_WA + ")";
  }
  return "Auto-Jawab AI: Pertanyaan '" + q + "' diterima. Tanya tarif/kg, cara pesan, bayar, bagi hasil, atau WA " + ADMIN_WA + ".";
}

function pasangAutoJawab() {
  const inp = Array.from(document.querySelectorAll("input, textarea")).find((el) =>
    /tarif|tanya|pertanyaan|ai|chat/i.test((el.placeholder || "") + " " + (el.id || ""))
  );
  if (!inp) return;
  const box = inp.closest("section, div, form") || document.body;
  const btn = Array.from(box.querySelectorAll("button")).find((b) => /kirim|tanya|jawab/i.test(b.textContent || ""));
  const out = box.querySelector("[id*='ai'], [id*='answer'], [id*='output'], div:last-of-type");

  const run = () => {
    if (!inp.value.trim()) return;
    if (out) out.textContent = jawabOtomatis(inp.value);
  };

  inp.addEventListener("input", run);
  inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); run(); } });
  if (btn) btn.addEventListener("click", (e) => { e.preventDefault(); run(); });
}

document.addEventListener("DOMContentLoaded", pasangAutoJawab);
