import { DOMAINS, localizedName, type DomainKey } from "@alaris/shared";
import { getT } from "@/lib/i18n";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Button, Field, PageHeader, Loading } from "@/components/ui";
import { requireCoach } from "@/lib/coach";
import { createProgram } from "@/app/panel/program-actions";
import { Builder } from "./builder";

type Params = PageProps<"/panel/danisan/[coachingId]/program/[domain]">["params"];

async function Content({ params }: { params: Params }) {
  const { coachingId, domain } = await params;
  const { t, locale } = await getT();
  const { supabase, userId } = await requireCoach();
  const d = DOMAINS[domain as DomainKey];
  if (!d) notFound();

  const { data: coaching } = await supabase
    .from("coachings")
    .select("id, client_id, client:profiles!coachings_client_id_fkey(full_name), coaching_domains(domain_key)")
    .eq("id", coachingId)
    .eq("coach_id", userId)
    .maybeSingle();
  if (!coaching || !coaching.coaching_domains.some((cd) => cd.domain_key === domain)) notFound();

  const { data: programs } = await supabase
    .from("programs")
    .select("id, name, weeks, start_date, repeat, status, updated_at")
    .eq("coaching_id", coachingId)
    .eq("domain_key", domain)
    .in("status", ["active", "draft"])
    .order("updated_at", { ascending: false });
  const program = programs?.find((p) => p.status === "active") ?? programs?.[0];

  const header = (
    <PageHeader
      crumb={
        <Link href={`/panel/danisan/${coachingId}`} className="hover:underline">
          {coaching.client?.full_name || t("web.col.client")}
        </Link>
      }
      title={
        <span className="flex items-center gap-3">
          <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: d.color }} />
          {t("b.domainProgram", { domain: t(`domain.${d.key}`) })}
        </span>
      }
    />
  );

  if (!program) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-8 py-8">
        {header}
        <form action={createProgram} className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5">
          <input type="hidden" name="coaching_id" value={coachingId} />
          <input type="hidden" name="domain_key" value={domain} />
          <Field label={t("b.programName")} name="name" placeholder={d.key === "fitness" ? t("b.namePhFitness") : t("b.namePhNutrition")} required />
          <Field label={t("b.weeks")} name="weeks" type="number" min={1} max={52} defaultValue={4} required />
          <Button type="submit">{t("b.createDraft")}</Button>
        </form>
      </div>
    );
  }

  const [{ data: tasks }, { data: habits }, { data: exercises }] = await Promise.all([
    supabase
      .from("program_tasks")
      .select("id, week_no, day_of_week, task_type_key, title, payload, options, client_note, sort_order")
      .eq("program_id", program.id)
      .order("week_no")
      .order("sort_order")
      .order("created_at"),
    supabase
      .from("habits")
      .select("id, title, frequency, target, unit, reminder_time, client_can_edit_target, show_streak")
      .eq("coaching_id", coachingId)
      .eq("domain_key", domain)
      .eq("active", true)
      .order("created_at"),
    supabase.from("exercises").select("id, name, name_i18n").order("name"),
  ]);

  return (
    <div className="flex w-full flex-col gap-6 px-8 py-8">
      {header}
      <Builder
        path={`/panel/danisan/${coachingId}/program/${domain}`}
        coachingId={coachingId}
        clientId={coaching.client_id}
        clientName={coaching.client?.full_name ?? ""}
        domain={d.key}
        program={program}
        tasks={tasks ?? []}
        habits={habits ?? []}
        exercises={(exercises ?? []).map((e) => ({ id: e.id, name: localizedName(e, locale) }))}
      />
    </div>
  );
}

export default function Page({ params }: PageProps<"/panel/danisan/[coachingId]/program/[domain]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Content params={params} />
    </Suspense>
  );
}
