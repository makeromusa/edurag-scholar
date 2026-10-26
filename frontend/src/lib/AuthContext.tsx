"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<{ error: any; data: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isAuthModalOpen: false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  signInWithGoogle: async () => {},
  signInWithEmail: async () => ({ error: null }),
  signUpWithEmail: async () => ({ error: null, data: null }),
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // 2. Listen for auth changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      if (session?.user) {
        setIsAuthModalOpen(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const signInWithGoogle = async () => {
    try {
      const redirectOrigin = typeof window !== "undefined" ? window.location.origin : "";
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectOrigin ? `${redirectOrigin}/` : undefined,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
    const redirectOrigin = typeof window !== "undefined" ? window.location.origin : "";
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email.split("@")[0],
        },
        emailRedirectTo: redirectOrigin ? `${redirectOrigin}/` : undefined,
      },
    });
    return { error, data };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
