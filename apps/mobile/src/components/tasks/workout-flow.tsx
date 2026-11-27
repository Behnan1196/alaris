import {
  type WorkoutExercise,
  type WorkoutOptions,
  type WorkoutPayload,
  type WorkoutProgress,
  type TFunction,
} from '@alaris/shared';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Message, PrimaryButton } from '@/components/form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/lib/i18n';
import { addLog, ensureInstance, previousSets, saveProgress, type Instance } from '@/lib/tasks';

import { Chip, CoachNote, DoneBanner, Panel, type TaskProps } from './common';
import { ExerciseMedia } from './exercise-media';

type Phase = 'summary' | 'exercise' | 'rpe' | 'done';

function target(e: WorkoutExercise, t: TFunction) {
  const amount = e.duration_sec ? t('m.wo.sec', { n: e.duration_sec }) : e.reps ? t('m.wo.reps', { n: e.reps }) : '';
  return [amount, e.weight_kg ? `${e.weight_kg} kg` : null].filter(Boolean).join(' · ');
}

const emptyProgress = (): WorkoutProgress => ({ exercise_index: 0, done: {} });

export function WorkoutFlow({ task, instance: initial, color }: TaskProps) {
  const { t } = useI18n();
  const payload = task.payload as unknown as WorkoutPayload;
  const options = task.options as unknown as WorkoutOptions;
  const exercises = payload.exercises ?? [];

  const [instance, setInstance] = useState<Instance | null>(initial);
  const [progress, setProgress] = useState<WorkoutProgress>(
    (initial?.progress as unknown as WorkoutProgress)?.done ? (initial!.progress as unknown as WorkoutProgress) : emptyProgress(),
  );
  const [phase, setPhase] = useState<Phase>(initial?.status === 'done' ? 'done' : 'summary');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function begin() {
    setBusy(true);
    setError(null);
    try {
      const inst = instance ?? (await ensureInstance(task.id));
      setInstance(inst);
      setPhase('exercise');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function persist(next: WorkoutProgress, status?: Instance['status']) {
    setProgress(next);
    if (instance) await saveProgress(instance.id, next, status).catch((e: Error) => setError(e.message));
  }

  async function finish(rpe?: number) {
    if (!instance) return;
    setBusy(true);
    try {
      if (rpe) await addLog(instance.id, 'rpe', { value: rpe });
      await persist({ ...progress, rpe }, 'done');
      setPhase('done');
    } finally {
      setBusy(false);
    }
  }

  if (phase === 'exercise' && instance) {
    return (
      <ExerciseStep
        key={progress.exercise_index}
        index={progress.exercise_index}
        exercises={exercises}
        options={options}
        progress={progress}
        color={color}
        instanceId={instance.id}
        onProgress={persist}
        onFinish={() => (options.ask_rpe ? setPhase('rpe') : finish())}
      />
    );
  }

  if (phase === 'rpe') {
    return (
      <Screen>
        <ThemedText type="subtitle">{t('m.wo.rpeTitle')}</ThemedText>
        <ThemedText themeColor="textSecondary">{t('m.wo.rpeHint')}</ThemedText>
        <View style={styles.rpe}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <Chip key={n} label={String(n)} color={color} onPress={() => finish(n)} />
          ))}
        </View>
        {busy && <ThemedText themeColor="textSecondary">{t('common.saving')}</ThemedText>}
      </Screen>
    );
  }

  const doneSets = Object.values(progress.done).reduce((s, x) => s + Object.keys(x).length, 0);
  const totalSets = exercises.reduce((s, e) => s + e.sets, 0);

  return (
    <Screen>
      {phase === 'done' && <DoneBanner color={color} text={t('m.wo.done')} />}
      <Panel>
        <ThemedText type="smallBold" themeColor="textSecondary">
          {[t('b.meta.exercises', { n: exercises.length }), t('m.wo.setsN', { n: totalSets }), payload.duration_min ? `~${t('b.meta.minutes', { n: payload.duration_min })}` : null, t(`intensity.${payload.intensity}`)]
            .filter(Boolean)
            .join(' · ')}
        </ThemedText>
        {exercises.map((e, i) => (
          <View key={i} style={styles.summaryRow}>
            <ThemedText style={{ flex: 1 }}>
              {e.superset ? "↳ " : ""}
              {e.name || t('m.wo.exerciseN', { n: i + 1 })}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {e.sets} × {target(e, t)}
            </ThemedText>
          </View>
        ))}
      </Panel>
      <CoachNote text={task.client_note} />
      {error && <Message kind="error" text={error} />}
      {phase === 'done' ? (
        <PrimaryButton title={t('m.task.backHome')} color={color} onPress={() => router.back()} />
      ) : exercises.length === 0 ? (
        <Message kind="info" text={t('m.wo.empty')} />
      ) : (
        <PrimaryButton
          title={doneSets > 0 ? `${t('m.task.continue')} (${doneSets}/${totalSets})` : t('m.task.start')}
          color={color}
          loading={busy}
          onPress={begin}
        />
      )}
    </Screen>
  );
}

function ExerciseStep({
  index,
  exercises,
  options,
  progress,
  color,
  instanceId,
  onProgress,
  onFinish,
}: {
  index: number;
  exercises: WorkoutExercise[];
  options: WorkoutOptions;
  progress: WorkoutProgress;
  color: string;
  instanceId: string;
  onProgress: (p: WorkoutProgress) => Promise<void>;
  onFinish: () => void;
}) {
  const { t } = useI18n();
  const theme = useTheme();
  const e = exercises[index];
  const done = progress.done[index] ?? {};
  const [prev, setPrev] = useState<{ set_index: number; kg: number | null; reps: number | null }[]>([]);
  const [inputs, setInputs] = useState<Record<number, { kg: string; reps: string }>>({});
  const [rest, setRest] = useState<number | null>(null);

  useEffect(() => {
    if (e?.name) previousSets(e.name).then(setPrev).catch(() => setPrev([]));
  }, [e?.name]);

  useEffect(() => {
    if (rest === null) return;
    const timer = setTimeout(() => setRest((r) => (r === null || r <= 1 ? null : r - 1)), 1000);
    return () => clearTimeout(timer);
  }, [rest]);

  async function completeSet(s: number) {
    const val = inputs[s] ?? { kg: '', reps: '' };
    const kg = val.kg !== '' ? Number(val.kg.replace(',', '.')) : (e.weight_kg ?? null);
    const reps = val.reps !== '' ? Number(val.reps) : (e.reps ?? null);
    const next: WorkoutProgress = {
      ...progress,
      done: { ...progress.done, [index]: { ...done, [s]: { kg, reps } } },
    };
    await onProgress(next);
    addLog(instanceId, 'set', { exercise_index: index, exercise_name: e.name, set_index: s, kg, reps }).catch(
      () => {},
    );
    if (options.auto_rest && e.rest_sec > 0 && s < e.sets - 1) setRest(e.rest_sec);
  }

  function go(to: number) {
    setRest(null);
    if (to >= exercises.length) return onFinish();
    onProgress({ ...progress, exercise_index: Math.max(0, to) });
  }

  const allDone = Object.keys(done).length >= e.sets;

  return (
    <Screen>
      <ThemedText type="small" themeColor="textSecondary">
        {t('m.wo.progress', { n: index + 1, total: exercises.length })}
        {e.superset ? ` · ${t('m.wo.supersetPrev')}` : exercises[index + 1]?.superset ? ` · ${t('m.wo.supersetNext')}` : ''}
      </ThemedText>
      <ThemedText type="subtitle">{e.name || t('m.wo.exerciseN', { n: index + 1 })}</ThemedText>
      <ExerciseMedia exerciseId={e.exercise_id} />
      {e.note ? <CoachNote text={e.note} /> : null}

      {rest !== null && (
        <View style={[styles.rest, { backgroundColor: color }]}>
          <ThemedText style={styles.restLabel}>{t('m.wo.rest')}</ThemedText>
          <ThemedText style={styles.restTime}>
            {Math.floor(rest / 60)}:{String(rest % 60).padStart(2, '0')}
          </ThemedText>
          <View style={styles.restButtons}>
            <Pressable onPress={() => setRest((r) => (r ?? 0) + 15)} style={styles.restBtn}>
              <ThemedText style={styles.restBtnText}>{`+${t('m.wo.sec', { n: 15 })}`}</ThemedText>
            </Pressable>
            <Pressable onPress={() => setRest(null)} style={styles.restBtn}>
              <ThemedText style={styles.restBtnText}>{t('m.wo.skip')}</ThemedText>
            </Pressable>
          </View>
        </View>
      )}

      <Panel>
        <View style={styles.tableRow}>
          <ThemedText type="smallBold" style={styles.colSet}>{t('m.wo.colSet')}</ThemedText>
          <ThemedText type="smallBold" style={styles.colTarget}>{t('m.wo.colTarget')}</ThemedText>
          <ThemedText type="smallBold" style={styles.colPrev}>{t('m.wo.colPrev')}</ThemedText>
          <ThemedText type="smallBold" style={styles.colDo}>{t('m.wo.colDo')}</ThemedText>
        </View>
        {Array.from({ length: e.sets }, (_, s) => {
          const d = done[s];
          const p = prev.find((x) => x.set_index === s);
          return (
            <View key={s} style={styles.tableRow}>
              <ThemedText style={styles.colSet}>{s + 1}</ThemedText>
              <ThemedText type="small" style={styles.colTarget}>{target(e, t)}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.colPrev}>
                {p ? `${p.kg ?? '-'} kg × ${p.reps ?? '-'}` : '–'}
              </ThemedText>
              <View style={[styles.colDo, styles.doCell]}>
                {options.log_sets && !d && (
                  <>
                    <TextInput
                      style={[styles.smallInput, { color: theme.text, backgroundColor: theme.background }]}
                      placeholder={e.weight_kg ? String(e.weight_kg) : 'kg'}
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="decimal-pad"
                      value={inputs[s]?.kg ?? ''}
                      onChangeText={(v) => setInputs({ ...inputs, [s]: { kg: v, reps: inputs[s]?.reps ?? '' } })}
                    />
                    <TextInput
                      style={[styles.smallInput, { color: theme.text, backgroundColor: theme.background }]}
                      placeholder={e.reps ? String(e.reps) : t('m.wo.repsShort')}
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="number-pad"
                      value={inputs[s]?.reps ?? ''}
                      onChangeText={(v) => setInputs({ ...inputs, [s]: { kg: inputs[s]?.kg ?? '', reps: v } })}
                    />
                  </>
                )}
                {d && options.log_sets && (
                  <ThemedText type="small">
                    {d.kg ?? '-'} × {d.reps ?? '-'}
                  </ThemedText>
                )}
                <Pressable
                  onPress={() => !d && completeSet(s)}
                  style={[styles.check, { borderColor: color, backgroundColor: d ? color : 'transparent' }]}>
                  <ThemedText style={{ color: d ? '#fff' : color, fontWeight: '700' }}>✓</ThemedText>
                </Pressable>
              </View>
            </View>
          );
        })}
        <ThemedText type="small" themeColor="textSecondary">
          {t('m.wo.restInfo', { n: e.rest_sec })}
        </ThemedText>
      </Panel>

      <View style={styles.nav}>
        {index > 0 && (
          <View style={{ flex: 1 }}>
            <PrimaryButton title={t('m.wo.prev')} color="#71717A" onPress={() => go(index - 1)} />
          </View>
        )}
        <View style={{ flex: 2 }}>
          <PrimaryButton
            title={index === exercises.length - 1 ? t('m.wo.finish') : allDone ? t('m.wo.next') : t('m.wo.skipExercise')}
            color={allDone ? color : '#71717A'}
            onPress={() => go(index + 1)}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  rpe: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  tableRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, minHeight: 40 },
  colSet: { width: 32 },
  colTarget: { flex: 2 },
  colPrev: { flex: 2 },
  colDo: { flex: 3 },
  doCell: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'flex-end' },
  smallInput: { width: 44, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 4, textAlign: 'center' },
  check: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  rest: { borderRadius: Spacing.three, padding: Spacing.three, alignItems: 'center', gap: Spacing.one },
  restLabel: { color: '#fff', opacity: 0.85 },
  restTime: { color: '#fff', fontSize: 44, lineHeight: 52, fontWeight: '700' },
  restButtons: { flexDirection: 'row', gap: Spacing.two },
  restBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 6 },
  restBtnText: { color: '#fff', fontWeight: '600' },
  nav: { flexDirection: 'row', gap: Spacing.two },
});
