/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadSupabase } from '../lib/supabase-client';

const AuthContext = createContext(null);

/* True when a session is already in storage. Reading it synchronously lets
   the marketing page paint on the first frame instead of waiting for the
   session round-trip, while a returning member still gets the portal. */
function hasStoredSession() {
  try {
    const key = Object.keys(window.localStorage).find(
      (k) => k.startsWith('sb-') && k.endsWith('-auth-token')
    );
    return key ? Boolean(JSON.parse(window.localStorage.getItem(key))?.access_token) : false;
  } catch {
    return false;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // { id, full_name, role, org_name }
  const [loading, setLoading] = useState(hasStoredSession);

  // Ensure a ceda_profiles row exists for the signed-in user (self-heals
  // signups where the insert raced the auth trigger or confirmation).
  const ensureProfile = async (supabase, u) => {
    if (!u) return null;
    const { data } = await supabase
      .from('ceda_profiles')
      .select('*')
      .eq('id', u.id)
      .maybeSingle();
    if (data) {
      setProfile(data);
      return data;
    }
    const role = u.user_metadata?.requested_role || 'participant';
    const row = {
      id: u.id,
      full_name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'User',
      role,
      org_name: u.user_metadata?.org_name || null,
      phone: u.user_metadata?.phone || null,
    };
    const { data: created, error } = await supabase.from('ceda_profiles').insert(row).select().single();
    if (error) {
      console.error('[auth] profile creation failed:', error.message);
      return null;
    }
    setProfile(created);
    return created;
  };

  useEffect(() => {
    let cancelled = false;
    let subscription;

    (async () => {
      const supabase = await loadSupabase();
      if (cancelled) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      setUser(session?.user ?? null);
      await ensureProfile(supabase, session?.user);
      if (!cancelled) setLoading(false);

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser((prev) => {
          const next = session?.user ?? null;
          if (prev?.id === next?.id) return prev;
          ensureProfile(supabase, next);
          return next;
        });
      });
      subscription = data.subscription;
    })();

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

  const signup = async (email, password, metadata = {}) => {
    const supabase = await loadSupabase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (error) throw error;
    if (data.session) {
      await ensureProfile(supabase, data.user);
    }
    return data;
  };

  const login = async (email, password) => {
    const supabase = await loadSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const resetPassword = async (email) => {
    const supabase = await loadSupabase();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  };

  const logout = async () => {
    const supabase = await loadSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, signup, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
