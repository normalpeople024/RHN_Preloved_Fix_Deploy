// ═══════════════════════════════════════
// firebase.js — Firebase init (no Storage)
// ═══════════════════════════════════════
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection, doc, setDoc, getDoc, getDocs,
  addDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot,
  serverTimestamp, Timestamp, limit,
  getCountFromServer
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAC87ygseiY1DTIjec7hUVAfOBUkAvqL6g",
  authDomain: "rhn-preloved-yk.firebaseapp.com",
  projectId: "rhn-preloved-yk",
  storageBucket: "rhn-preloved-yk.firebasestorage.app",
  messagingSenderId: "516096185444",
  appId: "1:516096185444:web:efa8d25267e7db4b54fb71",
  measurementId: "G-2C00KC3MLV"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

export {
  auth, db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile,
  collection, doc, setDoc, getDoc, getDocs,
  addDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot,
  serverTimestamp, Timestamp, limit,
  getCountFromServer
};
