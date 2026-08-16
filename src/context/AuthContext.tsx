import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { auth, db, googleProvider, onAuthStateChanged, signInWithPopup, signOut } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { FirebaseUser } from '../lib/firebase';
import { OperationType, handleFirestoreError } from '../lib/firebase-utils';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

export type UnifiedUser = (FirebaseUser & { id?: string }) | (SupabaseUser & { uid: string; displayName: string | null; photoURL: string | null; emailVerified: boolean; id?: string });

export const ROLES = ['tenant', 'landlord', 'both', 'agent'] as const;
export type EcosystemRole = (typeof ROLES)[number];

export interface UserProfile {
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
  const [user, setUser] = useState<UnifiedUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Firestore Profile Listener Helper
  const subscribeToFirestoreProfile = useCallback((uid: string, defaultUser: any) => {
    const docRef = doc(db, 'users', uid);
    
    // Fetch once to ensure document exists
    getDoc(docRef).then(async (docSnap) => {
      if (!docSnap.exists()) {
        const newProfile: UserProfile = {
          uid,
          name: defaultUser.displayName || defaultUser.email?.split('@')[0] || 'User',
          email: defaultUser.email || '',
          photoURL: defaultUser.photoURL || '',
          bio: '',
          contactNumber: '',
          isPublicContact: false,
          showPhoneNumber: false,
          showEmail: false,
          role: 'tenant',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(docRef, newProfile).catch(err => 
          handleFirestoreError(err, OperationType.CREATE, `users/${uid}`)
        );
        setProfile(newProfile);
      }
    }).catch(err => {
      console.warn("Firestore getDoc error:", err);
      // Fallback profile if Firestore read fails
      setProfile({
        uid,
        name: defaultUser.displayName || defaultUser.email?.split('@')[0] || 'User',
        email: defaultUser.email || '',
        photoURL: defaultUser.photoURL || '',
        bio: '',
        contactNumber: '',
        isPublicContact: false,
        showPhoneNumber: false,
        showEmail: false,
        role: 'tenant',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    // Realtime Listener
    return onSnapshot(docRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setProfile({
            ...data,
            role: data.role || 'tenant'
          });
        } else {
          setProfile({
            uid,
            name: defaultUser.displayName || defaultUser.email?.split('@')[0] || 'User',
            email: defaultUser.email || '',
            photoURL: defaultUser.photoURL || '',
            bio: '',
            contactNumber: '',
            isPublicContact: false,
            showPhoneNumber: false,
            showEmail: false,
            role: 'tenant',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        setLoading(false);
      }, 
      (error) => {
        console.warn("Firestore onSnapshot error:", error);
        setProfile({
          uid,
          name: defaultUser.displayName || defaultUser.email?.split('@')[0] || 'User',
          email: defaultUser.email || '',
          photoURL: defaultUser.photoURL || '',
          bio: '',
          contactNumber: '',
          isPublicContact: false,
          showPhoneNumber: false,
          showEmail: false,
          role: 'tenant',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        setLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;
    let isSubscribed = true;

    // PERFORMANCE FIX: Safety timeout so the app unfreezes after 3s if network calls hang
    const fallbackTimer = setTimeout(() => {
      if (isSubscribed) {
        setLoading(false);
      }
    }, 3000);

    const initializeAuth = async () => {
      try {
        // 1. Check Supabase session first
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && isSubscribed) {
          const unifiedUser: UnifiedUser = {
            ...session.user,
            uid: session.user.id,
            displayName: session.user.user_metadata?.displayName || session.user.user_metadata?.name || 'New User',
            photoURL: session.user.user_metadata?.photoURL || null,
            emailVerified: !!session.user.email_confirmed_at
          };

          const metadata = session.user.user_metadata || {};
          const pseudoProfile: UserProfile = {
            uid: session.user.id,
            name: metadata.displayName || metadata.name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            photoURL: metadata.photoURL || '',
            bio: metadata.bio || '',
            contactNumber: metadata.contactNumber || '',
            isPublicContact: !!metadata.isPublicContact,
            showPhoneNumber: !!metadata.showPhoneNumber,
            showEmail: !!metadata.showEmail,
            role: (metadata.role || 'tenant') as EcosystemRole,
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

          setUser(unifiedUser);
          setProfile(pseudoProfile);
          setLoading(false);
          clearTimeout(fallbackTimer);
          return;
        }
      } catch (err) {
        console.warn("Error checking Supabase session:", err);
      }

      // 2. Fallback to Firebase Auth Listener
      const unsubscribeFirebase = onAuthStateChanged(auth, (firebaseUser) => {
        if (!isSubscribed) return;

        if (firebaseUser) {
          setUser(firebaseUser);
          if (unsubscribeFirestore) unsubscribeFirestore();
          unsubscribeFirestore = subscribeToFirestoreProfile(firebaseUser.uid, firebaseUser);
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
        clearTimeout(fallbackTimer);
      });

      return () => {
        unsubscribeFirebase();
      };
    };

    let cleanupFirebase: (() => void) | undefined;
    initializeAuth().then((cleanup) => {
      if (cleanup) cleanupFirebase = cleanup;
    });

    // Supabase Auth State Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isSubscribed) return;

      if (session?.user) {
        const unifiedUser: UnifiedUser = {
          ...session.user,
          uid: session.user.id,
          displayName: session.user.user_metadata?.displayName || session.user.user_metadata?.name || 'User',
          photoURL: session.user.user_metadata?.photoURL || null,
          emailVerified: !!session.user.email_confirmed_at
        };
        const metadata = session.user.user_metadata || {};
        const pseudoProfile: UserProfile = {
          uid: session.user.id,
          name: metadata.displayName || metadata.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          photoURL: metadata.photoURL || '',
          bio: metadata.bio || '',
          contactNumber: metadata.contactNumber || '',
          isPublicContact: !!metadata.isPublicContact,
          showPhoneNumber: !!metadata.showPhoneNumber,
          showEmail: !!metadata.showEmail,
          role: (metadata.role || 'tenant') as EcosystemRole,
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
        setUser(unifiedUser);
        setProfile(pseudoProfile);
        setLoading(false);
      } else if (!auth.currentUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
      clearTimeout(fallbackTimer);
    });

    return () => {
      isSubscribed = false;
      clearTimeout(fallbackTimer);
      if (cleanupFirebase) cleanupFirebase();
      subscription.unsubscribe();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, [subscribeToFirestoreProfile]);

  const loginWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google login failed:", error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await Promise.all([
        signOut(auth).catch(() => {}),
        supabase.auth.signOut().catch(() => {})
      ]);
    } finally {
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) return;

    if ((user as any).app_metadata) {
      const { error } = await supabase.auth.updateUser({
        data: updates
      });
      if (error) throw error;
      setProfile(prev => prev ? { ...prev, ...updates } as UserProfile : null);
      return;
    }

    const docRef = doc(db, 'users', user.uid);
    try {
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        const newProfile: UserProfile = {
          uid: user.uid,
          name: updates.name || user.displayName || 'User',
          email: updates.email || user.email || '',
          photoURL: updates.photoURL || user.photoURL || '',
          bio: '',
          contactNumber: '',
          isPublicContact: false,
          showPhoneNumber: false,
          showEmail: false,
          role: updates.role || 'tenant',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ...updates
        } as UserProfile;
        await setDoc(docRef, newProfile);
      } else {
        await setDoc(docRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
      }
      setProfile(prev => prev ? { ...prev, ...updates } as UserProfile : null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      throw error;
    }
  }, [user]);

  const contextValue = useMemo(() => ({
    user, profile, loading, loginWithGoogle, logout, updateProfile
  }), [user, profile, loading, loginWithGoogle, logout, updateProfile]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
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