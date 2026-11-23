from pathlib import Path

p = Path("facility.html")
s = p.read_text(encoding="utf-8")

extra_css = """
/* Polish UI */
.fs-service-card { padding: 14px 12px; gap: 10px; border-radius: 18px; }
.fs-service-card strong { font-size: 14.5px; line-height: 1.25; }
.fs-service-card small { font-size: 11.5px; line-height: 1.35; }
.fs-hero h1 { font-size: 26px; letter-spacing: -0.35px; }
.fs-order-card { border-radius: 18px; padding: 15px; }
"""

if "/* Polish UI */" not in s:
    s = s.replace("</style>", extra_css + "</style>", 1)

p.write_text(s, encoding="utf-8")
print("POLISHED_OK")
