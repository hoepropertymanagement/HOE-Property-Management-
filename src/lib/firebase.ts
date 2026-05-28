import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber, User as FirebaseUser } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Dynamically use the current hostname as the authDomain if running on an authorized custom/live domain,
// such as hoe-estate-management-1047527556630.europe-west2.run.app or AI Studio previews,
// of which the Express server acts as a pass-through proxy for standard Firebase redirects. This solves
// browser third-party cookie limitations during Google Sign-In.
const isBrowser = typeof window !== 'undefined';
const host = isBrowser ? window.location.hostname : '';
const isAiStudioPreview = host && (host.includes('ais-pre-') || host.includes('ais-dev-'));
const dynamicAuthDomain = (host && !isAiStudioPreview && (host.endsWith('run.app') || host.includes('localhost') || host.includes('web.app')))
  ? host
  : (firebaseConfig.authDomain || 'nifty-momentum-c3n78.firebaseapp.com');

const finalConfig = {
  ...firebaseConfig,
  authDomain: dynamicAuthDomain
};

const app = initializeApp(finalConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, finalConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber };
export type { FirebaseUser };
