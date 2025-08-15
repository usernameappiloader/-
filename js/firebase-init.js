// Remplacez les valeurs ci-dessous par votre propre configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBr2cR7ppjMFFJr3vmygX7rD87vGnOfaAk",
  authDomain: "mr-dev-prime.firebaseapp.com",
  projectId: "mr-dev-prime",
  storageBucket: "mr-dev-prime.firebasestorage.app",
  messagingSenderId: "995289422831",
  appId: "1:995289422831:web:5bc5b92b1446c7078ef41a",
  measurementId: "G-7ZXCBWXN7Q"
};

// Initialisation de Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Exportez db pour l'utiliser dans d'autres fichiers
window.db = db;
