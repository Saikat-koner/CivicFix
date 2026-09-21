import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface CivicAuthUser {
  id: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    name?: string;
    picture?: string;
  };
}

interface AuthContextType {
  user: User | CivicAuthUser | null;
  idToken: string | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<User | CivicAuthUser | null>;
  signInWithEmail: (email: string, password: string) => Promise<User | null>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<User | null>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  idToken: null,
  loading: true,
  isConfigured: false,
  signInWithGoogle: async () => null,
  signInWithEmail: async () => null,
  signUpWithEmail: async () => null,
  signOut: async () => {},
  getToken: async () => null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | CivicAuthUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setUser(session.user);
          setIdToken(session.access_token);
          sessionStorage.setItem('civic_auth_token', session.access_token);
          sessionStorage.setItem(
            'civic_auth_user',
            JSON.stringify({
              id: session.user.id,
              email: session.user.email,
              displayName:
                session.user.user_metadata?.full_name ||
                session.user.user_metadata?.name ||
                session.user.email?.split('@')[0],
              photoURL:
                session.user.user_metadata?.avatar_url ||
                session.user.user_metadata?.picture,
            })
          );
        }
        setLoading(false);
      }).catch(() => setLoading(false));

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          setUser(session.user);
          setIdToken(session.access_token);
          sessionStorage.setItem('civic_auth_token', session.access_token);
          sessionStorage.setItem(
            'civic_auth_user',
            JSON.stringify({
              id: session.user.id,
              email: session.user.email,
              displayName:
                session.user.user_metadata?.full_name ||
                session.user.user_metadata?.name ||
                session.user.email?.split('@')[0],
              photoURL:
                session.user.user_metadata?.avatar_url ||
                session.user.user_metadata?.picture,
            })
          );
        } else {
          setUser(null);
          setIdToken(null);
          sessionStorage.removeItem('civic_auth_token');
          sessionStorage.removeItem('civic_auth_user');
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Fallback: check sessionStorage
      const savedUser = sessionStorage.getItem('civic_auth_user');
      const savedToken = sessionStorage.getItem('civic_auth_token');
      if (savedUser && savedToken) {
        try {
          setUser(JSON.parse(savedUser));
          setIdToken(savedToken);
        } catch {
          // ignore error
        }
      }
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async (): Promise<User | CivicAuthUser | null> => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        return null; // OAuth redirects
      } catch (err) {
        console.error('Supabase Google Sign-In error:', err);
        throw err;
      }
    } else {
      // Fallback for demo/offline mode
      const fallbackUser: CivicAuthUser = {
        id: 'supa-' + Math.random().toString(36).substring(2, 9),
        email: 'verified.citizen@civicfix.gov.in',
        displayName: 'Verified Citizen (Supabase Auth)',
        photoURL:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      };
      const token = 'supa_mock_jwt_' + Date.now();
      setUser(fallbackUser);
      setIdToken(token);
      sessionStorage.setItem('civic_auth_token', token);
      sessionStorage.setItem('civic_auth_user', JSON.stringify(fallbackUser));
      return fallbackUser;
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<User | null> => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data.user;
  };

  const signUpWithEmail = async (email: string, password: string, name?: string): Promise<User | null> => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name || email.split('@')[0],
        },
      },
    });
    if (error) throw error;
    return data.user;
  };

  const signOut = async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      setUser(null);
      setIdToken(null);
      sessionStorage.removeItem('civic_auth_token');
      sessionStorage.removeItem('civic_auth_user');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getToken = async (): Promise<string | null> => {
    if (isSupabaseConfigured) {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.access_token) {
          setIdToken(data.session.access_token);
          return data.session.access_token;
        }
      } catch {
        return idToken;
      }
    }
    return idToken;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        idToken,
        loading,
        isConfigured: isSupabaseConfigured,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
