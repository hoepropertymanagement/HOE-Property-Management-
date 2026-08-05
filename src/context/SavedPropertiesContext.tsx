import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, serverTimestamp, query } from 'firebase/firestore';
import { OperationType, handleFirestoreError } from '../lib/firebase-utils';

interface SavedPropertiesContextType {
  savedIds: Set<string>;
  toggleSave: (id: string) => Promise<void>;
  isSaved: (id: string) => boolean;
}

const SavedPropertiesContext = createContext<SavedPropertiesContextType | undefined>(undefined);

export function SavedPropertiesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Use Firestore for authenticated users, localStorage for guests
  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'users', user.uid, 'favorites'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const ids = new Set<string>();
        snapshot.forEach((doc) => {
          ids.add(doc.data().propertyId);
        });
        setSavedIds(ids);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/favorites`);
      });
      return () => unsubscribe();
    } else {
      const saved = localStorage.getItem('savedProperties');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setSavedIds(new Set(parsed));
          }
        } catch (e) {
          console.error('Failed to parse saved properties from localStorage', e);
        }
      }
    }
  }, [user]);

  // Only sync to localStorage for guests
  useEffect(() => {
    if (!user) {
      localStorage.setItem('savedProperties', JSON.stringify(Array.from(savedIds)));
    }
  }, [savedIds, user]);

  const toggleSave = async (id: string) => {
    if (user) {
      const docRef = doc(db, 'users', user.uid, 'favorites', id);
      try {
        if (savedIds.has(id)) {
          await deleteDoc(docRef);
        } else {
          await setDoc(docRef, {
            propertyId: id,
            createdAt: serverTimestamp()
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/favorites/${id}`);
      }
    } else {
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    }
  };

  const isSaved = (id: string) => savedIds.has(id);

  return (
    <SavedPropertiesContext.Provider value={{ savedIds, toggleSave, isSaved }}>
      {children}
    </SavedPropertiesContext.Provider>
  );
}

export function useSavedProperties() {
  const context = useContext(SavedPropertiesContext);
  if (context === undefined) {
    throw new Error('useSavedProperties must be used within a SavedPropertiesProvider');
  }
  return context;
}
