import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, googleProvider, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { FirebaseUser } from '../lib/firebase';
import { OperationType, handleFirestoreError } from '../lib/firebase-utils';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  bio: string;
  contactNumber: string;
  isPublicContact: boolean;
  showPhoneNumber: boolean;
  showEmail: boolean;
  role?: 'tenant' | 'landlord' | 'both' | 'agent';
  isPhoneVerified?: boolean;
  createdAt: any;
  updatedAt: any;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    let isRedirectHandling = true;

    // Handle any pending redirect results
    import('../lib/firebase').then(({ getRedirectResult, auth }) => {
      getRedirectResult(auth).catch((error) => {
        console.warn("Redirect sign-in error or cancelled:", error);
      }).finally(() => {
        isRedirectHandling = false;
      });
    });

    const unsubscribeFirebase = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const docRef = doc(db, 'users', firebaseUser.uid);
        try {
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'New User',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || '',
              bio: '',
              contactNumber: '',
              isPublicContact: false,
              showPhoneNumber: false,
              showEmail: false,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            await setDoc(docRef, newProfile);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }

        if (unsubscribeProfile) unsubscribeProfile();
        unsubscribeProfile = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            setProfile(null);
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          setLoading(false);
        });
      } else {
        setUser(null);
        setProfile(null);
        if (unsubscribeProfile) unsubscribeProfile();
        setLoading(false);
      }
    });

    return () => {
      unsubscribeFirebase();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const docRef = doc(db, 'users', user.uid);
    
    try {
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        const newProfile: UserProfile = {
          uid: user.uid,
          name: updates.name || user.displayName || 'New User',
          email: updates.email || user.email || '',
          photoURL: updates.photoURL || user.photoURL || '',
          bio: '',
          contactNumber: '',
          isPublicContact: false,
          showPhoneNumber: false,
          showEmail: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ...updates
        } as UserProfile;
        await setDoc(docRef, newProfile);
      } else {
        await setDoc(docRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, loginWithGoogle, logout, updateProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
