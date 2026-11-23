from pathlib import Path

p = Path("admin-facility.html")
s = p.read_text(encoding="utf-8")

reg_block = """
    <div class="box" id="superAdminRegBox" style="display:none;border-color:#16b981;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;">
        <div>
          <strong style="font-size:15px;">Daftarkan Admin / Operator Satu Hub</strong>
          <div class="meta">Akses khusus Super Admin ASAS</div>
        </div>
        <button type="button" id="btnToggleRegForm" style="padding:6px 11px;border-radius:999px;border:1px solid #334155;background:#07192f;color:#5eead4;font-size:12px;font-weight:700;cursor:pointer;">Buka Form</button>
      </div>
      <div id="superAdminRegForm" style="display:none;">
        <label for="regAdminUid">UID Firebase Auth Admin Baru</label>
        <input id="regAdminUid" type="text" placeholder="Salin UID dari Firebase Authentication > Users" />
        <label for="regAdminEmail">Email Admin</label>
        <input id="regAdminEmail" type="email" placeholder="operator.z1@asas.local" />
        <label for="regAdminName">Nama Operator / Penimbang Hub</label>
        <input id="regAdminName" type="text" placeholder="Nama lengkap operator" />
        <label for="regAdminRole">Peran (Role)</label>
        <select id="regAdminRole">
          <option value="HUB_ADMIN">HUB_ADMIN (Operator Timbangan &amp; Billing)</option>
          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
        </select>
        <button type="button" id="btnSaveHubAdmin" class="btn-save">Simpan Akses Admin Satu Hub</button>
        <div id="regAdminStatus" class="meta" style="margin-top:8px;"></div>
      </div>
    </div>
"""

anchor = '<div id="adminOrderList">'
if 'id="superAdminRegBox"' not in s and anchor in s:
    s = s.replace(anchor, reg_block.strip() + "\n    " + anchor, 1)
    p.write_text(s, encoding="utf-8")
    print("SUPER_ADMIN_UI_OK")
else:
    print("SKIPPED_OR_ALREADY_ADDED")
