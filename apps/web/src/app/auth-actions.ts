"use server";

import { KVKK_VERSION, translateError } from "@alaris/shared";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; info?: string } | undefined;

function safeNext(value: FormDataEntryValue | null) {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/panel") ? v : "/panel";
}

export async function signIn(_: FormState, formData: FormData): Promise<FormState> {
  const { t } = await getT();
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (error) return { error: translateError(error.message, t) };
  redirect(safeNext(formData.get("next")));
}

export async function signUp(_: FormState, formData: FormData): Promise<FormState> {
  const { t, locale } = await getT();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!fullName) return { error: t("auth.err.nameRequired") };
  if (password.length < 8) return { error: t("auth.err.passwordShort") };
  if (formData.get("kvkk") !== "on") return { error: t("auth.err.kvkkRequired") };

  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/panel/kurulum`,
      data: {
        full_name: fullName,
        kvkk_version: KVKK_VERSION,
        marketing_opt_in: formData.get("marketing") === "on",
        locale,
      },
    },
  });
  if (error) return { error: translateError(error.message, t) };
  if (!data.session) {
    return { info: `${t("auth.confirmSent", { email })} ${t("web.auth.confirmThenSetup")}` };
  }
  redirect("/panel/kurulum");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/giris");
}
