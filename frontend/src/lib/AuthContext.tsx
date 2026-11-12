"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://edurag-openai-musa-cpewa9epdmagg8b4.uaenorth-01.azurewebsites.net";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  enrolled_units: string[];
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  profile: UserProfile | null;
  refreshProfile: () => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<{ error: any; data: any }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: any }>;
  resendVerificationEmail: (email: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isAdmin: false,
  profile: null,
  refreshProfile: async () => {},
  isAuthModalOpen: false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  signInWithGoogle: async () => {},
  signInWithEmail: async () => ({ error: null }),
  signUpWithEmail: async () => ({ error: null, data: null }),
  resetPasswordForEmail: async () => ({ error: null }),
  resendVerificationEmail: async () => ({ error: null }),
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchProfile = useCallback(async (accessToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/profiles/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data: UserProfile = await res.json();
        setProfile(data);
        setIsAdmin(data.is_admin ?? false);
      }
    } catch (e) {
      // Profile fetch is non-critical — ignore errors
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data: { session: s } } = await supabase.auth.getSession();
    if (s?.access_token) {
      await fetchProfile(s.access_token);
    }
  }, [fetchProfile]);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      if (session?.access_token) {
        fetchProfile(session.access_token);
      }
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
        if (session.access_token) {
          fetchProfile(session.access_token);
        }
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

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

  const resetPasswordForEmail = async (email: string) => {
    const redirectOrigin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectOrigin ? `${redirectOrigin}/` : undefined,
    });
    return { error };
  };

  const resendVerificationEmail = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    return { error };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsAdmin(false);
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
        isAdmin,
        profile,
        refreshProfile,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        resetPasswordForEmail,
        resendVerificationEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
