import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
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
  role?: 'tenant' | 'landlord' | 'both' | 'agent';
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

    // Listen to Supabase Auth ONLY
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`Supabase Auth event triggered: ${event}`);
      if (session?.user) {
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
        setUser(null);
        setProfile(null);
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error("Google login redirect failed:", error);
      throw error;
    }
  };

  const logout = async () => {
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
