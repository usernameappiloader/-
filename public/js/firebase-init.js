// firebase-init.js
// Remplacez les valeurs ci-dessous par celles de votre projet Firebase
const firebaseConfig = {
     apiKey: "AIzaSyBr2cR7ppjMFFJr3vmygX7rD87vGnOfaAk",
  authDomain: "mr-dev-prime.firebaseapp.com",
  projectId: "mr-dev-prime",
  storageBucket: "mr-dev-prime.firebasestorage.app",
  messagingSenderId: "995289422831",
  appId: "1:995289422831:web:5bc5b92b1446c7078ef41a",
};

// Initialisation Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const storage = firebase.storage();
