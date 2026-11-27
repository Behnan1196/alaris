import AsyncStorage from '@react-native-async-storage/async-storage';
import { createT, intlLocale, isLocale, pickLocale, type Locale, type TFunction } from '@alaris/shared';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { supabase } from './supabase';

const KEY = 'alaris.locale';

/** Cihazın dili (Hermes Intl üzerinden); desteklenmiyorsa Türkçe. */
function deviceLocale(): Locale {
  try {
    return pickLocale(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {
    return 'tr';
  }
}

type Ctx = { locale: Locale; t: TFunction; intl: string; setLocale: (l: Locale) => void };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(deviceLocale);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (isLocale(v)) setLocaleState(v);
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      locale,
      t: createT(locale),
      intl: intlLocale(locale),
      setLocale: (l) => {
        setLocaleState(l);
        AsyncStorage.setItem(KEY, l);
        // Bildirimler bu dilde gönderilsin.
        supabase.auth.getSession().then(({ data }) => {
          const uid = data.session?.user.id;
          if (uid) supabase.from('profiles').update({ locale: l }).eq('id', uid).then(() => {});
        });
      },
    }),
    [locale],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const v = useContext(I18nContext);
  if (!v) throw new Error('I18nProvider eksik');
  return v;
}
