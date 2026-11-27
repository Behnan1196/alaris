"use server";

import { isLocale } from "@alaris/shared";
import { cookies } from "next/headers";
import { LOCALE_COOKIE } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

/** Dili çereze yazar; giriş yapılmışsa profildeki dili de günceller (bildirim dili için). */
export async function setLocale(locale: string) {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const uid = data?.claims?.sub;
  if (uid) await supabase.from("profiles").update({ locale }).eq("id", uid);
}
