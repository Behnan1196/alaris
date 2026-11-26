import {
  activeWeeks,
  habitDueOn,
  localDate,
  programDay,
  type HabitFrequency,
  type ProgramRepeat,
} from "@alaris/shared";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type DayStatus = "done" | "in_progress" | "missed" | "pending";

export type WeekTask = {
  programTaskId: string;
  coachingId: string;
  domain: string;
  date: string;
  dayIndex: number; // 0 = Pazartesi
  title: string;
  type: string;
  status: DayStatus;
};

export type CoachingWeek = {
  coachingId: string;
  tasks: WeekTask[];
  planned: number;
  done: number;
  missed: number;
  /** 0..1; planlanan yoksa null */
  adherence: number | null;
};

function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function currentWeekDays(now = new Date()) {
  const monday = addDays(now, -((now.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/**
 * Bu haftanın görevleri ve uyum. Uyum = bugüne kadar tamamlanan / planlanan
 * (görevler + koçun atadığı alışkanlıklar) [KARAR 2026-11-26].
 */
export async function loadWeek(supabase: Supabase, coachingIds: string[], now = new Date()) {
  const result = new Map<string, CoachingWeek>();
  for (const id of coachingIds)
    result.set(id, { coachingId: id, tasks: [], planned: 0, done: 0, missed: 0, adherence: null });
  if (!coachingIds.length) return result;

  const days = currentWeekDays(now);
  const todayKey = localDate(now);
  const from = localDate(days[0]);
  const to = localDate(days[6]);

  const [programs, instances, habits] = await Promise.all([
    supabase
      .from("programs")
      .select("id, coaching_id, domain_key, start_date, weeks, repeat, program_tasks(id, week_no, day_of_week, title, task_type_key)")
      .in("coaching_id", coachingIds)
      .eq("status", "active"),
    supabase
      .from("task_instances")
      .select("program_task_id, coaching_id, date, status")
      .in("coaching_id", coachingIds)
      .gte("date", from)
      .lte("date", to),
    supabase
      .from("habits")
      .select("id, coaching_id, frequency, target, habit_logs(date, value)")
      .in("coaching_id", coachingIds)
      .eq("active", true)
      .gte("habit_logs.date", from),
  ]);

  const statusOf = new Map(
    (instances.data ?? []).map((i) => [`${i.program_task_id}:${i.date}`, i.status as string]),
  );

  for (const p of programs.data ?? []) {
    if (!p.coaching_id || !p.start_date) continue;
    const total = activeWeeks(p.repeat as ProgramRepeat, p.weeks);
    const week = result.get(p.coaching_id)!;
    days.forEach((day, i) => {
      if (!programDay(p.start_date!, total, day)) return;
      const key = localDate(day);
      for (const t of p.program_tasks.filter((x) => x.week_no === 1 && x.day_of_week === i + 1)) {
        const s = statusOf.get(`${t.id}:${key}`);
        const status: DayStatus =
          s === "done" ? "done" : key < todayKey ? "missed" : s === "in_progress" ? "in_progress" : "pending";
        week.tasks.push({
          programTaskId: t.id,
          coachingId: p.coaching_id!,
          domain: p.domain_key,
          date: key,
          dayIndex: i,
          title: t.title,
          type: t.task_type_key,
          status,
        });
        if (key <= todayKey) {
          week.planned++;
          if (status === "done") week.done++;
        }
        if (status === "missed") week.missed++;
      }
    });
  }

  for (const h of habits.data ?? []) {
    if (!h.coaching_id) continue;
    const week = result.get(h.coaching_id)!;
    const goal = Number(h.target ?? 1);
    const doneDays = new Set(h.habit_logs.filter((l) => Number(l.value) >= goal).map((l) => l.date));
    const elapsed = days.filter((d) => localDate(d) <= todayKey);
    if (h.frequency === "three_per_week") {
      // Haftada 3: hedef, geçen gün sayısıyla sınırlı (pazartesi 1, çarşambadan sonra 3).
      const planned = Math.min(3, elapsed.length);
      week.planned += planned;
      week.done += Math.min(planned, elapsed.filter((d) => doneDays.has(localDate(d))).length);
    } else {
      for (const d of elapsed) {
        if (!habitDueOn(h.frequency as HabitFrequency, d)) continue;
        week.planned++;
        if (doneDays.has(localDate(d))) week.done++;
      }
    }
  }

  for (const w of result.values()) w.adherence = w.planned ? w.done / w.planned : null;
  return result;
}

export function pct(v: number | null) {
  return v === null ? "–" : `%${Math.round(v * 100)}`;
}
