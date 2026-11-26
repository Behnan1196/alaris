import { DOMAINS, type DomainKey } from "@alaris/shared";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Button, Field } from "@/components/ui";
import { requireCoach } from "@/lib/coach";
import { createProgram } from "@/app/panel/program-actions";
import { Builder } from "./builder";

type Params = PageProps<"/panel/danisan/[coachingId]/program/[domain]">["params"];

async function Content({ params }: { params: Params }) {
  const { coachingId, domain } = await params;
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
    <div>
      <Link href={`/panel/danisan/${coachingId}`} className="text-sm text-zinc-500 underline">
        ← {coaching.client?.full_name || "Danışan"}
      </Link>
      <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold tracking-tight">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
        {d.name} programı
      </h1>
    </div>
  );

  if (!program) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-10">
        {header}
        <form action={createProgram} className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5">
          <input type="hidden" name="coaching_id" value={coachingId} />
          <input type="hidden" name="domain_key" value={domain} />
          <Field label="Program adı" name="name" placeholder={`ör. ${d.key === "fitness" ? "Güç ve kondisyon" : "Yağ kaybı planı"}`} required />
          <Field label="Süre (hafta)" name="weeks" type="number" min={1} max={52} defaultValue={4} required />
          <Button type="submit">Taslak oluştur</Button>
        </form>
      </div>
    );
  }

  const [{ data: tasks }, { data: habits }, { data: exercises }] = await Promise.all([
    supabase
      .from("program_tasks")
      .select("id, day_of_week, task_type_key, title, payload, options, client_note, sort_order")
      .eq("program_id", program.id)
      .eq("week_no", 1)
      .order("sort_order")
      .order("created_at"),
    supabase
      .from("habits")
      .select("id, title, frequency, target, unit, reminder_time, client_can_edit_target, show_streak")
      .eq("coaching_id", coachingId)
      .eq("domain_key", domain)
      .eq("active", true)
      .order("created_at"),
    supabase.from("exercises").select("id, name").order("name"),
  ]);

  return (
    <div className="flex w-full flex-col gap-6 px-6 py-8">
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
        exercises={exercises ?? []}
      />
    </div>
  );
}

export default function Page({ params }: PageProps<"/panel/danisan/[coachingId]/program/[domain]">) {
  return (
    <main className="flex-1 bg-zinc-50">
      <Suspense fallback={<p className="p-10 text-sm text-zinc-500">Yükleniyor…</p>}>
        <Content params={params} />
      </Suspense>
    </main>
  );
}
