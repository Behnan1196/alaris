"use client";

import { useActionState } from "react";
import { Button, Notice } from "@/components/ui";
import { createInvite } from "./actions";
import { DomainCheckboxes } from "./domain-checkboxes";

export function InviteForm({ domainKeys }: { domainKeys: string[] }) {
  const [state, action, pending] = useActionState(createInvite, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <p className="text-sm text-zinc-600">
        Danışana hangi alanlarda koçluk vereceksin? Kodu danışanla paylaş; uygulamada
        &quot;Davet koduyla koç ekle&quot; bölümüne yazacak. Kod 14 gün geçerli ve tek kullanımlık.
      </p>
      <DomainCheckboxes keys={domainKeys} defaultChecked={domainKeys} />
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      {state?.code && (
        <div className="rounded-lg bg-zinc-100 px-4 py-3">
          <p className="text-xs text-zinc-500">Davet kodu</p>
          <p className="font-mono text-2xl font-semibold tracking-[0.3em]">{state.code}</p>
        </div>
      )}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Oluşturuluyor…" : "Davet kodu oluştur"}
      </Button>
    </form>
  );
}
