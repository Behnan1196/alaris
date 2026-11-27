"use client";

import { useActionState } from "react";
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
  const [state, action, pending] = useActionState(becomeCoach, undefined);
  return (
    <form action={action} className="flex flex-col gap-5">
      <Field
        label="Unvan (isteğe bağlı, ör. Dyt., PT)"
        name="title"
        defaultValue={defaultTitle}
        maxLength={30}
      />
      <div className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-ink-2">Hangi alanlarda koçluk veriyorsun?</span>
        <DomainCheckboxes keys={enabledKeys} defaultChecked={defaultDomains} />
        <span className="text-muted">Sınav ve Gitar yakında.</span>
      </div>
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      <Button type="submit" disabled={pending}>
        {pending ? "Kaydediliyor…" : "Kaydet ve panele geç"}
      </Button>
    </form>
  );
}
