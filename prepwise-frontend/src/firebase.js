import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAapxvzuu7q6ONW0VcAC4_iAc4_Oxb8rv4",
  authDomain: "prepwise-89a96.firebaseapp.com",
  projectId: "prepwise-89a96",
  storageBucket: "prepwise-89a96.firebasestorage.app",
  messagingSenderId: "408953367030",
  appId: "1:408953367030:web:221cf7c2c86143fbf63fd7",
  measurementId: "G-WH3JDYB7TP",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});
export default app;