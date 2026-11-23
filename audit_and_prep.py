from pathlib import Path

html_path = Path("facility.html")
wa_path = Path("wa_order_helper.js")

assert html_path.exists(), "ERROR: facility.html tidak ditemukan di direktori ini!"
assert wa_path.exists(), "ERROR: wa_order_helper.js tidak ditemukan di direktori ini!"

html_text = html_path.read_text(encoding="utf-8")
wa_text = wa_path.read_text(encoding="utf-8")

assert "6285779308809" in wa_text, "ERROR: Nomor WA 6285779308809 belum ada di wa_order_helper.js"
assert "deskawps" in html_text, "ERROR: Kredit deskawps belum ada di facility.html"

# Pastikan <title> dan kredit tampil rapi
print("AUDIT_OK: facility.html & wa_order_helper.js valid.")
