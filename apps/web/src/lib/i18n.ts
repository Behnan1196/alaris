import { createT, isLocale, pickLocale, type Locale } from "@alaris/shared";
import { cookies, headers } from "next/headers";

export const LOCALE_COOKIE = "locale";

/** Dil: önce çerez (kullanıcının seçimi), yoksa tarayıcının Accept-Language başlığı. */
export async function getLocale(): Promise<Locale> {
  const c = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(c)) return c;
  return pickLocale((await headers()).get("accept-language"));
}

export async function getT() {
  const locale = await getLocale();
  return { locale, t: createT(locale) };
}
