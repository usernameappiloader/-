// ===== FIREBASE INITIALIZATION (v9 Syntax) =====

// TODO: Remplacez les valeurs ci-dessous par votre propre configuration Firebase
// Ne jamais stocker de clés réelles dans un dépôt de code public.
const firebaseConfig = {
   apiKey: "AIzaSyBr2cR7ppjMFFJr3vmygX7rD87vGnOfaAk",
  authDomain: "mr-dev-prime.firebaseapp.com",
  projectId: "mr-dev-prime",
  storageBucket: "mr-dev-prime.firebasestorage.app",
  messagingSenderId: "995289422831",
  appId: "1:995289422831:web:5bc5b92b1446c7078ef41a",
};

// Initialisation de Firebase
// NOTE: Assurez-vous d'importer les SDK Firebase v9 dans vos fichiers HTML.
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// Expose les instances Firebase à l'objet global 'window' pour un accès simple dans ce projet.
// Dans une application plus grande, il serait préférable d'utiliser des modules ES6.
window.db = db;
window.storage = storage;

console.log("Firebase initialized successfully.");
