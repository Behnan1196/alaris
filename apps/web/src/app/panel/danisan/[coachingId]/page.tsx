import { DOMAINS, localDate, type DomainKey } from "@alaris/shared";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DomainTag } from "@/components/domain-tag";
import { Card, PageBody, PageHeader } from "@/components/ui";
import { requireCoach } from "@/lib/coach";
import { currentWeekDays, loadWeek, pct } from "@/lib/tracking";
import { CommentForm } from "./comment-form";
import { NoteForm } from "./note-form";
import { Photos } from "./photos";
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

async function Content({
  params,
  searchParams,
}: {
  params: PageProps<"/panel/danisan/[coachingId]">["params"];
  searchParams: PageProps<"/panel/danisan/[coachingId]">["searchParams"];
}) {
  const { coachingId } = await params;
  const sp = await searchParams;
  const tab = typeof sp.tab === "string" ? sp.tab : "genel";
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
  const [{ data: comments }, { data: photoRows }] = await Promise.all([
    supabase.from("progress_comments").select("domain_key, body").eq("coaching_id", coaching.id),
    supabase
      .from("photos")
      .select("id, kind, path, meta, taken_on")
      .eq("coaching_id", coaching.id)
      .order("created_at", { ascending: false })
      .limit(24),
  ]);
  const signed = photoRows?.length
    ? (await supabase.storage.from("media").createSignedUrls(photoRows.map((p) => p.path), 3600)).data ?? []
    : [];
  const photos = (photoRows ?? []).map((p, i) => ({ ...p, url: signed[i]?.signedUrl ?? null }));
  const { data: thread } = await supabase
    .from("threads")
    .select("id")
    .eq("coach_id", userId)
    .eq("client_id", coaching.client_id)
    .maybeSingle();

  const tabHref = (t: string) => `/panel/danisan/${coaching.id}${t === "genel" ? "" : `?tab=${t}`}`;
  const tabs: [string, string][] = [
    ["genel", "Genel"],
    ["ilerleme", "İlerleme"],
    ["aliskanliklar", "Alışkanlıklar"],
    ["kayitlar", "Son kayıtlar"],
  ];
  const startedFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <PageBody>
      <PageHeader
        crumb={<Link href="/panel/danisanlar" className="hover:underline">Danışanlar</Link>}
        title={coaching.client?.full_name || "İsimsiz danışan"}
        actions={
          <>
            {thread && (
              <Link href={`/panel/mesajlar?t=${thread.id}`} className="flex h-10 items-center rounded-xl border border-line bg-surface px-4 text-sm font-medium hover:bg-soft">
                Mesaj gönder
              </Link>
            )}
            <Link
              href={`/panel/danisan/${coaching.id}/program/${coaching.coaching_domains[0]?.domain_key ?? "fitness"}`}
              className="flex h-10 items-center rounded-xl bg-ink px-4 text-sm font-medium text-white hover:bg-ink-2"
            >
              Programı düzenle
            </Link>
          </>
        }
      />
      <div className="-mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
        <span className="flex gap-1">
          {coaching.coaching_domains.map(({ domain_key }) => (
            <DomainTag key={domain_key} k={domain_key} />
          ))}
        </span>
        <span>
          Bu hafta uyum {pct(week.adherence)}
          {week.planned ? ` (${week.done}/${week.planned})` : ""}
        </span>
        {week.missed > 0 && <span className="text-red-700">{week.missed} kaçırılan görev</span>}
        <span>{startedFmt.format(new Date(coaching.started_at))} tarihinden beri</span>
      </div>

      <nav className="flex gap-1 border-b border-line">
        {tabs.map(([k, label]) => (
          <Link
            key={k}
            href={tabHref(k)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${tab === k ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"}`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          {tab === "genel" && (
            <>
              <ThisWeek week={week} days={currentWeekDays()} />
              <RecentLogs logs={(logs ?? []).slice(0, 8)} />
            </>
          )}
          {tab === "ilerleme" && (
            <>
              <Progress measurements={(measurements ?? []).map((m) => ({ ...m, value: Number(m.value) }))} />
              <Photos photos={photos} />
              <Card title="İlerleme yorumların (danışan İlerleme ekranında görür)">
                <div className="grid gap-4 sm:grid-cols-2">
                  {coaching.coaching_domains.map(({ domain_key }) => (
                    <div key={domain_key}>
                      <DomainTag k={domain_key} />
                      <CommentForm
                        coachingId={coaching.id}
                        domain={domain_key}
                        initial={comments?.find((c) => c.domain_key === domain_key)?.body ?? ""}
                      />
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
          {tab === "aliskanliklar" && (
            <Card title="Alışkanlıklar · son 7 gün">
              {visibleHabits.length === 0 ? (
                <p className="text-sm text-muted">
                  Görebileceğin alışkanlık yok. Program oluşturucudan alışkanlık atayabilirsin; danışanın kendi
                  alışkanlıkları yalnızca &quot;Koçlarım görebilsin&quot; derse burada görünür.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted">
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
                        <tr key={h.id} className="border-t border-line">
                          <td className="py-2">
                            <span className="font-medium">{h.title}</span>
                            <span className="block text-xs text-muted">
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
                                    ok ? "bg-emerald-600 text-white" : v > 0 ? "bg-amber-200" : "bg-soft text-muted"
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
          )}
          {tab === "kayitlar" && <RecentLogs logs={logs ?? []} />}
        </div>

        <aside className="flex flex-col gap-6 xl:sticky xl:top-6 xl:self-start">
          <Card title="Programlar">
            <ul className="flex flex-col gap-1">
              {coaching.coaching_domains.map(({ domain_key }) => {
                const d = DOMAINS[domain_key as DomainKey];
                const programs = coaching.programs
                  .filter((p) => p.domain_key === domain_key && p.status !== "archived")
                  .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
                const current = programs.find((p) => p.status === "active") ?? programs.find((p) => p.status === "draft");
                return (
                  <li key={domain_key}>
                    <Link href={`/panel/danisan/${coaching.id}/program/${domain_key}`} className="flex items-start gap-2 rounded-xl p-2 hover:bg-soft">
                      <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d?.color }} />
                      <span className="text-sm">
                        <span className="block font-medium">{current?.name ?? `${d?.name}: program yok`}</span>
                        <span className="block text-xs text-muted">
                          {d?.name}
                          {current ? ` · ${PROGRAM_STATUS[current.status]}` : " · oluşturmak için tıkla"}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
          <Card title="Koç notu (danışan görmez)">
            <NoteForm coachingId={coaching.id} initial={note?.body ?? ""} />
          </Card>
          <Card title="Başka koçlardan aldığı">
            {otherDomains?.length ? (
              <div className="flex flex-wrap gap-2">
                {otherDomains.map(({ domain_key }) => (
                  <span key={domain_key} className="rounded-full bg-soft px-3 py-1 text-sm">
                    {DOMAINS[domain_key as DomainKey]?.name ?? domain_key}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Başka bir koçtan hizmet almıyor.</p>
            )}
            <p className="mt-3 text-xs text-muted">Ayrıntıları yalnızca danışan izin verirse görebilirsin.</p>
          </Card>
        </aside>
      </div>
    </PageBody>
  );
}

export default function Page({ params, searchParams }: PageProps<"/panel/danisan/[coachingId]">) {
  return (
    <Suspense fallback={<p className="p-10 text-sm text-muted">Yükleniyor…</p>}>
      <Content params={params} searchParams={searchParams} />
    </Suspense>
  );
}
