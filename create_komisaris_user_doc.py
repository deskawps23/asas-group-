import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("serviceAccountKey.json")
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()
uid = "KiunhmwdKsYtJJnjif9keELQELx2"

doc_ref = db.collection("users").document(uid)
doc_ref.set({
    "name": "Deska Wiata Praja, S.",
    "role": "SUPER_ADMIN",
    "position": "Komisaris",
    "active": True
}, merge=True)

print("Sukses menyimpan dokumen users/" + uid)
