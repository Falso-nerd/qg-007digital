// 00-login/login/backend/firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD3qLC0mq0snYDVjgcMqlxpotgALTHd0uY",
  authDomain: "qg007-b890a.firebaseapp.com",
  projectId: "qg007-b890a",
  storageBucket: "qg007-b890a.firebasestorage.app",
  messagingSenderId: "230480486221",
  appId: "1:230480486221:web:a232dcd4d9225ab254e104"
};

const app = initializeApp(firebaseConfig);
window.qgFirebase = {
  app,
  auth: getAuth(app),
  db: getFirestore(app),
};
