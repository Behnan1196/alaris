"use client";

import { createT, intlLocale, type Locale, type TFunction } from "@alaris/shared";
import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";

type Ctx = { locale: Locale; t: TFunction; intl: string };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo(() => ({ locale, t: createT(locale), intl: intlLocale(locale) }), [locale]);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const v = useContext(I18nContext);
  if (!v) throw new Error("I18nProvider eksik");
  return v;
}
