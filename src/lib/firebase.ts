// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBMRjGjTv9ZJJ8oyVMVlfp0Eyx8ZmgGCtA",
    authDomain: "cinicsystem.firebaseapp.com",
    projectId: "cinicsystem",
    storageBucket: "cinicsystem.firebasestorage.app",
    messagingSenderId: "1049942682038",
    appId: "1:1049942682038:web:77197ea50a01abcef0b917",
    measurementId: "G-7D2XW781TM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Secondary Firebase App — used by Admin to create doctor accounts
// without logging themselves out (createUserWithEmailAndPassword auto-signs in)
const secondaryApp = initializeApp(firebaseConfig, 'secondary');

export const auth = getAuth(app);
export const secondaryAuth = getAuth(secondaryApp);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
});
