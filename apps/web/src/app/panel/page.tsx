import {
  DOMAINS,
  TASK_TYPE_LABELS,
  activeWeeks,
  type DomainKey,
  type ProgramRepeat,
  type TaskTypeKey,
} from "@alaris/shared";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { TopActions } from "@/components/sidebar";
import { Card, PageBody, PageHeader } from "@/components/ui";
import { requireCoach } from "@/lib/coach";
import { loadThreads } from "@/lib/messages";
import { loadWeek, pct } from "@/lib/tracking";

const dateFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long" });
const timeFmt = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" });

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Günaydın" : h < 18 ? "İyi günler" : "İyi akşamlar";
}

function Kpi({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

function adherenceColor(v: number | null) {
  if (v === null) return "bg-line";
  if (v >= 0.8) return "bg-emerald-600";
  if (v >= 0.5) return "bg-amber-500";
  return "bg-red-500";
}

type Attention = { key: string; client: string; text: string; href: string; action: string; tone: "red" | "amber" | "zinc" };

async function Content() {
  const coach = await requireCoach();
  const { supabase, userId } = coach;

  const [{ data: coachings }] = await Promise.all([
    supabase
      .from("coachings")
      .select(
        "id, status, started_at, client:profiles!coachings_client_id_fkey(full_name), coaching_domains(domain_key), programs(id, name, status, domain_key, start_date, weeks, repeat)",
      )
      .eq("coach_id", userId)
      .order("started_at", { ascending: false }),
  ]);

  const open = (coachings ?? []).filter((c) => c.status !== "ended");
  const ids = open.map((c) => c.id);
  const nameOf = new Map(open.map((c) => [c.id, c.client?.full_name || "İsimsiz"]));
  const [week, threads] = await Promise.all([loadWeek(supabase, ids), loadThreads(supabase, userId)]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const [{ data: doneToday }, { data: measuredToday }] = await Promise.all([
    ids.length
      ? supabase
          .from("task_instances")
          .select("id, coaching_id, title, task_type_key, domain_key, completed_at")
          .in("coaching_id", ids)
          .eq("status", "done")
          .gte("completed_at", todayStart.toISOString())
          .order("completed_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] }),
    ids.length
      ? supabase
          .from("measurements")
          .select("id, coaching_id, metric, value, created_at")
          .in("coaching_id", ids)
          .gte("created_at", todayStart.toISOString())
          .order("created_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] }),
  ]);

  // İlgilenmen gerekenler
  const attention: Attention[] = threads
    .filter((t) => t.unread > 0)
    .map((t) => ({
      key: `${t.id}:unread`,
      client: t.otherName,
      text: `${t.unread} okunmamış mesaj`,
      href: `/panel/mesajlar?t=${t.id}`,
      action: "Mesaja yanıt ver",
      tone: "red" as const,
    }));
  const today = new Date();
  for (const c of open) {
    const client = nameOf.get(c.id)!;
    const w = week.get(c.id)!;
    if (w.missed > 0)
      attention.push({
        key: `${c.id}:missed`,
        client,
        text: `Bu hafta ${w.missed} görevi kaçırdı`,
        href: `/panel/danisan/${c.id}`,
        action: "Kayıtları gör",
        tone: "red",
      });
    for (const { domain_key } of c.coaching_domains) {
      const programs = c.programs.filter((p) => p.domain_key === domain_key);
      const active = programs.find((p) => p.status === "active");
      const name = DOMAINS[domain_key as DomainKey]?.name ?? domain_key;
      if (!active) {
        attention.push({
          key: `${c.id}:${domain_key}:none`,
          client,
          text: `${name} için gönderilmiş program yok`,
          href: `/panel/danisan/${c.id}/program/${domain_key}`,
          action: programs.some((p) => p.status === "draft") ? "Taslağı aç" : "Program oluştur",
          tone: "amber",
        });
      } else if (active.start_date) {
        const weeks = activeWeeks(active.repeat as ProgramRepeat, active.weeks);
        const start = new Date(active.start_date + "T00:00:00");
        const monday = new Date(start);
        monday.setDate(start.getDate() - ((start.getDay() + 6) % 7));
        const end = new Date(monday);
        end.setDate(monday.getDate() + weeks * 7);
        const left = Math.ceil((end.getTime() - today.getTime()) / 86_400_000);
        if (left <= 7)
          attention.push({
            key: `${c.id}:${domain_key}:ending`,
            client,
            text: left > 0 ? `${name} programı ${left} gün içinde bitiyor` : `${name} programı bitti`,
            href: `/panel/danisan/${c.id}/program/${domain_key}`,
            action: "Programı aç",
            tone: "zinc",
          });
      }
    }
  }

  const feed = [
    ...(doneToday ?? []).map((t) => ({
      key: t.id,
      at: t.completed_at!,
      client: nameOf.get(t.coaching_id) ?? "",
      text: `${TASK_TYPE_LABELS[t.task_type_key as TaskTypeKey] ?? t.task_type_key} tamamladı: ${t.title}`,
      domain: t.domain_key,
    })),
    ...(measuredToday ?? []).map((m) => ({
      key: m.id,
      at: m.created_at,
      client: nameOf.get(m.coaching_id ?? "") ?? "",
      text: `Ölçüm girdi: ${m.metric === "weight" ? "kilo" : m.metric === "waist" ? "bel" : m.metric === "hip" ? "kalça" : "yağ oranı"} ${m.value}`,
      domain: null as string | null,
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  const weeks = [...week.values()].filter((w) => w.adherence !== null);
  const avg = weeks.length ? weeks.reduce((s, w) => s + w.adherence!, 0) / weeks.length : null;

  return (
    <PageBody>
      <PageHeader crumb={dateFmt.format(today)} title={<>{greeting()}, {coach.name.split(" ")[0] || "koç"}</>} actions={<TopActions />} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Aktif danışan" value={open.filter((c) => c.status === "active").length} />
        <Kpi label="Bu hafta uyum" value={pct(avg)} hint="görevler + atadığın alışkanlıklar" />
        <Kpi label="Bugün tamamlanan görev" value={doneToday?.length ?? 0} />
        <Kpi label="İlgilenmen gereken" value={attention.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <Card title="İlgilenmen gerekenler">
            {attention.length === 0 ? (
              <p className="text-sm text-muted">Şu an her şey yolunda.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {attention.map((a) => (
                  <li key={a.key} className="flex items-center gap-3 py-2.5 text-sm">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        a.tone === "red" ? "bg-red-500" : a.tone === "amber" ? "bg-amber-500" : "bg-muted/50"
                      }`}
                    />
                    <span className="flex-1">
                      <span className="font-medium">{a.client}</span> · {a.text}
                    </span>
                    <Link href={a.href} className="rounded-md border border-line px-2.5 py-1 text-xs font-medium hover:bg-soft">
                      {a.action}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Bu hafta uyum">
            {!open.length ? (
              <p className="text-sm text-muted">
                Henüz danışanın yok. <Link href="/panel/danisanlar" className="underline">Danışanlar</Link> sayfasından davet kodu oluştur.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {open.map((c) => {
                  const w = week.get(c.id);
                  return (
                    <li key={c.id} className="grid grid-cols-[160px_1fr_90px] items-center gap-3 text-sm">
                      <Link href={`/panel/danisan/${c.id}`} className="truncate font-medium hover:underline">
                        {c.client?.full_name || "İsimsiz"}
                      </Link>
                      <div className="h-2 overflow-hidden rounded-full bg-soft">
                        <div className={`h-full rounded-full ${adherenceColor(w?.adherence ?? null)}`} style={{ width: `${Math.round((w?.adherence ?? 0) * 100)}%` }} />
                      </div>
                      <span className="text-right text-xs text-muted">
                        {pct(w?.adherence ?? null)}
                        {w?.planned ? ` · ${w.done}/${w.planned}` : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-4 text-xs text-muted">Bu hafta bugüne kadar planlanan görevler ve atadığın alışkanlıklar içinde tamamlananlar.</p>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card title="Bugün olanlar">
            {feed.length === 0 ? (
              <p className="text-sm text-muted">Bugün henüz bir hareket yok.</p>
            ) : (
              <ul className="flex flex-col gap-3 text-sm">
                {feed.map((f) => (
                  <li key={f.key} className="flex gap-2">
                    <span className="w-11 shrink-0 text-xs text-muted">{timeFmt.format(new Date(f.at))}</span>
                    <span>
                      <span className="font-medium">{f.client}</span> {f.text}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </PageBody>
  );
}

export default function Page() {
  return (
    <main className="flex-1 bg-page">
      <Suspense fallback={<p className="p-10 text-sm text-muted">Yükleniyor…</p>}>
        <Content />
      </Suspense>
    </main>
  );
}
