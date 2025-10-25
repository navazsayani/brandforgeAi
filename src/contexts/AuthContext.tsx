
"use client";

import type { ReactNode, Dispatch, SetStateAction } from 'react';
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, type User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';
import type { FirebaseError } from 'firebase/app';
import { useRouter } from 'next/navigation';
import { trackSignup, trackLogin, setAnalyticsUserId, setAnalyticsUserProperties } from '@/lib/analytics';

interface AuthContextType {
  user: User | null;
  currentUser: User | null;
  userId: string | null; 
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

      // Track signup event
      trackSignup('email');
      setAnalyticsUserId(userCredential.user.uid);
      setAnalyticsUserProperties({
        signup_method: 'email',
        user_email: userCredential.user.email || 'unknown',
      });

      return userCredential.user;
    } catch (e) {
      const firebaseError = e as FirebaseError;
      console.error("Sign up error:", firebaseError);
      if (firebaseError.code === 'auth/email-already-in-use') {
        setError("This email is already in use. Please log in or use a different email.");
      } else {
        setError(firebaseError.message || "Failed to sign up.");
      }
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

      // Track login event
      trackLogin('email');
      setAnalyticsUserId(userCredential.user.uid);

      return userCredential.user;
    } catch (e) {
      const firebaseError = e as FirebaseError;
      console.error("Log in error:", firebaseError);
      if (firebaseError.code === 'auth/invalid-credential' || firebaseError.code === 'auth/wrong-password' || firebaseError.code === 'auth/user-not-found') {
        setError("Invalid email or password. Please try again.");
      } else {
        setError(firebaseError.message || "Failed to log in. Please try again later.");
      }
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

      // Check if new user or returning user
      const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
      if (isNewUser) {
        // New user signup
        trackSignup('google');
        setAnalyticsUserProperties({
          signup_method: 'google',
          user_email: result.user.email || 'unknown',
        });
      } else {
        // Returning user login
        trackLogin('google');
      }
      setAnalyticsUserId(result.user.uid);

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
    currentUser: user, // ensure currentUser is always in sync
    userId: user?.uid || null,
    isLoading,
    error,
    signUp,
    logIn,
    signInWithGoogle,
    logOut,
    setError
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [user, isLoading, error]);

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
