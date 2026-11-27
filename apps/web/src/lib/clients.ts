import { activeWeeks, localDate, programDay, type MessageKey, type ProgramRepeat } from "@alaris/shared";
import type { createClient } from "@/lib/supabase/server";
import { currentWeekDays, loadWeek } from "@/lib/tracking";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type ClientFlag = "message" | "attention" | "no_program" | "ending" | "inactive";

export const FLAG_LABELS: Record<ClientFlag | "ok", MessageKey> = {
  message: "flag.message",
  attention: "flag.attention",
  no_program: "flag.no_program",
  ending: "flag.ending",
  inactive: "flag.inactive",
  ok: "flag.ok",
};

/** Öncelik sırası: listede tek bir durum gösterilirken ilk eşleşen kullanılır. */
export const FLAG_ORDER: ClientFlag[] = ["message", "attention", "no_program", "ending", "inactive"];

export type ClientRow = {
  id: string;
  name: string;
  status: string;
  startedAt: string;
  domains: string[];
  /** Aktif programların "hafta / toplam" bilgisi, alan bazında. */
  weeks: { domain: string; week: number; total: number }[];
  adherence: number | null;
  done: number;
  planned: number;
  /** Son 4 hafta (eskiden yeniye) uyum; veri yoksa null. */
  trend: (number | null)[];
  lastActivity: string | null;
  unread: number;
  flags: ClientFlag[];
};

const INACTIVE_DAYS = 5;

function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export async function loadClientRows(supabase: Supabase, coachId: string): Promise<ClientRow[]> {
  const { data: coachings } = await supabase
    .from("coachings")
    .select(
      "id, status, started_at, client_id, client:profiles!coachings_client_id_fkey(full_name), coaching_domains(domain_key), programs(domain_key, status, start_date, weeks, repeat)",
    )
    .eq("coach_id", coachId)
    .order("started_at", { ascending: false });
  if (!coachings?.length) return [];

  const open = coachings.filter((c) => c.status !== "ended");
  const ids = open.map((c) => c.id);
  const clientIds = coachings.map((c) => c.client_id);
  const now = new Date();
  const monday = currentWeekDays(now)[0];
  // Önceki 3 haftanın pazar günleri (eğilim için)
  const pastSundays = [3, 2, 1].map((w) => addDays(monday, -7 * (w - 1) - 1));

  const [current, ...past] = await Promise.all([
    loadWeek(supabase, ids, now),
    ...pastSundays.map((d) => loadWeek(supabase, ids, d)),
  ]);

  const since = localDate(addDays(now, -60));
  const [{ data: instances }, { data: measures }, { data: threads }] = await Promise.all([
    ids.length
      ? supabase.from("task_instances").select("coaching_id, updated_at").in("coaching_id", ids).gte("date", since).order("updated_at", { ascending: false }).limit(1000)
      : Promise.resolve({ data: [] as { coaching_id: string; updated_at: string }[] }),
    ids.length
      ? supabase.from("measurements").select("coaching_id, created_at").in("coaching_id", ids).gte("measured_on", since).order("created_at", { ascending: false }).limit(500)
      : Promise.resolve({ data: [] as { coaching_id: string | null; created_at: string }[] }),
    supabase.from("threads").select("id, client_id").eq("coach_id", coachId).in("client_id", clientIds),
  ]);

  const threadIds = (threads ?? []).map((t) => t.id);
  const [{ data: clientMsgs }, { data: unreadMsgs }] = threadIds.length
    ? await Promise.all([
        supabase.from("messages").select("thread_id, created_at").in("thread_id", threadIds).neq("sender_id", coachId).order("created_at", { ascending: false }).limit(500),
        supabase.from("messages").select("thread_id").in("thread_id", threadIds).neq("sender_id", coachId).is("read_at", null),
      ])
    : [{ data: [] }, { data: [] }];

  const latest = new Map<string, string>();
  const bump = (key: string, at: string | null | undefined) => {
    if (at && (!latest.has(key) || latest.get(key)! < at)) latest.set(key, at);
  };
  for (const i of instances ?? []) bump(i.coaching_id, i.updated_at);
  for (const m of measures ?? []) if (m.coaching_id) bump(m.coaching_id, m.created_at);
  const threadOfClient = new Map((threads ?? []).map((t) => [t.client_id, t.id]));
  const lastMsgOfThread = new Map<string, string>();
  for (const m of clientMsgs ?? []) if (!lastMsgOfThread.has(m.thread_id)) lastMsgOfThread.set(m.thread_id, m.created_at);
  const unreadOfThread = new Map<string, number>();
  for (const m of unreadMsgs ?? []) unreadOfThread.set(m.thread_id, (unreadOfThread.get(m.thread_id) ?? 0) + 1);

  return coachings.map((c) => {
    const w = current.get(c.id);
    const threadId = threadOfClient.get(c.client_id);
    if (threadId) bump(c.id, lastMsgOfThread.get(threadId));
    const unread = threadId ? (unreadOfThread.get(threadId) ?? 0) : 0;
    const domains = c.coaching_domains.map((d) => d.domain_key);

    const weeks: ClientRow["weeks"] = [];
    let ending = false;
    let missingProgram = false;
    for (const domain of domains) {
      const p = c.programs.find((x) => x.domain_key === domain && x.status === "active");
      if (!p || !p.start_date) {
        missingProgram = true;
        continue;
      }
      const total = activeWeeks(p.repeat as ProgramRepeat, p.weeks);
      const pos = programDay(p.start_date, total, now);
      if (pos) weeks.push({ domain, week: pos.week, total });
      // Program 7 gün içinde bitiyor ya da bitmiş
      const start = new Date(p.start_date + "T00:00:00");
      const startMonday = addDays(start, -((start.getDay() + 6) % 7));
      const end = addDays(startMonday, total * 7);
      if (start <= now && (end.getTime() - now.getTime()) / 86_400_000 <= 7) ending = true;
    }

    const last = latest.get(c.id) ?? null;
    const inactiveDays = last ? (now.getTime() - new Date(last).getTime()) / 86_400_000 : Infinity;
    const flags: ClientFlag[] = [];
    if (c.status !== "ended") {
      if (unread > 0) flags.push("message");
      if (w && (w.missed > 0 || (w.adherence !== null && w.adherence < 0.5))) flags.push("attention");
      if (missingProgram) flags.push("no_program");
      if (ending) flags.push("ending");
      if (inactiveDays > INACTIVE_DAYS) flags.push("inactive");
    }

    return {
      id: c.id,
      name: c.client?.full_name || "",
      status: c.status,
      startedAt: c.started_at,
      domains,
      weeks,
      adherence: w?.adherence ?? null,
      done: w?.done ?? 0,
      planned: w?.planned ?? 0,
      trend: [...past.map((m) => m.get(c.id)?.adherence ?? null), w?.adherence ?? null],
      lastActivity: last,
      unread,
      flags,
    };
  });
}
