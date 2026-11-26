import type { MealOptions, MealPayload, MealProgress } from '@alaris/shared';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Message } from '@/components/form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { addLog, ensureInstance, saveProgress, type Instance } from '@/lib/tasks';

import { CoachNote, DoneBanner, Panel, type TaskProps } from './common';

function Bar({ label, value, target, color }: { label: string; value: number; target: number | null; color: string }) {
  const pct = target ? Math.min(1, value / target) : 0;
  return (
    <View style={{ gap: 4, flex: 1 }}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <ThemedText type="small">
        {Math.round(value)}
        {target ? ` / ${target} g` : ' g'}
      </ThemedText>
    </View>
  );
}

export function MealDay({ task, instance: initial, color }: TaskProps) {
  const payload = task.payload as unknown as MealPayload;
  const options = task.options as unknown as MealOptions;
  const meals = payload.meals ?? [];

  const [instance, setInstance] = useState<Instance | null>(initial);
  const [progress, setProgress] = useState<MealProgress>(
    (initial?.progress as unknown as MealProgress)?.eaten ? (initial!.progress as unknown as MealProgress) : { eaten: [] },
  );
  const [error, setError] = useState<string | null>(null);

  const eatenKcal = progress.eaten.reduce((s, i) => s + (meals[i]?.kcal ?? 0), 0);
  const plannedKcal = meals.reduce((s, m) => s + (m.kcal ?? 0), 0);
  const kcalTarget = payload.kcal_target ?? (plannedKcal || null);
  // Makrolar öğün bazında girilmediği için, yenen kalori oranıyla yaklaşık gösterilir.
  const ratio = plannedKcal ? eatenKcal / plannedKcal : progress.eaten.length / Math.max(1, meals.length);
  const allDone = meals.length > 0 && progress.eaten.length === meals.length;

  async function toggle(i: number) {
    setError(null);
    try {
      const inst = instance ?? (await ensureInstance(task.id));
      setInstance(inst);
      const eaten = progress.eaten.includes(i) ? progress.eaten.filter((x) => x !== i) : [...progress.eaten, i].sort();
      const next = { ...progress, eaten };
      setProgress(next);
      const complete = meals.length > 0 && eaten.length === meals.length;
      await saveProgress(inst.id, next, complete ? 'done' : 'in_progress');
      if (!progress.eaten.includes(i)) await addLog(inst.id, 'meal_eaten', { meal_index: i, name: meals[i]?.name });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function water(delta: number) {
    const inst = instance ?? (await ensureInstance(task.id));
    setInstance(inst);
    const next = { ...progress, water: Math.max(0, (progress.water ?? 0) + delta) };
    setProgress(next);
    await saveProgress(inst.id, next).catch((e: Error) => setError(e.message));
  }

  return (
    <Screen>
      {allDone && <DoneBanner color={color} text="Bugünün öğünleri tamam" />}
      <Panel>
        <View style={styles.kcalRow}>
          <ThemedText style={styles.kcal}>{eatenKcal}</ThemedText>
          <ThemedText themeColor="textSecondary">{kcalTarget ? `/ ${kcalTarget} kcal` : 'kcal'}</ThemedText>
        </View>
        <View style={styles.bars}>
          <Bar label="Protein" value={(payload.protein_g ?? 0) * ratio} target={payload.protein_g} color={color} />
          <Bar label="Karb." value={(payload.carb_g ?? 0) * ratio} target={payload.carb_g} color={color} />
          <Bar label="Yağ" value={(payload.fat_g ?? 0) * ratio} target={payload.fat_g} color={color} />
        </View>
      </Panel>

      <CoachNote text={task.client_note} />
      {error && <Message kind="error" text={error} />}

      {meals.map((m, i) => {
        const eaten = progress.eaten.includes(i);
        return (
          <Panel key={i}>
            <View style={styles.mealHead}>
              <View style={{ flex: 1 }}>
                <ThemedText type="small" themeColor="textSecondary">
                  {m.time}
                  {m.kcal ? ` · ${m.kcal} kcal` : ''}
                </ThemedText>
                <ThemedText type="smallBold">{m.name}</ThemedText>
              </View>
              <Pressable
                onPress={() => toggle(i)}
                style={[styles.eatBtn, { borderColor: color, backgroundColor: eaten ? color : 'transparent' }]}>
                <ThemedText type="smallBold" style={{ color: eaten ? '#fff' : color }}>
                  {eaten ? '✓ Yedim' : 'Yedim'}
                </ThemedText>
              </Pressable>
            </View>
            {m.items ? <ThemedText type="small">{m.items}</ThemedText> : null}
          </Panel>
        );
      })}

      {options.track_water && (
        <Panel>
          <View style={styles.mealHead}>
            <ThemedText type="smallBold" style={{ flex: 1 }}>
              Su: {progress.water ?? 0} bardak
            </ThemedText>
            <Pressable onPress={() => water(-1)} style={[styles.eatBtn, { borderColor: color }]}>
              <ThemedText type="smallBold" style={{ color }}>−</ThemedText>
            </Pressable>
            <Pressable onPress={() => water(1)} style={[styles.eatBtn, { borderColor: color, backgroundColor: color }]}>
              <ThemedText type="smallBold" style={{ color: '#fff' }}>+</ThemedText>
            </Pressable>
          </View>
        </Panel>
      )}

      {(options.ask_photo || options.allow_alternative) && (
        <ThemedText type="small" themeColor="textSecondary">
          Öğün fotoğrafı ve alternatif öğün yakında eklenecek.
        </ThemedText>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  kcalRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.two },
  kcal: { fontSize: 36, lineHeight: 42, fontWeight: '700' },
  bars: { flexDirection: 'row', gap: Spacing.three },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(127,127,127,0.25)', overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  mealHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  eatBtn: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
});
