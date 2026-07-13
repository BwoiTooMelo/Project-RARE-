import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLogs } from './LogContext';
import { supabase } from '../lib/supabase-client';

export type SubscriptionPlan = 'free' | 'pro' | 'premium';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  plan: SubscriptionPlan;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => void;
  refreshPlan: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { addLog } = useLogs();

  // Pull the authoritative plan from the profiles table. This is the only
  // source of truth for `plan` now — it's set by the verify-paystack-payment
  // Edge Function after a real, server-verified payment, and a DB trigger
  // blocks any client-side attempt to change it directly.
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', userId)
      .single();

    if (error) {
      addLog('AUTH', `Could not load subscription plan, defaulting to free. (${error.message})`);
      return 'free' as SubscriptionPlan;
    }

    return (data?.plan ?? 'free') as SubscriptionPlan;
  };

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user;

      if (sessionUser) {
        const plan = await fetchProfile(sessionUser.id);
        setUser({
          id: sessionUser.id,
          name: sessionUser.user_metadata?.name ?? 'Cinematic Creator',
          email: sessionUser.email ?? '',
          avatar: sessionUser.user_metadata?.avatar_url ?? '',
          plan,
        });
      }

      setLoading(false);
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const plan = await fetchProfile(session.user.id);
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.name ?? 'Cinematic Creator',
          email: session.user.email ?? '',
          avatar: session.user.user_metadata?.avatar_url ?? '',
          plan,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) {
      addLog('AUTH', `Google Sign-In failed: ${error.message}`);
      setLoading(false);
      return;
    }
    addLog('AUTH', 'Google Sign-In initiated — redirecting for OAuth consent.');
    // Loading resolves in onAuthStateChange once the redirect completes.
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    addLog('AUTH', 'User session terminated.');
  };

  // Call after a successful payment verification to pull the freshly
  // updated plan without requiring a full page reload.
  const refreshPlan = async () => {
    if (!user) return;
    const plan = await fetchProfile(user.id);
    setUser((prev) => (prev ? { ...prev, plan } : prev));
    addLog('PAYMENT', `Subscription plan refreshed: ${plan.toUpperCase()}.`);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshPlan }}>
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
