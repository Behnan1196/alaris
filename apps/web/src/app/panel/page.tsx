import {
  activeWeeks,
  intlLocale,
  type DomainKey,
  type MeasureMetric,
  type ProgramRepeat,
  type TaskTypeKey,
  type TFunction,
} from "@alaris/shared";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { TopActions } from "@/components/sidebar";
import { Card, Loading, PageBody, PageHeader } from "@/components/ui";
import { requireCoach } from "@/lib/coach";
import { getT } from "@/lib/i18n";
import { loadThreads } from "@/lib/messages";
import { loadWeek, pct } from "@/lib/tracking";

function greeting(t: TFunction) {
  const h = new Date().getHours();
  return h < 12 ? t("greet.morning") : h < 18 ? t("greet.day") : t("greet.evening");
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
  const { t, locale } = await getT();
  const dateFmt = new Intl.DateTimeFormat(intlLocale(locale), { weekday: "long", day: "numeric", month: "long" });
  const timeFmt = new Intl.DateTimeFormat(intlLocale(locale), { hour: "2-digit", minute: "2-digit" });

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
  const nameOf = new Map(open.map((c) => [c.id, c.client?.full_name || t("common.unnamed")]));
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
    .filter((th) => th.unread > 0)
    .map((th) => ({
      key: `${th.id}:unread`,
      client: th.otherName,
      text: t("web.att.unread", { n: th.unread }),
      href: `/panel/mesajlar?t=${th.id}`,
      action: t("web.att.reply"),
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
        text: t("web.att.missed", { n: w.missed }),
        href: `/panel/danisan/${c.id}`,
        action: t("web.att.seeLogs"),
        tone: "red",
      });
    for (const { domain_key } of c.coaching_domains) {
      const programs = c.programs.filter((p) => p.domain_key === domain_key);
      const active = programs.find((p) => p.status === "active");
      const name = t(`domain.${domain_key as DomainKey}`);
      if (!active) {
        attention.push({
          key: `${c.id}:${domain_key}:none`,
          client,
          text: t("web.att.noProgram", { domain: name }),
          href: `/panel/danisan/${c.id}/program/${domain_key}`,
          action: programs.some((p) => p.status === "draft") ? t("web.att.openDraft") : t("nav.createProgram"),
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
            text: left > 0 ? t("web.att.ending", { domain: name, n: left }) : t("web.att.ended", { domain: name }),
            href: `/panel/danisan/${c.id}/program/${domain_key}`,
            action: t("web.att.openProgram"),
            tone: "zinc",
          });
      }
    }
  }

  const feed = [
    ...(doneToday ?? []).map((x) => ({
      key: x.id,
      at: x.completed_at!,
      client: nameOf.get(x.coaching_id) ?? "",
      text: t("web.feed.completed", { type: t(`taskType.${x.task_type_key as TaskTypeKey}`), title: x.title }),
      domain: x.domain_key,
    })),
    ...(measuredToday ?? []).map((m) => ({
      key: m.id,
      at: m.created_at,
      client: nameOf.get(m.coaching_id ?? "") ?? "",
      text: t("web.feed.measured", { metric: t(`metricShort.${m.metric as MeasureMetric}`), value: m.value }),
      domain: null as string | null,
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  const weeks = [...week.values()].filter((w) => w.adherence !== null);
  const avg = weeks.length ? weeks.reduce((s, w) => s + w.adherence!, 0) / weeks.length : null;

  return (
    <PageBody>
      <PageHeader crumb={dateFmt.format(today)} title={<>{greeting(t)}, {coach.name.split(" ")[0] || t("common.coach")}</>} actions={<TopActions />} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label={t("web.kpi.activeClients")} value={open.filter((c) => c.status === "active").length} />
        <Kpi label={t("web.kpi.adherence")} value={pct(avg)} hint={t("web.kpi.adherenceHint")} />
        <Kpi label={t("web.kpi.doneToday")} value={doneToday?.length ?? 0} />
        <Kpi label={t("web.kpi.attention")} value={attention.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <Card title={t("web.att.title")}>
            {attention.length === 0 ? (
              <p className="text-sm text-muted">{t("web.att.allGood")}</p>
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

          <Card title={t("web.kpi.adherence")}>
            {!open.length ? (
              <p className="text-sm text-muted">
                {t("web.overview.noClients")}{" "}
                <Link href="/panel/danisanlar" className="underline">
                  {t("nav.clients")}
                </Link>
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {open.map((c) => {
                  const w = week.get(c.id);
                  return (
                    <li key={c.id} className="grid grid-cols-[160px_1fr_90px] items-center gap-3 text-sm">
                      <Link href={`/panel/danisan/${c.id}`} className="truncate font-medium hover:underline">
                        {c.client?.full_name || t("common.unnamed")}
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
            <p className="mt-4 text-xs text-muted">{t("web.adherence.explain")}</p>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card title={t("web.feed.title")}>
            {feed.length === 0 ? (
              <p className="text-sm text-muted">{t("web.feed.empty")}</p>
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
      <Suspense fallback={<Loading />}>
        <Content />
      </Suspense>
    </main>
  );
}
