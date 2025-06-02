
"use client";

import type { ReactNode, Dispatch, SetStateAction } from 'react';
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, type User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';
import type { FirebaseError } from 'firebase/app';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  signUp: (email: string, pass: string) => Promise<User | null>;
  logIn: (email: string, pass: string) => Promise<User | null>;
  logOut: () => Promise<void>;
  setError: Dispatch<SetStateAction<string | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setCurrentUser(firebaseUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, pass: string): Promise<User | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      setUser(userCredential.user);
      return userCredential.user;
    } catch (e) {
      const firebaseError = e as FirebaseError;
      console.error("Sign up error:", firebaseError);
      setError(firebaseError.message || "Failed to sign up.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const logIn = async (email: string, pass: string): Promise<User | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      setUser(userCredential.user);
      return userCredential.user;
    } catch (e) {
      const firebaseError = e as FirebaseError;
      console.error("Log in error:", firebaseError);
      setError(firebaseError.message || "Failed to log in. Check credentials.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const logOut = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await signOut(auth);
      setUser(null);
      router.push('/login'); // Redirect to login after logout
    } catch (e) {
      const firebaseError = e as FirebaseError;
      console.error("Log out error:", firebaseError);
      setError(firebaseError.message || "Failed to log out.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const contextValue = useMemo(() => ({
    user,
    currentUser,
    isLoading,
    error,
    signUp,
    logIn,
    logOut,
    setError
  }), [user, currentUser, isLoading, error]);

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
