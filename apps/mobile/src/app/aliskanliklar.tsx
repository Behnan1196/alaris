import { type HabitFrequency, type MessageKey } from '@alaris/shared';
import { Redirect, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Message, PrimaryButton, SwitchRow, TextField } from '@/components/form';
import { HabitList, withValue } from '@/components/habit-list';
import { Screen } from '@/components/screen';
import { Chip, Panel } from '@/components/tasks/common';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { loadHabits, type HabitView } from '@/lib/habits';
import { syncHabitReminders } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

const ACCENT = '#18181B';
const SUGGESTIONS: MessageKey[] = ['m.sugg.water', 'm.sugg.steps', 'm.sugg.read', 'm.sugg.meditate', 'm.sugg.sleep'];
const REMINDERS: { label: MessageKey; value: string }[] = [
  { label: 'm.rem.morning', value: '08:00' },
  { label: 'm.rem.noon', value: '12:00' },
  { label: 'm.rem.evening', value: '20:00' },
  { label: 'm.rem.none', value: '' },
];

export default function AliskanliklarScreen() {
  const { session } = useAuth();
  const { t } = useI18n();
  const uid = session?.user.id;
  const [habits, setHabits] = useState<HabitView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<null | {
    title: string;
    frequency: HabitFrequency;
    target: string;
    unit: string;
    reminder: string;
    visible: boolean;
  }>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (uid) loadHabits(uid).then((hs) => {
      setHabits(hs);
      syncHabitReminders(hs);
    }).catch((e: Error) => setError(e.message));
  }, [uid]);
  useFocusEffect(load);

  if (!session) return <Redirect href="/giris" />;

  async function save() {
    if (!form?.title.trim() || !uid) return;
    setBusy(true);
    setError(null);
    const target = form.target ? Number(form.target) : null;
    const { error } = await supabase.from('habits').insert({
      client_id: uid,
      title: form.title.trim(),
      frequency: form.frequency,
      target: target && target > 0 ? target : null,
      unit: form.unit.trim() || null,
      reminder_time: form.reminder || null,
      visible_to_coaches: form.visible,
    });
    setBusy(false);
    if (error) return setError(error.message);
    setForm(null);
    load();
  }

  async function remove(h: HabitView) {
    const { error } = await supabase.from('habits').update({ active: false }).eq('id', h.id);
    if (error) setError(error.message);
    else load();
  }

  return (
    <Screen>
      {error && <Message kind="error" text={error} />}
      {habits.length === 0 && !form && (
        <ThemedText themeColor="textSecondary">{t('m.habits.none')}</ThemedText>
      )}
      <HabitList
        habits={habits}
        showAll
        onChanged={(id, v) => setHabits((hs) => withValue(hs, id, v))}
        onError={setError}
        onDelete={remove}
      />

      {form ? (
        <Panel>
          <ThemedText type="smallBold">{t('m.habits.new')}</ThemedText>
          <View style={styles.wrap}>
            {SUGGESTIONS.map((k) => (
              <Chip key={k} label={t(k)} color={ACCENT} active={form.title === t(k)}
                onPress={() => setForm({ ...form, title: t(k), ...(k === 'm.sugg.water' ? { target: '8', unit: t('m.habits.glass') } : {}) })} />
            ))}
          </View>
          <TextField label={t('b.habitName')} value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />
          <ThemedText type="smallBold">{t('b.frequency')}</ThemedText>
          <View style={styles.wrap}>
            {(['daily', 'weekdays', 'three_per_week'] as HabitFrequency[]).map((f) => (
              <Chip key={f} label={t(`freq.${f}`)} color={ACCENT} active={form.frequency === f}
                onPress={() => setForm({ ...form, frequency: f })} />
            ))}
          </View>
          <View style={styles.wrap}>
            <View style={{ flex: 1 }}>
              <TextField label={t('m.habits.targetOptional')} keyboardType="number-pad" value={form.target}
                onChangeText={(v) => setForm({ ...form, target: v })} />
            </View>
            <View style={{ flex: 1 }}>
              <TextField label={t('b.unit')} placeholder={t('m.habits.glass')} value={form.unit}
                onChangeText={(v) => setForm({ ...form, unit: v })} />
            </View>
          </View>
          <ThemedText type="smallBold">{t('m.habits.reminder')}</ThemedText>
          <View style={styles.wrap}>
            {REMINDERS.map((r) => (
              <Chip key={r.label} label={t(r.label)} color={ACCENT} active={form.reminder === r.value}
                onPress={() => setForm({ ...form, reminder: r.value })} />
            ))}
          </View>
          <SwitchRow value={form.visible} onValueChange={(v) => setForm({ ...form, visible: v })}>
            <ThemedText type="small">{t('m.habits.visible')}</ThemedText>
          </SwitchRow>
          <View style={styles.wrap}>
            <View style={{ flex: 1 }}>
              <PrimaryButton title={t('common.cancel')} color="#71717A" onPress={() => setForm(null)} />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton title={t('common.save')} loading={busy} disabled={!form.title.trim()} onPress={save} />
            </View>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {t('m.habits.reminderHint')}
          </ThemedText>
        </Panel>
      ) : (
        <PrimaryButton
          title={t('m.habits.add')}
          onPress={() =>
            setForm({ title: '', frequency: 'daily', target: '', unit: '', reminder: '', visible: false })
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
