import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, getStoredSupabaseConfig, saveStoredSupabaseConfig } from '../lib/supabase.ts';
import type { User, Session } from '@supabase/supabase-js';

export interface CustomerProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  customerProfile: CustomerProfile | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  isDemoUser: boolean;
  signUp: (email: string, password: string, metadata: { fullName: string; phone?: string }) => Promise<{ success: boolean; error?: string; message?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  signInDemoUser: () => void;
  updateSupabaseCredentials: (url: string, anonKey: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [configured, setConfigured] = useState(isSupabaseConfigured());

  // Check saved demo user or Supabase auth session
  useEffect(() => {
    const isConfig = isSupabaseConfigured();
    setConfigured(isConfig);

    // If Supabase is configured, listen to real session
    if (isConfig) {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          setIsDemoUser(false);
          extractProfile(currentSession.user);
        }
        setLoading(false);
      }).catch((err) => {
        console.warn('Error fetching Supabase session:', err);
        setLoading(false);
      });

      // Subscribe to auth state updates
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          setIsDemoUser(false);
          extractProfile(newSession.user);
        } else {
          setCustomerProfile(null);
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // If not configured yet, check if there is an active local demo session
      const savedDemo = localStorage.getItem('nm_demo_user');
      if (savedDemo) {
        try {
          const parsed = JSON.parse(savedDemo);
          setCustomerProfile(parsed);
          setIsDemoUser(true);
        } catch {
          localStorage.removeItem('nm_demo_user');
        }
      }
      setLoading(false);
    }
  }, []);

  const extractProfile = (authUser: User) => {
    const meta = authUser.user_metadata || {};
    setCustomerProfile({
      id: authUser.id,
      email: authUser.email || '',
      fullName: meta.full_name || meta.fullName || authUser.email?.split('@')[0] || 'Valued Customer',
      phone: meta.phone || '',
      role: 'customer',
      createdAt: authUser.created_at,
    });
  };

  const signUp = async (
    email: string,
    password: string,
    metadata: { fullName: string; phone?: string }
  ) => {
    if (!isSupabaseConfigured()) {
      // Create local account simulation if Supabase credentials not entered yet
      const demoProfile: CustomerProfile = {
        id: 'demo_' + Date.now(),
        email: email.trim().toLowerCase(),
        fullName: metadata.fullName.trim(),
        phone: metadata.phone?.trim() || '',
        role: 'customer',
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('nm_demo_user', JSON.stringify(demoProfile));
      setCustomerProfile(demoProfile);
      setIsDemoUser(true);
      return {
        success: true,
        message: 'Account created! (Operating in preview mode until Supabase URL & Anon Key are added)',
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: metadata.fullName.trim(),
            phone: metadata.phone?.trim() || '',
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user && !data.session) {
        return {
          success: true,
          message: 'Sign up successful! Please check your email inbox to confirm your account, or sign in.',
        };
      }

      if (data.user) {
        extractProfile(data.user);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'An error occurred during signup.' };
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      // If not configured, check local storage or let them log in as demo
      const demoProfile: CustomerProfile = {
        id: 'demo_user',
        email: email.trim().toLowerCase(),
        fullName: email.split('@')[0] || 'Customer',
        phone: '+971 50 123 4567',
        role: 'customer',
      };
      localStorage.setItem('nm_demo_user', JSON.stringify(demoProfile));
      setCustomerProfile(demoProfile);
      setIsDemoUser(true);
      return { success: true };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        extractProfile(data.user);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to sign in.' };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out error:', err);
      }
    }
    localStorage.removeItem('nm_demo_user');
    setUser(null);
    setSession(null);
    setCustomerProfile(null);
    setIsDemoUser(false);
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured()) {
      return {
        success: true,
        message: 'Password reset instructions would be dispatched in live Supabase mode.',
      };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + '#reset-password',
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return {
        success: true,
        message: 'A password reset link has been dispatched to your email address.',
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to request password reset.' };
    }
  };

  const signInDemoUser = () => {
    const demoProfile: CustomerProfile = {
      id: 'demo_customer_01',
      email: 'customer@nasirmobile.ae',
      fullName: 'VIP Customer Dubai',
      phone: '+971 50 889 9789',
      role: 'customer',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('nm_demo_user', JSON.stringify(demoProfile));
    setCustomerProfile(demoProfile);
    setIsDemoUser(true);
  };

  const updateSupabaseCredentials = async (url: string, anonKey: string): Promise<boolean> => {
    try {
      saveStoredSupabaseConfig(url, anonKey);
      window.location.reload();
      return true;
    } catch (err) {
      console.error('Failed to update Supabase config:', err);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        customerProfile,
        session,
        loading,
        isConfigured: configured,
        isDemoUser,
        signUp,
        signIn,
        signOut,
        resetPassword,
        signInDemoUser,
        updateSupabaseCredentials,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
