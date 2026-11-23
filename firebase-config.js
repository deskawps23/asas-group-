import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const firebaseConfig = window.__FIREBASE_CONFIG__ || {
  apiKey: "AIzaSyBgx_OmMh9WJ1t6YeDhJyE5dGltCqfJq3k",
  authDomain: "asas-corporate.firebaseapp.com",
  projectId: "asas-corporate",
  storageBucket: "ISI_STORAGE_BUCKET",
  messagingSenderId: "ISI_SENDER_ID",
  appId: "ISI_APP_ID"
};

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export async function ensureCustomerAuth() {
  if (auth.currentUser) return auth.currentUser;
  const cred = await signInAnonymously(auth);
  return cred.user;
}

export function loginHubAdmin(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logoutHubSession() {
  return signOut(auth);
}

export { onAuthStateChanged };
