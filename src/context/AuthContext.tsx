import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth, db, googleProvider, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { FirebaseUser } from '../lib/firebase';
import { OperationType, handleFirestoreError } from '../lib/firebase-utils';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

export type UnifiedUser = FirebaseUser | (SupabaseUser & { uid: string; displayName: string | null; photoURL: string | null; emailVerified: boolean });

export const ROLES = ['tenant', 'landlord', 'both', 'agent'] as const;
export type EcosystemRole = (typeof ROLES)[number];

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
  role?: EcosystemRole;
  isPhoneVerified?: boolean;
  createdAt: any;
  updatedAt: any;
  address?: string;
  searchRadius?: string;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
  managedBy?: string;
}

interface AuthContextType {
  user: UnifiedUser | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>({
    uid: 'mock-user-123',
    email: 'agent@test.com',
  });
  const [profile, setProfile] = useState<any>({
    id: 'mock-user-123',
    email: 'agent@test.com',
    role: 'agent', // You can change this to 'admin' or 'client' whenever you want to test different views
  });
  const [loading, setLoading] = useState(false);

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
        handleUserDoc(firebaseUser.uid, firebaseUser.displayName, firebaseUser.email, firebaseUser.photoURL);
      } else {
        // If Firebase logs out, check Supabase session
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) {
            setUser(null);
            setProfile(null);
            if (unsubscribeProfile) unsubscribeProfile();
            setLoading(false);
          }
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const unifiedUser: UnifiedUser = {
          ...session.user,
          uid: session.user.id,
          displayName: session.user.user_metadata?.displayName || session.user.user_metadata?.name || 'New User',
          photoURL: session.user.user_metadata?.photoURL || null,
          emailVerified: !!session.user.email_confirmed_at
        };
        setUser(unifiedUser);
        
        // Use Supabase profile metadata instead of Firestore lookup
        const metadata = session.user.user_metadata || {};
        const pseudoProfile: UserProfile = {
           uid: session.user.id,
           name: metadata.displayName || metadata.name || 'New User',
           email: session.user.email || '',
           photoURL: metadata.photoURL || '',
           bio: metadata.bio || '',
           contactNumber: metadata.contactNumber || '',
           isPublicContact: !!metadata.isPublicContact,
           showPhoneNumber: !!metadata.showPhoneNumber,
           showEmail: !!metadata.showEmail,
           role: (metadata.role || 'tenant') as any,
           isPhoneVerified: !!metadata.isPhoneVerified,
           createdAt: session.user.created_at,
           updatedAt: session.user.updated_at,
           address: metadata.address || '',
           searchRadius: metadata.searchRadius || '15',
           emailNotifications: metadata.emailNotifications ?? true,
           smsNotifications: metadata.smsNotifications ?? false,
           pushNotifications: metadata.pushNotifications ?? true,
           managedBy: metadata.managedBy || metadata.managed_by || ''
        };
        setProfile(pseudoProfile);
        setLoading(false);
      } else if (!auth.currentUser) {
        setUser(null);
        setProfile(null);
        if (unsubscribeProfile) unsubscribeProfile();
        setLoading(false);
      }
    });

    const handleUserDoc = async (uid: string, displayName: string | null | undefined, email: string | null | undefined, photoURL: string | null | undefined) => {
        const docRef = doc(db, 'users', uid);
        try {
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) {
            const newProfile: UserProfile = {
              uid,
              name: displayName || 'New User',
              email: email || '',
              photoURL: photoURL || '',
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
          handleFirestoreError(error, OperationType.GET, `users/${uid}`);
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
          handleFirestoreError(error, OperationType.GET, `users/${uid}`);
          setLoading(false);
        });
    };

    return () => {
      unsubscribeFirebase();
      subscription.unsubscribe();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google login failed:", error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    await Promise.all([
      signOut(auth),
      supabase.auth.signOut()
    ]);
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) return;

    // Supabase User handling
    if ((user as any).app_metadata) {
      const { supabase } = await import('../lib/supabase');
      const { error } = await supabase.auth.updateUser({
        data: updates
      });
      if (error) throw error;
      setProfile(prev => prev ? { ...prev, ...updates } as UserProfile : null);
      
      // We also update Firestore so other users/agents can still query the public profile if needed
      // (This serves as a backup registry)
    }

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
      
      // Update local profile immediately for Firebase users
      if (!(user as any).app_metadata) {
         setProfile(prev => prev ? { ...prev, ...updates } as UserProfile : null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      throw error;
    }
  }, [user]);

  const contextValue = React.useMemo(() => ({
    user, profile, loading, loginWithGoogle, logout, updateProfile
  }), [user, profile, loading, loginWithGoogle, logout, updateProfile]);

  return (
    <AuthContext.Provider value={contextValue}>
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
