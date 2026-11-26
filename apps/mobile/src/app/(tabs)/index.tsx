import {
  DOMAINS,
  TASK_TYPE_LABELS,
  activeWeeks,
  localDate,
  programDay,
  type DomainKey,
  type ProgramRepeat,
  type TaskTypeKey,
} from '@alaris/shared';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Message } from '@/components/form';
import { HabitList, withValue } from '@/components/habit-list';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { loadHabits, type HabitView } from '@/lib/habits';
import { supabase } from '@/lib/supabase';

type Widget = {
  key: string;
  domainKey: string;
  coachName: string;
  programName: string | null;
  week: number | null;
  weeks: number | null;
  startsLater: string | null;
  today: { id: string; type: string; title: string; status: string | null }[];
};

const dateFmt = new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
const shortDate = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' });

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

export default function KocluklarimScreen() {
  const { session } = useAuth();
  const [name, setName] = useState('');
  const [widgets, setWidgets] = useState<Widget[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [habits, setHabits] = useState<HabitView[]>([]);

  const load = useCallback(async () => {
    const uid = session?.user.id;
    if (!uid) return;
    const [profile, coachings, instances] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', uid).single(),
      supabase
        .from('coachings')
        .select(
          `id,
           coach:coach_profiles!coachings_coach_id_fkey(title, profile:profiles!coach_profiles_user_id_fkey(full_name)),
           coaching_domains(domain_key),
           programs(name, weeks, start_date, repeat, status, domain_key, program_tasks(id, week_no, day_of_week, task_type_key, title, sort_order))`,
        )
        .eq('client_id', uid)
        .neq('status', 'ended'),
      supabase
        .from('task_instances')
        .select('program_task_id, status')
        .eq('client_id', uid)
        .eq('date', localDate()),
    ]);
    loadHabits(uid).then(setHabits).catch((e: Error) => setError(e.message));
    const statusOf = new Map((instances.data ?? []).map((i) => [i.program_task_id, i.status]));
    if (coachings.error) return setError(coachings.error.message);
    setName(profile.data?.full_name?.split(' ')[0] ?? '');

    const list: Widget[] = [];
    for (const c of coachings.data) {
      const coachName = [c.coach?.title, c.coach?.profile?.full_name].filter(Boolean).join(' ');
      for (const { domain_key } of c.coaching_domains) {
        const program = c.programs.find((p) => p.domain_key === domain_key && p.status === 'active');
        const total = program ? activeWeeks(program.repeat as ProgramRepeat, program.weeks) : 0;
        const pos = program?.start_date ? programDay(program.start_date, total) : null;
        const today = pos
          ? program!.program_tasks
              .filter((t) => t.week_no === 1 && t.day_of_week === pos.dayOfWeek)
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((t) => ({ id: t.id, type: t.task_type_key, title: t.title, status: statusOf.get(t.id) ?? null }))
          : [];
        const startsLater =
          program?.start_date && new Date(program.start_date + 'T00:00:00') > new Date()
            ? shortDate.format(new Date(program.start_date + 'T00:00:00'))
            : null;
        list.push({
          key: `${c.id}:${domain_key}`,
          domainKey: domain_key,
          coachName,
          programName: program?.name ?? null,
          week: pos?.week ?? null,
          weeks: program ? total : null,
          startsLater,
          today,
        });
      }
    }
    const order = Object.keys(DOMAINS);
    list.sort((a, b) => order.indexOf(a.domainKey) - order.indexOf(b.domainKey));
    setWidgets(list);
  }, [session?.user.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <Screen tabs>
      <View style={styles.header}>
        <ThemedText type="small" themeColor="textSecondary">
          {dateFmt.format(new Date())}
        </ThemedText>
        <ThemedText style={styles.hello}>
          {greeting()}
          {name ? `, ${name}` : ''}
        </ThemedText>
        {widgets && (
          <ThemedText type="small" themeColor="textSecondary">
            {widgets.length ? `${widgets.length} aktif koçluk alanı` : 'Henüz bir koçun yok'}
          </ThemedText>
        )}
      </View>

      {error && <Message kind="error" text={error} />}
      {!widgets && !error && <ActivityIndicator />}

      {widgets?.map((w) => {
        const d = DOMAINS[w.domainKey as DomainKey];
        return (
          <View key={w.key} style={[styles.widget, { backgroundColor: d?.color ?? '#333' }]}>
            <ThemedText type="smallBold" style={styles.widgetMuted}>
              {d?.name ?? w.domainKey}
            </ThemedText>
            <ThemedText style={styles.widgetTitle}>
              {w.programName ?? 'Program bekleniyor'}
            </ThemedText>
            <ThemedText type="small" style={styles.widgetMuted}>
              {w.coachName}
              {w.week && w.weeks ? ` · Hafta ${w.week} / ${w.weeks}` : ''}
            </ThemedText>
            {!w.programName && (
              <ThemedText type="small" style={styles.widgetMuted}>
                Koçun programı gönderince bugünün işi burada görünecek.
              </ThemedText>
            )}
            {w.programName && w.startsLater && (
              <ThemedText type="small" style={styles.widgetMuted}>
                Program {w.startsLater} tarihinde başlıyor.
              </ThemedText>
            )}
            {w.programName && !w.startsLater && w.today.length === 0 && (
              <ThemedText type="small" style={styles.widgetMuted}>
                Bugün bu alanda görev yok. Dinlenme günü.
              </ThemedText>
            )}
            {w.today.length > 0 && (
              <View style={styles.todayList}>
                <ThemedText type="smallBold" style={styles.widgetMuted}>
                  Bugün
                </ThemedText>
                {w.today.map((t) => (
                  <Pressable
                    key={t.id}
                    onPress={() => router.push({ pathname: '/gorev/[id]', params: { id: t.id } })}
                    style={({ pressed }) => [styles.todayRow, pressed && { opacity: 0.7 }]}>
                    <View style={{ flex: 1 }}>
                      <ThemedText type="small" style={styles.widgetMuted}>
                        {TASK_TYPE_LABELS[t.type as TaskTypeKey] ?? t.type}
                      </ThemedText>
                      <ThemedText style={styles.todayTitle}>{t.title}</ThemedText>
                    </View>
                    <View style={styles.action}>
                      <ThemedText type="smallBold" style={{ color: '#111' }}>
                        {t.status === 'done' ? '✓ Tamamlandı' : t.status === 'in_progress' ? 'Devam et' : 'Başla'}
                      </ThemedText>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        );
      })}

      <ThemedView type="backgroundElement" style={styles.habits}>
        <View style={styles.habitsHead}>
          <ThemedText type="smallBold">Alışkanlıklarım</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Bugün {habits.filter((h) => h.due && h.doneToday).length} / {habits.filter((h) => h.due).length} tamam
          </ThemedText>
        </View>
        <HabitList
          habits={habits}
          onChanged={(id, v) => setHabits((hs) => withValue(hs, id, v))}
          onError={setError}
        />
        <Pressable onPress={() => router.push('/aliskanliklar')}>
          <ThemedText type="linkPrimary">Alışkanlıkları yönet ve yeni ekle</ThemedText>
        </Pressable>
      </ThemedView>

      <Pressable onPress={() => router.push('/koc-ekle')}>
        {({ pressed }) => (
          <ThemedView type="backgroundElement" style={[styles.addCoach, pressed && { opacity: 0.7 }]}>
            <ThemedText type="smallBold">+ Davet koduyla koç ekle</ThemedText>
          </ThemedView>
        )}
      </Pressable>

      <Pressable onPress={() => supabase.auth.signOut()}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.signOut}>
          Çıkış yap
        </ThemedText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.one, marginBottom: Spacing.two },
  hello: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  widget: { borderRadius: Spacing.four, padding: Spacing.four, gap: Spacing.one, minHeight: 140 },
  widgetTitle: { color: '#fff', fontSize: 22, lineHeight: 28, fontWeight: '700' },
  widgetMuted: { color: 'rgba(255,255,255,0.85)' },
  todayList: { marginTop: Spacing.two, gap: Spacing.one },
  todayRow: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Spacing.two,
    padding: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  action: { backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  habits: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  habitsHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  todayTitle: { color: '#fff', fontWeight: '600' },
  addCoach: { borderRadius: Spacing.three, padding: Spacing.three, alignItems: 'center' },
  signOut: { textAlign: 'center', marginTop: Spacing.three },
});
