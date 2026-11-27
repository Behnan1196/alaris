"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "@/app/auth-actions";
import { useI18n } from "@/components/i18n";
import { Button, Field, Notice } from "@/components/ui";

export function SignupForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(signUp, undefined);
  if (state?.info) return <Notice kind="info">{state.info}</Notice>;
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label={t("auth.fullName")} name="full_name" autoComplete="name" required />
      <Field label={t("auth.email")} name="email" type="email" autoComplete="email" required />
      <Field label={t("auth.passwordNew")} name="password" type="password" autoComplete="new-password" minLength={8} required />
      <label className="flex gap-2 text-sm text-ink-2">
        <input type="checkbox" name="kvkk" required className="mt-0.5" />
        <span>
          {t("auth.kvkkConsent")}{" "}
          <Link href="/kvkk" target="_blank" className="underline">
            {t("auth.kvkkLink")}
          </Link>
        </span>
      </label>
      <label className="flex gap-2 text-sm text-ink-2">
        <input type="checkbox" name="marketing" className="mt-0.5" />
        <span>{t("auth.marketing")}</span>
      </label>
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      <Button type="submit" disabled={pending}>
        {pending ? t("auth.signingUp") : t("auth.signUp")}
      </Button>
      <p className="text-sm text-muted">
        {t("web.auth.haveAccount")}{" "}
        <Link href="/giris" className="font-medium underline">
          {t("auth.signIn")}
        </Link>
      </p>
    </form>
  );
}
