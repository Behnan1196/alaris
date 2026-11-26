"use server";

import { KVKK_VERSION } from "@alaris/shared";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; info?: string } | undefined;

function safeNext(value: FormDataEntryValue | null) {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/panel") ? v : "/panel";
}

function translateAuthError(message: string) {
  if (/invalid login credentials/i.test(message)) return "E-posta veya şifre hatalı.";
  if (/email not confirmed/i.test(message))
    return "E-posta adresin henüz onaylanmadı. Gelen kutunu kontrol et.";
  if (/already registered/i.test(message)) return "Bu e-posta ile zaten bir hesap var.";
  if (/password should be at least/i.test(message)) return "Şifre en az 8 karakter olmalı.";
  if (/rate limit/i.test(message)) return "Çok fazla deneme yapıldı. Biraz sonra tekrar dene.";
  return "Bir hata oluştu: " + message;
}

export async function signIn(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (error) return { error: translateAuthError(error.message) };
  redirect(safeNext(formData.get("next")));
}

export async function signUp(_: FormState, formData: FormData): Promise<FormState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!fullName) return { error: "Adını yaz." };
  if (password.length < 8) return { error: "Şifre en az 8 karakter olmalı." };
  if (formData.get("kvkk") !== "on") {
    return { error: "Devam etmek için aydınlatma metnini okuyup açık rıza vermelisin." };
  }

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
      },
    },
  });
  if (error) return { error: translateAuthError(error.message) };
  if (!data.session) {
    return {
      info: `Onay bağlantısını ${email} adresine gönderdik. Bağlantıya tıklayınca kuruluma geçeceksin.`,
    };
  }
  redirect("/panel/kurulum");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/giris");
}
