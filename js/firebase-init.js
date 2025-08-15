// ===== FIREBASE INITIALIZATION (CORRIGÉ) =====

const firebaseConfig = {
   apiKey: "AIzaSyBr2cR7ppjMFFJr3vmygX7rD87vGnOfaAk",
  authDomain: "mr-dev-prime.firebaseapp.com",
  projectId: "mr-dev-prime",
  storageBucket: "mr-dev-prime.firebasestorage.app",
  messagingSenderId: "995289422831",
  appId: "1:995289422831:web:5bc5b92b1446c7078ef41a",
};

// Initialisation de Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Expose la base de données à l'objet global 'window'
window.db = db;

console.log("Firebase initialized successfully.");
