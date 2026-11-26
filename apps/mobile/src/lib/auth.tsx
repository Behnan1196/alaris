import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';

import { supabase } from './supabase';

type AuthState = { session: Session | null; loading: boolean };

const AuthContext = createContext<AuthState>({ session: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, loading: true });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setState({ session: data.session, loading: false });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ session, loading: false });
    });

    // Uygulama ön plandayken oturum yenilemesi çalışsın.
    const appState =
      Platform.OS === 'web'
        ? null
        : AppState.addEventListener('change', (s) => {
            if (s === 'active') supabase.auth.startAutoRefresh();
            else supabase.auth.stopAutoRefresh();
          });

    return () => {
      sub.subscription.unsubscribe();
      appState?.remove();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export function translateAuthError(message: string) {
  if (/invalid login credentials/i.test(message)) return 'E-posta veya şifre hatalı.';
  if (/email not confirmed/i.test(message))
    return 'E-posta adresin henüz onaylanmadı. Gelen kutunu kontrol et.';
  if (/already registered/i.test(message)) return 'Bu e-posta ile zaten bir hesap var.';
  if (/password should be at least/i.test(message)) return 'Şifre en az 8 karakter olmalı.';
  if (/rate limit/i.test(message)) return 'Çok fazla deneme yapıldı. Biraz sonra tekrar dene.';
  return 'Bir hata oluştu: ' + message;
}
