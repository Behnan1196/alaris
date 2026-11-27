"use client";

import { useActionState } from "react";
import { useI18n } from "@/components/i18n";
import { Button, Notice } from "@/components/ui";
import { createInvite } from "./actions";
import { DomainCheckboxes } from "./domain-checkboxes";

export function InviteForm({ domainKeys }: { domainKeys: string[] }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(createInvite, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        {t("web.invite.help")}
      </p>
      <DomainCheckboxes keys={domainKeys} defaultChecked={domainKeys} />
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      {state?.code && (
        <div className="rounded-lg bg-soft px-4 py-3">
          <p className="text-xs text-muted">{t("web.invite.code")}</p>
          <p className="font-mono text-2xl font-semibold tracking-[0.3em]">{state.code}</p>
        </div>
      )}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? t("web.invite.creating") : t("web.invite.create")}
      </Button>
    </form>
  );
}
