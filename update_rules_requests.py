from pathlib import Path

p = Path("firestore.rules")
s = p.read_text(encoding="utf-8")

req_rule = """
    // Pengajuan calon admin/operator (menunggu approval Super Admin)
    match /adminRequests/{reqId} {
      allow read: if isSuperAdmin();
      allow create: if isSignedIn()
        && request.resource.data.keys().hasOnly([
          'uid',
          'email',
          'name',
          'status',
          'approved',
          'createdAt'
        ])
        && request.resource.data.uid == request.auth.uid
        && request.resource.data.status == 'PENDING_APPROVAL'
        && request.resource.data.approved == false
        && request.resource.data.createdAt == request.time;
      allow update: if isSuperAdmin()
        && request.resource.data.status in ['APPROVED', 'REJECTED'];
      allow delete: if isSuperAdmin();
    }
"""

anchor = "    match /hubAdmins/{adminUid} {"
if "match /adminRequests/" not in s and anchor in s:
    s = s.replace(anchor, req_rule.strip() + "\n\n" + anchor, 1)
    p.write_text(s, encoding="utf-8")
    print("RULES_REQUESTS_OK")
else:
    print("SKIPPED_RULES_REQUESTS")
