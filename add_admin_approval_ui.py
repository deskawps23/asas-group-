from pathlib import Path

p = Path("admin-facility.html")
s = p.read_text(encoding="utf-8")

approval_box = """
    <div class="box" id="superAdminApprovalBox" style="display:none;border-color:#16b981;">
      <strong style="display:block;font-size:15px;margin-bottom:4px;">Persetujuan Pendaftaran Admin (Super Admin)</strong>
      <div class="meta" style="margin-bottom:10px;">Setujui (approve) pengajuan calon admin/operator Satu Hub sebelum akses operasional aktif.</div>
      <div id="pendingAdminList">
        <p class="meta" style="margin:0;">Memuat pengajuan admin...</p>
      </div>
    </div>
"""

anchor = '<div id="adminOrderList">'
if 'id="superAdminApprovalBox"' not in s and anchor in s:
    s = s.replace(anchor, approval_box.strip() + "\n    " + anchor, 1)
    p.write_text(s, encoding="utf-8")
    print("APPROVAL_UI_OK")
else:
    print("SKIPPED_APPROVAL_UI")
