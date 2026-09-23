// Firebase configuration + Auth + Realtime Database helpers.
// IMPORTANT: Replace every YOUR_* value with your Firebase Web App config.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getDatabase, ref, set, update, onValue, get, push, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";
import { getAuth, signInAnonymously, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCY4OzE7rn6PeI8vPCYljTHg5H9GioM3rc",
  authDomain: "polyglot-pronunciation-b-4bfa6.firebaseapp.com",
  databaseURL: "https://polyglot-pronunciation-b-4bfa6-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "polyglot-pronunciation-b-4bfa6",
  storageBucket: "polyglot-pronunciation-b-4bfa6.firebasestorage.app",
  messagingSenderId: "771848285986",
  appId: "1:771848285986:web:49653779cae491d3297f7b"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);
export { ref, set, update, onValue, get, push, serverTimestamp, signInAnonymously, signInWithEmailAndPassword, onAuthStateChanged, signOut };

export async function ensureAnonymousAuth() {
  if (auth.currentUser) return auth.currentUser;
  const result = await signInAnonymously(auth);
  return result.user;
}
