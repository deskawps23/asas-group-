from pathlib import Path
p = Path("facility.html")
s = p.read_text(encoding="utf-8")
if "created design &amp; development by" not in s:
    s = s.replace("</main>", '<footer style="margin-top:18px;padding:14px 16px 136px;text-align:center;font-size:12px;color:#475569;">created design &amp; development by <strong style="color:#0f2744;">deskawps</strong></footer>\n</main>', 1)
p.write_text(s, encoding="utf-8")
print("DONE")
