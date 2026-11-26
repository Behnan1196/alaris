import { HABIT_FREQUENCY_LABELS, type HabitFrequency } from '@alaris/shared';
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
import { loadHabits, type HabitView } from '@/lib/habits';
import { supabase } from '@/lib/supabase';

const ACCENT = '#18181B';
const SUGGESTIONS = ['Su iç', '10.000 adım', 'Kitap oku', 'Meditasyon', 'Erken yat'];
const REMINDERS = [
  { label: 'Sabah', value: '08:00' },
  { label: 'Öğle', value: '12:00' },
  { label: 'Akşam', value: '20:00' },
  { label: 'Yok', value: '' },
];

export default function AliskanliklarScreen() {
  const { session } = useAuth();
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
    if (uid) loadHabits(uid).then(setHabits).catch((e: Error) => setError(e.message));
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
        <ThemedText themeColor="textSecondary">Henüz alışkanlığın yok.</ThemedText>
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
          <ThemedText type="smallBold">Yeni alışkanlık</ThemedText>
          <View style={styles.wrap}>
            {SUGGESTIONS.map((s) => (
              <Chip key={s} label={s} color={ACCENT} active={form.title === s}
                onPress={() => setForm({ ...form, title: s, ...(s === 'Su iç' ? { target: '8', unit: 'bardak' } : {}) })} />
            ))}
          </View>
          <TextField label="Ad" value={form.title} onChangeText={(t) => setForm({ ...form, title: t })} />
          <ThemedText type="smallBold">Sıklık</ThemedText>
          <View style={styles.wrap}>
            {(Object.keys(HABIT_FREQUENCY_LABELS) as HabitFrequency[]).map((f) => (
              <Chip key={f} label={HABIT_FREQUENCY_LABELS[f]} color={ACCENT} active={form.frequency === f}
                onPress={() => setForm({ ...form, frequency: f })} />
            ))}
          </View>
          <View style={styles.wrap}>
            <View style={{ flex: 1 }}>
              <TextField label="Günlük hedef (isteğe bağlı)" keyboardType="number-pad" value={form.target}
                onChangeText={(t) => setForm({ ...form, target: t })} />
            </View>
            <View style={{ flex: 1 }}>
              <TextField label="Birim" placeholder="bardak" value={form.unit}
                onChangeText={(t) => setForm({ ...form, unit: t })} />
            </View>
          </View>
          <ThemedText type="smallBold">Hatırlatma</ThemedText>
          <View style={styles.wrap}>
            {REMINDERS.map((r) => (
              <Chip key={r.label} label={r.label} color={ACCENT} active={form.reminder === r.value}
                onPress={() => setForm({ ...form, reminder: r.value })} />
            ))}
          </View>
          <SwitchRow value={form.visible} onValueChange={(v) => setForm({ ...form, visible: v })}>
            <ThemedText type="small">Koçlarım bu alışkanlığı görebilsin</ThemedText>
          </SwitchRow>
          <View style={styles.wrap}>
            <View style={{ flex: 1 }}>
              <PrimaryButton title="Vazgeç" color="#71717A" onPress={() => setForm(null)} />
            </View>
            <View style={{ flex: 1 }}>
              <PrimaryButton title="Kaydet" loading={busy} disabled={!form.title.trim()} onPress={save} />
            </View>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            Hatırlatma bildirimleri 6. adımda etkinleşecek.
          </ThemedText>
        </Panel>
      ) : (
        <PrimaryButton
          title="+ Yeni alışkanlık"
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
