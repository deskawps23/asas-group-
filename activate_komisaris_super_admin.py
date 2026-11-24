#!/usr/bin/env python3
import json
import re
import urllib.request
import urllib.error
import getpass
from pathlib import Path

def load_firebase_config(path="firebase-config.js"):
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"File {path} tidak ditemukan.")
    text = p.read_text(encoding="utf-8")
    def extract(key):
        m = re.search(rf'{key}\s*:\s*["\']([^"\']+)["\']', text)
        return m.group(1) if m else ""
    cfg = {
        "apiKey": extract("apiKey"),
        "projectId": extract("projectId"),
        "authDomain": extract("authDomain"),
    }
    if not cfg["apiKey"] or not cfg["projectId"]:
        raise ValueError("Gagal membaca apiKey atau projectId dari firebase-config.js")
    return cfg

def sign_in_email_password(api_key: str, email: str, password: str) -> dict:
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}"
    payload = json.dumps({
        "email": email,
        "password": password,
        "returnSecureToken": True
    }).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))

def upsert_hub_admin_komisaris(project_id: str, id_token: str, uid: str, email: str):
    doc_url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/hubAdmins/{uid}"
    body = {
        "fields": {
            "uid": {"stringValue": uid},
            "email": {"stringValue": email},
            "name": {"stringValue": "Deska Wiyata Praja S"},
            "role": {"stringValue": "SUPER_ADMIN"},
            "corporateLine": {"stringValue": "KOMISARIS"},
            "division": {"stringValue": "Dewan Komisaris - ASAS Group Global World"},
            "enterprise": {"stringValue": "ASAS Group Global World"},
            "active": {"booleanValue": True}
        }
    }
    req = urllib.request.Request(
        doc_url,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {id_token}"
        },
        method="PATCH"
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))

def main():
    cfg = load_firebase_config("firebase-config.js")
    print(f"Project ID terdeteksi: {cfg['projectId']}")
    email = input("Email Super Admin [deskawiyatapraja@gmail.com]: ").strip() or "deskawiyatapraja@gmail.com"
    password = getpass.getpass("Kata Sandi Firebase Auth: ")

    auth_res = sign_in_email_password(cfg["apiKey"], email, password)
    uid = auth_res["localId"]
    id_token = auth_res["idToken"]
    print(f"Berhasil login Firebase Auth. UID: {uid}")

    try:
        res = upsert_hub_admin_komisaris(cfg["projectId"], id_token, uid, email)
        print("Dokumen hubAdmins/" + uid + " berhasil disimpan/diperbarui!")
        print("Nama dokumen:", res.get("name"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        print(f"Gagal menulis ke Firestore (HTTP {e.code}): {err_body}")

if __name__ == "__main__":
    main()
