from pathlib import Path

html_p = Path("super-admin.html")
js_p = Path("super-admin.js")

html = html_p.read_text(encoding="utf-8")
html = html.replace(
    "Kontrol Penuh Webapp · Zona 1 &amp; Satu Hub",
    "Pusat Kontrol Global ASAS · Seluruh Admin &amp; Operasional"
)
html = html.replace(
    '<option value="HUB_ADMIN">HUB_ADMIN</option>\n          <option value="SUPER_ADMIN">SUPER_ADMIN</option>',
    '<option value="HUB_ADMIN">HUB_ADMIN (Admin Hub / Zona)</option>\n          <option value="GLOBAL_ADMIN">GLOBAL_ADMIN (Admin Lintas Unit / Global)</option>\n          <option value="SUPER_ADMIN">SUPER_ADMIN (Kontrol Penuh ASAS)</option>'
)
html_p.write_text(html, encoding="utf-8")

js = js_p.read_text(encoding="utf-8")
js = js.replace(
    'zoneScope: ["Pandeglang", "Majasari", "Karang Tanjung", "Cadasari", "Kaduhejo", "Koroncong"],',
    'scope: role === "HUB_ADMIN" ? "ZONA_1_SATU_HUB" : "ASAS_GLOBAL_WORLD",\n      zoneScope: ["Pandeglang", "Majasari", "Karang Tanjung", "Cadasari", "Kaduhejo", "Koroncong"],'
)
js = js.replace(
    '${esc(a.role || "HUB_ADMIN")}',
    '${esc(a.role || "HUB_ADMIN")} · ${esc(a.scope || "ASAS_GLOBAL_WORLD")}'
)
js_p.write_text(js, encoding="utf-8")
print("SUPER_ADMIN_GLOBAL_OK")
