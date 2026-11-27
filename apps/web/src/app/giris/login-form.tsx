"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "@/app/auth-actions";
import { Button, Field, Notice } from "@/components/ui";

export function LoginForm({ next, confirmed }: { next?: string; confirmed?: boolean }) {
  const [state, action, pending] = useActionState(signIn, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      {confirmed && <Notice kind="info">E-posta adresin onaylandı. Şimdi giriş yapabilirsin.</Notice>}
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="E-posta" name="email" type="email" autoComplete="email" required />
      <Field label="Şifre" name="password" type="password" autoComplete="current-password" required />
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      <Button type="submit" disabled={pending}>
        {pending ? "Giriş yapılıyor…" : "Giriş yap"}
      </Button>
      <p className="text-sm text-muted">
        Hesabın yok mu?{" "}
        <Link href="/kayit" className="font-medium underline">
          Koç olarak kaydol
        </Link>
      </p>
    </form>
  );
}
