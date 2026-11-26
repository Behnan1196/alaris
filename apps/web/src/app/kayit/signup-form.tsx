"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "@/app/auth-actions";
import { Button, Field, Notice } from "@/components/ui";

export function SignupForm() {
  const [state, action, pending] = useActionState(signUp, undefined);
  if (state?.info) return <Notice kind="info">{state.info}</Notice>;
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Ad soyad" name="full_name" autoComplete="name" required />
      <Field label="E-posta" name="email" type="email" autoComplete="email" required />
      <Field
        label="Şifre (en az 8 karakter)"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <label className="flex gap-2 text-sm text-zinc-700">
        <input type="checkbox" name="kvkk" required className="mt-0.5" />
        <span>
          <Link href="/kvkk" target="_blank" className="underline">
            Aydınlatma metnini
          </Link>{" "}
          okudum, kişisel verilerimin işlenmesine açık rıza veriyorum.
        </span>
      </label>
      <label className="flex gap-2 text-sm text-zinc-700">
        <input type="checkbox" name="marketing" className="mt-0.5" />
        <span>Alaris&apos;ten haber ve kampanya e-postaları almak istiyorum (isteğe bağlı).</span>
      </label>
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      <Button type="submit" disabled={pending}>
        {pending ? "Kaydediliyor…" : "Kaydol"}
      </Button>
      <p className="text-sm text-zinc-600">
        Zaten hesabın var mı?{" "}
        <Link href="/giris" className="font-medium underline">
          Giriş yap
        </Link>
      </p>
    </form>
  );
}
