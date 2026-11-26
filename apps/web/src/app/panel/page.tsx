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
import { DomainTag } from "@/components/domain-tag";
import { Card } from "@/components/ui";
import { requireCoach } from "@/lib/coach";
import { loadThreads } from "@/lib/messages";
import { loadWeek, pct } from "@/lib/tracking";
import { signOut } from "../auth-actions";
import { InviteForm } from "./invite-form";

const STATUS_LABELS: Record<string, string> = {
  invited: "Davet edildi",
  active: "Aktif",
  paused: "Duraklatıldı",
  ended: "Bitti",
};

const dateFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long" });
const timeFmt = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" });

function Kpi({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

function adherenceColor(v: number | null) {
  if (v === null) return "bg-zinc-300";
  if (v >= 0.8) return "bg-emerald-600";
  if (v >= 0.5) return "bg-amber-500";
  return "bg-red-500";
}

type Attention = { key: string; client: string; text: string; href: string; action: string; tone: "red" | "amber" | "zinc" };

async function Content() {
  const coach = await requireCoach();
  const { supabase, userId } = coach;

  const [{ data: coachings }, { data: invites }] = await Promise.all([
    supabase
      .from("coachings")
      .select(
        "id, status, started_at, client:profiles!coachings_client_id_fkey(full_name), coaching_domains(domain_key), programs(id, name, status, domain_key, start_date, weeks, repeat)",
      )
      .eq("coach_id", userId)
      .order("started_at", { ascending: false }),
    supabase
      .from("invites")
      .select("id, code, domain_keys, expires_at")
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
  ]);

  const open = (coachings ?? []).filter((c) => c.status !== "ended");
  const ids = open.map((c) => c.id);
  const nameOf = new Map(open.map((c) => [c.id, c.client?.full_name || "İsimsiz"]));
  const [week, threads] = await Promise.all([loadWeek(supabase, ids), loadThreads(supabase, userId)]);
  const unreadTotal = threads.reduce((n, t) => n + t.unread, 0);

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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">Alaris · Koç paneli · {dateFmt.format(today)}</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Merhaba, {[coach.title, coach.name].filter(Boolean).join(" ")}
          </h1>
          <div className="mt-2 flex gap-1.5">
            {coach.domainKeys.map((k) => (
              <DomainTag key={k} k={k} />
            ))}
            <Link href="/panel/kurulum" className="ml-2 text-xs text-zinc-500 underline">
              Alanları düzenle
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/panel/mesajlar" className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50">
            Mesajlar
            {unreadTotal > 0 && <span className="ml-1.5 rounded-full bg-red-600 px-1.5 text-xs text-white">{unreadTotal}</span>}
          </Link>
        <form action={signOut}>
          <button className="text-sm text-zinc-600 underline">Çıkış yap</button>
        </form>
        </div>
      </header>

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
              <p className="text-sm text-zinc-500">Şu an her şey yolunda.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-zinc-100">
                {attention.map((a) => (
                  <li key={a.key} className="flex items-center gap-3 py-2.5 text-sm">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        a.tone === "red" ? "bg-red-500" : a.tone === "amber" ? "bg-amber-500" : "bg-zinc-400"
                      }`}
                    />
                    <span className="flex-1">
                      <span className="font-medium">{a.client}</span> · {a.text}
                    </span>
                    <Link href={a.href} className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium hover:bg-zinc-50">
                      {a.action}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={`Danışanlar (${coachings?.length ?? 0})`}>
            {!coachings?.length ? (
              <p className="text-sm text-zinc-500">Henüz danışanın yok. Bir davet kodu oluşturup danışanınla paylaş.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-zinc-500">
                  <tr>
                    <th className="pb-2 font-medium">Danışan</th>
                    <th className="pb-2 font-medium">Alanlar</th>
                    <th className="pb-2 font-medium">Bu hafta uyum</th>
                    <th className="pb-2 font-medium">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {coachings.map((c) => {
                    const w = week.get(c.id);
                    return (
                      <tr key={c.id} className="border-t border-zinc-100">
                        <td className="py-2.5 font-medium">
                          <Link href={`/panel/danisan/${c.id}`} className="hover:underline">
                            {c.client?.full_name || "İsimsiz"}
                          </Link>
                          <span className="block text-xs font-normal text-zinc-500">
                            {dateFmt.format(new Date(c.started_at))} tarihinden beri
                          </span>
                        </td>
                        <td className="py-2.5">
                          <div className="flex gap-1">
                            {c.coaching_domains.map((d) => (
                              <DomainTag key={d.domain_key} k={d.domain_key} />
                            ))}
                          </div>
                        </td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-100">
                              <div
                                className={`h-full ${adherenceColor(w?.adherence ?? null)}`}
                                style={{ width: `${Math.round((w?.adherence ?? 0) * 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-zinc-600">
                              {pct(w?.adherence ?? null)}
                              {w?.planned ? ` (${w.done}/${w.planned})` : ""}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 text-zinc-600">{STATUS_LABELS[c.status]}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card title="Bugün olanlar">
            {feed.length === 0 ? (
              <p className="text-sm text-zinc-500">Bugün henüz bir hareket yok.</p>
            ) : (
              <ul className="flex flex-col gap-3 text-sm">
                {feed.map((f) => (
                  <li key={f.key} className="flex gap-2">
                    <span className="w-11 shrink-0 text-xs text-zinc-500">{timeFmt.format(new Date(f.at))}</span>
                    <span>
                      <span className="font-medium">{f.client}</span> {f.text}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Danışan davet et">
            <InviteForm domainKeys={coach.domainKeys} />
          </Card>
          {!!invites?.length && (
            <Card title="Kullanılmamış davetler">
              <ul className="flex flex-col gap-3 text-sm">
                {invites.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-2">
                    <span className="font-mono font-semibold tracking-widest">{i.code}</span>
                    <span className="flex gap-1">
                      {i.domain_keys.map((k) => (
                        <DomainTag key={k} k={k} />
                      ))}
                    </span>
                    <span className="text-xs text-zinc-500">{dateFmt.format(new Date(i.expires_at))}e kadar</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <main className="flex-1 bg-zinc-50">
      <Suspense fallback={<p className="p-10 text-sm text-zinc-500">Yükleniyor…</p>}>
        <Content />
      </Suspense>
    </main>
  );
}
