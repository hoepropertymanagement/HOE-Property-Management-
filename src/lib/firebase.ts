import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber, User as FirebaseUser } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  ...firebaseConfigData,
  authDomain: "hoepropertymanagement.co.uk"
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber };
export type { FirebaseUser };
