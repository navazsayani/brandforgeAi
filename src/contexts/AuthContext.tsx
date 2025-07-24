
"use client";

import type { ReactNode, Dispatch, SetStateAction } from 'react';
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, type User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';
import type { FirebaseError } from 'firebase/app';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  currentUser: User | null;
  userId: string | null; // Added userId
  isLoading: boolean;
  error: string | null;
  signUp: (email: string, pass: string) => Promise<User | null>;
  logIn: (email: string, pass: string) => Promise<User | null>;
  signInWithGoogle: () => Promise<User | null>;
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
      if (firebaseUser) {
        // If user is authenticated, and they are on login/signup, redirect to dashboard
        // Note: In App Router, we can't access pathname directly, so we'll handle this in the components
        // This redirect logic should be moved to the login/signup page components
      }
    });
    return () => unsubscribe();
  }, [router]);

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

  const signInWithGoogle = async (): Promise<User | null> => {
    setIsLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      // The onAuthStateChanged listener will handle redirecting to dashboard
      return result.user;
    } catch (e) {
      const firebaseError = e as FirebaseError;
      console.error("Google sign-in error:", firebaseError);
      // Handle specific Google Sign-In errors
      if (firebaseError.code === 'auth/popup-closed-by-user') {
        setError("Sign-in process was cancelled. Please try again.");
      } else if (firebaseError.code === 'auth/account-exists-with-different-credential') {
        setError("An account already exists with this email address. Please sign in using the original method.");
      } else {
        setError(firebaseError.message || "Failed to sign in with Google.");
      }
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
      setCurrentUser(null); // Ensure currentUser is also cleared
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
    userId: currentUser?.uid || null, // Directly expose the userId
    isLoading,
    error,
    signUp,
    logIn,
    signInWithGoogle,
    logOut,
    setError
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
