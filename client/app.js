// Firebase App
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
// Firebase Authentication
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
// Firebase Firestore
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyDlvx2itOOb19Fgzc9svKtX8DaY75FX7bU",
    authDomain: "weave-68219.firebaseapp.com",
    projectId: "weave-68219",
    storageBucket: "weave-68219.firebasestorage.app",
    messagingSenderId: "855925043974",
    appId: "1:855925043974:web:e248aa3108d5cccf802487",
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firebase Authentication 초기화
const auth = getAuth(app);

// Initialize Cloud Firestore and 서비스 참조
const db = getFirestore(app);

console.log("Firebase 초기화 성공");

export { app, auth, db };
