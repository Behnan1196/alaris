import { DOMAINS, localDate, type DomainKey } from "@alaris/shared";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Card } from "@/components/ui";
import { requireCoach } from "@/lib/coach";
import { currentWeekDays, loadWeek } from "@/lib/tracking";
import { NoteForm } from "./note-form";
import { Progress, RecentLogs, ThisWeek } from "./sections";

const PROGRAM_STATUS: Record<string, string> = {
  draft: "Taslak",
  active: "Aktif",
  completed: "Tamamlandı",
  archived: "Arşiv",
};

const dayLabel = new Intl.DateTimeFormat("tr-TR", { weekday: "short" });

function lastSevenDays() {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    out.push({ key: localDate(d), label: dayLabel.format(d) });
  }
  return out;
}

async function Content({ params }: { params: PageProps<"/panel/danisan/[coachingId]">["params"] }) {
  const { coachingId } = await params;
  const { supabase, userId } = await requireCoach();

  const { data: coaching } = await supabase
    .from("coachings")
    .select(
      "id, status, started_at, client_id, client:profiles!coachings_client_id_fkey(full_name), coaching_domains(domain_key), programs(id, name, status, domain_key, start_date, weeks, updated_at)",
    )
    .eq("id", coachingId)
    .eq("coach_id", userId)
    .maybeSingle();
  if (!coaching) notFound();

  const { data: otherDomains } = await supabase.rpc("client_other_domains", {
    p_client_id: coaching.client_id,
  });

  // RLS: bu koçun atadıkları + danışanın "Koçlarım görebilsin" dediği kendi alışkanlıkları.
  const days = lastSevenDays();
  const { data: habits } = await supabase
    .from("habits")
    .select("id, title, coaching_id, frequency, target, unit, habit_logs(date, value)")
    .eq("client_id", coaching.client_id)
    .eq("active", true)
    .gte("habit_logs.date", days[0].key)
    .order("created_at");
  const visibleHabits = (habits ?? []).filter((h) => h.coaching_id === null || h.coaching_id === coaching.id);

  const [weekMap, { data: measurements }, { data: logs }, { data: note }] = await Promise.all([
    loadWeek(supabase, [coaching.id]),
    supabase
      .from("measurements")
      .select("metric, value, measured_on")
      .eq("coaching_id", coaching.id)
      .order("measured_on")
      .order("created_at")
      .limit(300),
    supabase
      .from("task_logs")
      .select("id, kind, data, created_at, task_instances!inner(title, date, task_type_key, coaching_id)")
      .eq("task_instances.coaching_id", coaching.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.from("coaching_notes").select("body").eq("coaching_id", coaching.id).maybeSingle(),
  ]);
  const week = weekMap.get(coaching.id)!;
  const { data: thread } = await supabase
    .from("threads")
    .select("id")
    .eq("coach_id", userId)
    .eq("client_id", coaching.client_id)
    .maybeSingle();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/panel" className="text-sm text-zinc-500 underline">
          ← Danışanlar
        </Link>
        <div className="mt-2 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">{coaching.client?.full_name || "İsimsiz danışan"}</h1>
          {thread && (
            <Link
              href={`/panel/mesajlar?t=${thread.id}`}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-zinc-50"
            >
              Mesaj gönder
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {coaching.coaching_domains.map(({ domain_key }) => {
          const d = DOMAINS[domain_key as DomainKey];
          const programs = coaching.programs
            .filter((p) => p.domain_key === domain_key && p.status !== "archived")
            .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
          const current = programs.find((p) => p.status === "active") ?? programs.find((p) => p.status === "draft");
          return (
            <section key={domain_key} className="rounded-xl border border-zinc-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d?.color }} />
                <h2 className="font-semibold">{d?.name ?? domain_key}</h2>
              </div>
              {current ? (
                <p className="mt-3 text-sm">
                  <span className="font-medium">{current.name}</span>
                  <span className="text-zinc-500"> · {PROGRAM_STATUS[current.status]}</span>
                </p>
              ) : (
                <p className="mt-3 text-sm text-zinc-500">Bu alanda henüz program yok.</p>
              )}
              <Link
                href={`/panel/danisan/${coaching.id}/program/${domain_key}`}
                className="mt-4 inline-block rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
              >
                {current ? "Programı düzenle" : "Program oluştur"}
              </Link>
            </section>
          );
        })}
      </div>

      <ThisWeek week={week} days={currentWeekDays()} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Progress measurements={(measurements ?? []).map((m) => ({ ...m, value: Number(m.value) }))} />
        <Card title="Koç notu (danışan görmez)">
          <NoteForm coachingId={coaching.id} initial={note?.body ?? ""} />
        </Card>
      </div>

      <RecentLogs logs={logs ?? []} />

      <Card title="Alışkanlıklar · son 7 gün">
        {visibleHabits.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Görebileceğin alışkanlık yok. Program oluşturucudan alışkanlık atayabilirsin; danışanın kendi
            alışkanlıkları yalnızca &quot;Koçlarım görebilsin&quot; derse burada görünür.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-zinc-500">
                <th className="pb-2 font-medium">Alışkanlık</th>
                {days.map((d) => (
                  <th key={d.key} className="pb-2 text-center font-medium">
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleHabits.map((h) => {
                const goal = h.target ?? 1;
                return (
                  <tr key={h.id} className="border-t border-zinc-100">
                    <td className="py-2">
                      <span className="font-medium">{h.title}</span>
                      <span className="block text-xs text-zinc-500">
                        {h.coaching_id ? "Senin atadığın" : "Danışanın kendi alışkanlığı"}
                        {h.target ? ` · hedef ${h.target}${h.unit ? " " + h.unit : ""}` : ""}
                      </span>
                    </td>
                    {days.map((d) => {
                      const v = Number(h.habit_logs.find((l) => l.date === d.key)?.value ?? 0);
                      const ok = v >= goal;
                      return (
                        <td key={d.key} className="py-2 text-center">
                          <span
                            title={h.target ? `${v} / ${h.target}` : ok ? "Yapıldı" : "Yapılmadı"}
                            className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs ${
                              ok ? "bg-emerald-600 text-white" : v > 0 ? "bg-amber-200" : "bg-zinc-100 text-zinc-400"
                            }`}
                          >
                            {h.target ? v : ok ? "✓" : "·"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="Başka koçlardan aldığı">
        {otherDomains?.length ? (
          <div className="flex gap-2">
            {otherDomains.map(({ domain_key }) => (
              <span key={domain_key} className="rounded-full bg-zinc-100 px-3 py-1 text-sm">
                {DOMAINS[domain_key as DomainKey]?.name ?? domain_key}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Başka bir koçtan hizmet almıyor.</p>
        )}
        <p className="mt-3 text-xs text-zinc-500">Ayrıntıları yalnızca danışan izin verirse görebilirsin.</p>
      </Card>
    </div>
  );
}

export default function Page({ params }: PageProps<"/panel/danisan/[coachingId]">) {
  return (
    <main className="flex-1 bg-zinc-50">
      <Suspense fallback={<p className="p-10 text-sm text-zinc-500">Yükleniyor…</p>}>
        <Content params={params} />
      </Suspense>
    </main>
  );
}
