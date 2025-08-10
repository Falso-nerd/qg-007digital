// 00-login/login/backend/auth-role.js
import { onAuthStateChanged, getIdTokenResult } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const { auth, db } = window.qgFirebase;

window.qgGetRole = async () => {
  const user = auth.currentUser;
  if (!user) return "anon";

  try {
    const token = await getIdTokenResult(user, true);
    if (token.claims?.role) return token.claims.role;

    const snap = await getDoc(doc(db, "users", user.uid));
    return snap.exists() ? (snap.data().role || "user") : "user";
  } catch {
    return "user";
  }
};

onAuthStateChanged(auth, () => {
  document.dispatchEvent(new CustomEvent("qg:auth-changed"));
});
