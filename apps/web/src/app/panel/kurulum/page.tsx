import { DOMAINS } from "@alaris/shared";
import { Suspense } from "react";
import { AuthCard } from "@/components/ui";
import { requireUser } from "@/lib/coach";
import { SetupForm } from "./setup-form";

async function Content() {
  const { supabase, userId } = await requireUser();
  const { data: coach } = await supabase
    .from("coach_profiles")
    .select("title, coach_domains(domain_key)")
    .eq("user_id", userId)
    .maybeSingle();

  const enabledKeys = Object.values(DOMAINS)
    .filter((d) => d.enabled)
    .map((d) => d.key);

  return (
    <SetupForm
      enabledKeys={enabledKeys}
      defaultTitle={coach?.title ?? ""}
      defaultDomains={coach?.coach_domains.map((d) => d.domain_key) ?? []}
    />
  );
}

export default function Page() {
  return (
    <AuthCard title="Koç profilini kur">
      <Suspense>
        <Content />
      </Suspense>
    </AuthCard>
  );
}
