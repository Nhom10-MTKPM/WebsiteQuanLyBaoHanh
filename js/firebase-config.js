// Firebase Configuration - TechCare Pro
// Dự án: websitequanlybaohanh
const firebaseConfig = {
  apiKey: "AIzaSyDZWb1cE2HOrCYWG9cFRSXm463hhY75oX8",
  authDomain: "websitequanlybaohanh-e81be.firebaseapp.com",
  projectId: "websitequanlybaohanh-e81be",
  storageBucket: "websitequanlybaohanh-e81be.firebasestorage.app",
  messagingSenderId: "1048702605187",
  appId: "1:1048702605187:web:d9f811ec0cc245018d88b6"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Global references
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();