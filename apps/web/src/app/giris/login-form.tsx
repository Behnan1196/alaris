"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "@/app/auth-actions";
import { useI18n } from "@/components/i18n";
import { Button, Field, Notice } from "@/components/ui";

export function LoginForm({ next, confirmed }: { next?: string; confirmed?: boolean }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(signIn, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      {confirmed && <Notice kind="info">{t("web.auth.confirmed")}</Notice>}
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label={t("auth.email")} name="email" type="email" autoComplete="email" required />
      <Field label={t("auth.password")} name="password" type="password" autoComplete="current-password" required />
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      <Button type="submit" disabled={pending}>
        {pending ? t("auth.signingIn") : t("auth.signIn")}
      </Button>
      <p className="text-sm text-muted">
        {t("web.auth.noAccount")}{" "}
        <Link href="/kayit" className="font-medium underline">
          {t("web.auth.signUpAsCoach")}
        </Link>
      </p>
    </form>
  );
}
