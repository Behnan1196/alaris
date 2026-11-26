import { habitDueOn, localDate, type HabitFrequency } from '@alaris/shared';

import { supabase } from './supabase';

export type HabitRow = {
  id: string;
  title: string;
  frequency: HabitFrequency;
  target: number | null;
  unit: string | null;
  coaching_id: string | null;
  domain_key: string | null;
  show_streak: boolean;
  visible_to_coaches: boolean;
  client_can_edit_target: boolean;
  reminder_time: string | null;
};

export type HabitView = HabitRow & {
  today: number;
  due: boolean;
  doneToday: boolean;
  streak: number;
  weekCount: number;
};

const goal = (h: { target: number | null }) => h.target ?? 1;

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export async function loadHabits(clientId: string): Promise<HabitView[]> {
  const { data: habits, error } = await supabase
    .from('habits')
    .select(
      'id, title, frequency, target, unit, coaching_id, domain_key, show_streak, visible_to_coaches, client_can_edit_target, reminder_time',
    )
    .eq('client_id', clientId)
    .eq('active', true)
    .order('created_at');
  if (error) throw error;
  if (!habits.length) return [];

  const since = localDate(addDays(new Date(), -60));
  const { data: logs } = await supabase
    .from('habit_logs')
    .select('habit_id, date, value')
    .in(
      'habit_id',
      habits.map((h) => h.id),
    )
    .gte('date', since);

  const byHabit = new Map<string, Map<string, number>>();
  for (const l of logs ?? []) {
    if (!byHabit.has(l.habit_id)) byHabit.set(l.habit_id, new Map());
    byHabit.get(l.habit_id)!.set(l.date, Number(l.value));
  }

  const now = new Date();
  const today = localDate(now);
  const monday = addDays(now, -((now.getDay() + 6) % 7));

  return habits.map((h) => {
    const values = byHabit.get(h.id) ?? new Map<string, number>();
    const todayValue = values.get(today) ?? 0;
    const doneToday = todayValue >= goal(h);

    // Seri: bugünden (bugün henüz bitmediyse dünden) geriye, uygun günlerde hedefe ulaşılan ardışık gün sayısı.
    let streak = 0;
    let d = doneToday ? now : addDays(now, -1);
    for (let i = 0; i < 60; i++, d = addDays(d, -1)) {
      if (!habitDueOn(h.frequency as HabitFrequency, d)) continue;
      if ((values.get(localDate(d)) ?? 0) >= goal(h)) streak++;
      else break;
    }

    let weekCount = 0;
    for (let i = 0; i < 7; i++) {
      const day = addDays(monday, i);
      if (day > now) break;
      if ((values.get(localDate(day)) ?? 0) >= goal(h)) weekCount++;
    }

    return {
      ...(h as HabitRow),
      today: todayValue,
      due: habitDueOn(h.frequency as HabitFrequency, now),
      doneToday,
      streak,
      weekCount,
    };
  });
}

/** Bugünün değerini yazar (sayaçlı alışkanlıkta adet, tek dokunuşta 0/1). */
export async function setHabitValue(habitId: string, value: number) {
  const date = localDate();
  if (value <= 0) {
    const { error } = await supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('date', date);
    if (error) throw error;
    return;
  }
  const { error } = await supabase
    .from('habit_logs')
    .upsert({ habit_id: habitId, date, value }, { onConflict: 'habit_id,date' });
  if (error) throw error;
}
