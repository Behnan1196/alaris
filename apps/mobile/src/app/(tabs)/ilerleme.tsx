import {
  DOMAINS,
  MEASURE_METRIC_LABELS,
  WEEKDAYS_SHORT,
  activeWeeks,
  localDate,
  programDay,
  type DomainKey,
  type MealPayload,
  type MealProgress,
  type MeasureMetric,
  type ProgramRepeat,
} from '@alaris/shared';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Message } from '@/components/form';
import { Screen } from '@/components/screen';
import { Chip, Panel } from '@/components/tasks/common';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

type Area = { key: string; coachingId: string; domain: DomainKey; coachName: string };
type Box = { label: string; value: string; hint?: string };
type Bar = { label: string; value: number };
type AreaData = { boxes: Box[]; chartTitle: string; bars: Bar[]; unit: string; comment: string | null };

function weekDays(now = new Date()) {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
}

async function plannedThisWeek(coachingId: string, domain: string, type: string) {
  const { data } = await supabase
    .from('programs')
    .select('start_date, weeks, repeat, program_tasks(week_no, day_of_week, task_type_key)')
    .eq('coaching_id', coachingId)
    .eq('domain_key', domain)
    .eq('status', 'active')
    .maybeSingle();
  if (!data?.start_date) return 0;
  const total = activeWeeks(data.repeat as ProgramRepeat, data.weeks);
  return weekDays().reduce((n, d, i) => {
    if (!programDay(data.start_date!, total, d)) return n;
    return n + data.program_tasks.filter((t) => t.week_no === 1 && t.day_of_week === i + 1 && t.task_type_key === type).length;
  }, 0);
}

async function loadArea(a: Area): Promise<AreaData> {
  const days = weekDays();
  const from = localDate(days[0]);
  const [{ data: instances }, { data: comment }] = await Promise.all([
    supabase
      .from('task_instances')
      .select('date, status, task_type_key, payload, progress')
      .eq('coaching_id', a.coachingId)
      .eq('domain_key', a.domain)
      .gte('date', from),
    supabase.from('progress_comments').select('body').eq('coaching_id', a.coachingId).eq('domain_key', a.domain).maybeSingle(),
  ]);
  const commentText = comment?.body?.trim() || null;

  if (a.domain === 'nutrition') {
    const meals = (instances ?? []).filter((i) => i.task_type_key === 'meal');
    const kcalOf = (i: (typeof meals)[number]) => {
      const p = i.payload as unknown as MealPayload;
      const pr = i.progress as unknown as MealProgress;
      return (pr?.eaten ?? []).reduce((s, idx) => s + (p.meals?.[idx]?.kcal ?? 0), 0);
    };
    const bars = days.map((d, i) => ({
      label: WEEKDAYS_SHORT[i],
      value: meals.filter((m) => m.date === localDate(d)).reduce((s, m) => s + kcalOf(m), 0),
    }));
    const logged = bars.filter((b) => b.value > 0);
    const avg = logged.length ? Math.round(logged.reduce((s, b) => s + b.value, 0) / logged.length) : null;
    const planned = await plannedThisWeek(a.coachingId, a.domain, 'meal');
    return {
      boxes: [
        { label: 'Tüm öğünler tamam', value: `${meals.filter((m) => m.status === 'done').length} gün`, hint: planned ? `bu hafta ${planned} planlı gün` : undefined },
        { label: 'Ortalama kalori', value: avg ? `${avg} kcal` : '–', hint: 'kayıt girilen günlerde' },
      ],
      chartTitle: 'Bu hafta günlük kalori',
      bars,
      unit: 'kcal',
      comment: commentText,
    };
  }

  // Fitness (ve diğerleri): antrenman sayısı + kilo
  const done = (instances ?? []).filter((i) => i.task_type_key === 'workout' && i.status === 'done').length;
  const planned = await plannedThisWeek(a.coachingId, a.domain, 'workout');
  const { data: weights } = await supabase
    .from('measurements')
    .select('value, measured_on')
    .eq('metric', 'weight' satisfies MeasureMetric)
    .order('measured_on', { ascending: true })
    .limit(60);
  const w = weights ?? [];
  const last = w.at(-1);
  const diff = last && w.length > 1 ? Number(last.value) - Number(w[0].value) : null;
  const shortDate = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' });
  return {
    boxes: [
      { label: 'Bu hafta antrenman', value: `${done} / ${planned || '–'}` },
      {
        label: MEASURE_METRIC_LABELS.weight,
        value: last ? String(last.value) : '–',
        hint: diff !== null ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg, ilk ölçümden beri` : undefined,
      },
    ],
    chartTitle: 'Kilo',
    bars: w.slice(-10).map((m) => ({ label: shortDate.format(new Date(m.measured_on + 'T00:00:00')), value: Number(m.value) })),
    unit: 'kg',
    comment: commentText,
  };
}

function Bars({ bars, color, unit }: { bars: Bar[]; color: string; unit: string }) {
  const values = bars.map((b) => b.value).filter((v) => v > 0);
  if (!values.length) return <ThemedText type="small" themeColor="textSecondary">Henüz veri yok.</ThemedText>;
  const max = Math.max(...values);
  // Kilo gibi dar aralıklı değerlerde fark görünsün diye alt sınır kaydırılır.
  const min = unit === 'kg' ? Math.min(...values) * 0.97 : 0;
  return (
    <View style={styles.chart}>
      {bars.map((b, i) => {
        const h = b.value > 0 ? 12 + ((b.value - min) / (max - min || 1)) * 108 : 2;
        return (
          <View key={i} style={styles.barCol}>
            <ThemedText style={styles.barValue}>{b.value > 0 ? Math.round(b.value * 10) / 10 : ''}</ThemedText>
            <View style={[styles.bar, { height: h, backgroundColor: b.value > 0 ? color : 'rgba(127,127,127,0.25)' }]} />
            <ThemedText style={styles.barLabel}>{b.label}</ThemedText>
          </View>
        );
      })}
    </View>
  );
}

export default function IlerlemeScreen() {
  const { session } = useAuth();
  const uid = session?.user.id;
  const [areas, setAreas] = useState<Area[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [data, setData] = useState<AreaData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!uid) return;
    const { data: coachings, error } = await supabase
      .from('coachings')
      .select('id, coach:coach_profiles!coachings_coach_id_fkey(title, profile:profiles!coach_profiles_user_id_fkey(full_name)), coaching_domains(domain_key)')
      .eq('client_id', uid)
      .neq('status', 'ended');
    if (error) return setError(error.message);
    const list: Area[] = [];
    for (const c of coachings ?? [])
      for (const d of c.coaching_domains)
        list.push({
          key: `${c.id}:${d.domain_key}`,
          coachingId: c.id,
          domain: d.domain_key as DomainKey,
          coachName: [c.coach?.title, c.coach?.profile?.full_name].filter(Boolean).join(' '),
        });
    const order = Object.keys(DOMAINS);
    list.sort((a, b) => order.indexOf(a.domain) - order.indexOf(b.domain));
    setAreas(list);
    const current = list.find((a) => a.key === selected) ?? list[0];
    if (current) {
      setSelected(current.key);
      setData(await loadArea(current).catch((e: Error) => (setError(e.message), null)));
    }
  }, [uid, selected]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const area = areas?.find((a) => a.key === selected);
  const color = area ? DOMAINS[area.domain]?.color ?? '#18181B' : '#18181B';

  return (
    <Screen tabs>
      <ThemedText style={styles.title}>İlerleme</ThemedText>
      {error && <Message kind="error" text={error} />}
      {!areas && !error && <ActivityIndicator />}
      {areas?.length === 0 && <ThemedText themeColor="textSecondary">Bir koça bağlanınca ilerlemen burada görünür.</ThemedText>}

      {!!areas?.length && (
        <View style={styles.chips}>
          {areas.map((a) => (
            <Chip
              key={a.key}
              label={DOMAINS[a.domain]?.name ?? a.domain}
              color={DOMAINS[a.domain]?.color ?? '#18181B'}
              active={a.key === selected}
              onPress={() => {
                setSelected(a.key);
                setData(null);
              }}
            />
          ))}
        </View>
      )}

      {area && !data && <ActivityIndicator />}
      {area && data && (
        <>
          <View style={styles.boxes}>
            {data.boxes.map((b) => (
              <Panel key={b.label} style={{ flex: 1 }}>
                <ThemedText type="small" themeColor="textSecondary">{b.label}</ThemedText>
                <ThemedText style={[styles.boxValue, { color }]}>{b.value}</ThemedText>
                {b.hint && <ThemedText type="small" themeColor="textSecondary">{b.hint}</ThemedText>}
              </Panel>
            ))}
          </View>
          <Panel>
            <ThemedText type="smallBold">{data.chartTitle}</ThemedText>
            <Bars bars={data.bars} color={color} unit={data.unit} />
          </Panel>
          <Panel>
            <ThemedText type="smallBold">Koçunun yorumu</ThemedText>
            <ThemedText themeColor={data.comment ? 'text' : 'textSecondary'}>
              {data.comment ?? `${area.coachName} henüz yorum yazmadı.`}
            </ThemedText>
            {data.comment && <ThemedText type="small" themeColor="textSecondary">{area.coachName}</ThemedText>}
          </Panel>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  boxes: { flexDirection: 'row', gap: Spacing.two },
  boxValue: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 160 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 2 },
  bar: { width: '70%', borderRadius: 4 },
  barValue: { fontSize: 10, lineHeight: 12 },
  barLabel: { fontSize: 10, lineHeight: 12, opacity: 0.7 },
});
