"use client";

import { useActionState } from "react";
import { useI18n } from "@/components/i18n";
import { Button, Field, Notice } from "@/components/ui";
import { becomeCoach } from "../actions";
import { DomainCheckboxes } from "../domain-checkboxes";

export function SetupForm({
  enabledKeys,
  defaultTitle,
  defaultDomains,
}: {
  enabledKeys: string[];
  defaultTitle: string;
  defaultDomains: string[];
}) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(becomeCoach, undefined);
  return (
    <form action={action} className="flex flex-col gap-5">
      <Field
        label={t("web.setup.title")}
        name="title"
        defaultValue={defaultTitle}
        maxLength={30}
      />
      <div className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-ink-2">{t("web.setup.domains")}</span>
        <DomainCheckboxes keys={enabledKeys} defaultChecked={defaultDomains} />
        <span className="text-muted">{t("web.setup.soon")}</span>
      </div>
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      <Button type="submit" disabled={pending}>
        {pending ? t("common.saving") : t("web.setup.submit")}
      </Button>
    </form>
  );
}
