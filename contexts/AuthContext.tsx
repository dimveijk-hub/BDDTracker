import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services';
import type { Profile } from '../types';

interface AuthState {
  user: { uid: string } | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  loading: true,
  error: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ uid: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async (uid: string) => {
      try {
        const loaded = await api.fetchProfile(uid);
        if (loaded) setProfile(loaded);
        else console.warn('No profile found for user:', uid);
      } catch (e) {
        console.error('Unexpected error fetching profile:', e);
        setError((e as Error).message || 'Error fetching profile');
      } finally {
        setLoading(false);
      }
    };

    return api.onAuthChange(async (authUser) => {
      setUser(authUser);
      if (authUser) {
        setLoading(true);
        await loadProfile(authUser.uid);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });
  }, []);

  const signOut = async () => {
    try {
      await api.signOut();
    } catch (e) {
      console.error('Error signing out: ', e);
    }
  };

  return <AuthContext.Provider value={{ user, profile, loading, error, signOut }}>{children}</AuthContext.Provider>;
};
