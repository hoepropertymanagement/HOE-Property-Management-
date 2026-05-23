import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, googleProvider, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { FirebaseUser } from '../lib/firebase';
import { OperationType, handleFirestoreError } from '../lib/firebase-utils';
import { supabase } from '../lib/supabase';

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
  role?: 'tenant' | 'landlord' | 'both';
  isPhoneVerified?: boolean;
  createdAt: any;
  updatedAt: any;
}

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    let isSupabasePrimary = false;

    // Handle redirect result for Google Login
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          console.log("Successfully signed in with Google redirect:", result.user);
        }
      })
      .catch((err) => {
        console.error("Firebase redirect login error:", err);
      });

    // Listen to Firebase Auth
    const unsubscribeFirebase = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        isSupabasePrimary = false;
        // Sign out of Supabase if Firebase is active
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.auth.signOut();
        }

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
        if (!isSupabasePrimary) {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
        }
      }
    });

    // Listen to Supabase Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        isSupabasePrimary = true;
        // Sign out of Firebase if Supabase triggers an active session
        if (auth.currentUser) {
          await signOut(auth);
        }

        const sbUser = session.user;
        const isEmailConfirmed = !!sbUser.email_confirmed_at;

        const mappedUser = {
          uid: sbUser.id,
          email: sbUser.email || '',
          displayName: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || '',
          photoURL: sbUser.user_metadata?.avatar_url || '',
          emailVerified: isEmailConfirmed,
        };

        setUser(mappedUser);

        const docRef = doc(db, 'users', sbUser.id);
        try {
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) {
            const newProfile: UserProfile = {
              uid: sbUser.id,
              name: mappedUser.displayName || 'New User',
              email: mappedUser.email,
              photoURL: mappedUser.photoURL,
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
          handleFirestoreError(error, OperationType.GET, `users/${sbUser.id}`);
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
          handleFirestoreError(error, OperationType.GET, `users/${sbUser.id}`);
          setLoading(false);
        });
      } else {
        if (isSupabasePrimary) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    });

    return () => {
      unsubscribeFirebase();
      subscription.unsubscribe();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.warn("Popup blocked or closed by user, attempting redirect login:", error);
      
      const popupClosedOrBlocked = 
        error?.code === 'auth/popup-closed-by-user' || 
        error?.code === 'auth/popup-blocked' || 
        error?.code === 'auth/cancelled-popup-request' ||
        error?.message?.includes('popup-closed-by-user') ||
        error?.message?.includes('popup-blocked');

      if (popupClosedOrBlocked) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectError) {
          console.error("Redirect login error:", redirectError);
          throw redirectError;
        }
      }
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    await supabase.auth.signOut();
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
