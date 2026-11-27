import {
  DOMAINS,
  activeWeeks,
  localDate,
  programDay,
  tasksForDay,
  type DomainKey,
  type ProgramRepeat,
  type TaskTypeKey,
  type TFunction,
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
import { LanguagePicker } from '@/components/language-picker';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { loadHabits, type HabitView } from '@/lib/habits';
import { syncHabitReminders, unregisterPushToken } from '@/lib/notifications';
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

function greeting(t: TFunction) {
  const h = new Date().getHours();
  if (h < 12) return t('greet.morning');
  if (h < 18) return t('greet.day');
  return t('greet.evening');
}

export default function KocluklarimScreen() {
  const { session } = useAuth();
  const { t, intl } = useI18n();
  const dateFmt = new Intl.DateTimeFormat(intl, { weekday: 'long', day: 'numeric', month: 'long' });
  const shortDate = new Intl.DateTimeFormat(intl, { day: 'numeric', month: 'long' });
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
    loadHabits(uid).then((hs) => {
      setHabits(hs);
      syncHabitReminders(hs);
    }).catch((e: Error) => setError(e.message));
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
              .filter((x) => tasksForDay(program!.program_tasks, pos.week, pos.dayOfWeek).includes(x))
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((x) => ({ id: x.id, type: x.task_type_key, title: x.title, status: statusOf.get(x.id) ?? null }))
          : [];
        const startsLater =
          program?.start_date && new Date(program.start_date + 'T00:00:00') > new Date()
            ? program.start_date
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
  }, [session?.user.id, setError, setHabits]);

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
          {greeting(t)}
          {name ? `, ${name}` : ''}
        </ThemedText>
        {widgets && (
          <ThemedText type="small" themeColor="textSecondary">
            {widgets.length ? t('m.home.activeAreas', { n: widgets.length }) : t('m.home.noCoach')}
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
              {t(`domain.${w.domainKey as DomainKey}`)}
            </ThemedText>
            <ThemedText style={styles.widgetTitle}>
              {w.programName ?? t('m.home.awaitingProgram')}
            </ThemedText>
            <ThemedText type="small" style={styles.widgetMuted}>
              {w.coachName}
              {w.week && w.weeks ? ` · ${t('m.home.weekOf', { week: w.week, weeks: w.weeks })}` : ''}
            </ThemedText>
            {!w.programName && (
              <ThemedText type="small" style={styles.widgetMuted}>
                {t('m.home.awaitingHint')}
              </ThemedText>
            )}
            {w.programName && w.startsLater && (
              <ThemedText type="small" style={styles.widgetMuted}>
                {t('m.home.startsOn', { date: shortDate.format(new Date(w.startsLater + 'T00:00:00')) })}
              </ThemedText>
            )}
            {w.programName && !w.startsLater && w.today.length === 0 && (
              <ThemedText type="small" style={styles.widgetMuted}>
                {t('m.home.restDay')}
              </ThemedText>
            )}
            {w.today.length > 0 && (
              <View style={styles.todayList}>
                <ThemedText type="smallBold" style={styles.widgetMuted}>
                  {t('common.today')}
                </ThemedText>
                {w.today.map((x) => (
                  <Pressable
                    key={x.id}
                    onPress={() => router.push({ pathname: '/gorev/[id]', params: { id: x.id } })}
                    style={({ pressed }) => [styles.todayRow, pressed && { opacity: 0.7 }]}>
                    <View style={{ flex: 1 }}>
                      <ThemedText type="small" style={styles.widgetMuted}>
                        {t(`taskType.${x.type as TaskTypeKey}`)}
                      </ThemedText>
                      <ThemedText style={styles.todayTitle}>{x.title}</ThemedText>
                    </View>
                    <View style={styles.action}>
                      <ThemedText type="smallBold" style={{ color: '#111' }}>
                        {x.status === 'done' ? `✓ ${t('m.task.completed')}` : x.status === 'in_progress' ? t('m.task.continue') : t('m.task.start')}
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
          <ThemedText type="smallBold">{t('m.habits.title')}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t('m.habits.todayCount', { done: habits.filter((h) => h.due && h.doneToday).length, total: habits.filter((h) => h.due).length })}
          </ThemedText>
        </View>
        <HabitList
          habits={habits}
          onChanged={(id, v) => setHabits((hs) => withValue(hs, id, v))}
          onError={setError}
        />
        <Pressable onPress={() => router.push('/aliskanliklar')}>
          <ThemedText type="linkPrimary">{t('m.habits.manage')}</ThemedText>
        </Pressable>
      </ThemedView>

      <Pressable onPress={() => router.push('/koc-ekle')}>
        {({ pressed }) => (
          <ThemedView type="backgroundElement" style={[styles.addCoach, pressed && { opacity: 0.7 }]}>
            <ThemedText type="smallBold">{t('m.home.addCoach')}</ThemedText>
          </ThemedView>
        )}
      </Pressable>

      <Pressable onPress={() => unregisterPushToken().finally(() => supabase.auth.signOut())}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.signOut}>
          {t('common.signOut')}
        </ThemedText>
      </Pressable>
      <LanguagePicker align="center" />
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
