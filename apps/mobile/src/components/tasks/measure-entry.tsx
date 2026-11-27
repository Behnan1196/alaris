import { localDate, type MeasureOptions, type MeasurePayload } from '@alaris/shared';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Message, PrimaryButton, TextField } from '@/components/form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { useI18n } from '@/lib/i18n';
import { addPhoto } from '@/lib/media';
import { supabase } from '@/lib/supabase';
import { ensureInstance, saveProgress } from '@/lib/tasks';

import { CoachNote, DoneBanner, Panel, type TaskProps } from './common';

export function MeasureEntry({ task, instance, color, clientId }: TaskProps & { clientId: string }) {
  const { t } = useI18n();
  const payload = task.payload as unknown as MeasurePayload;
  const options = task.options as unknown as MeasureOptions;
  const metrics = payload.metrics ?? [];
  const [values, setValues] = useState<Record<string, string>>({});
  const [last, setLast] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(instance?.status === 'done');
  const [shots, setShots] = useState<Record<string, string | null>>({});

  async function shoot(kind: 'front' | 'side') {
    setError(null);
    try {
      const inst = await ensureInstance(task.id);
      const p = await addPhoto({ clientId, coachingId: task.program?.coaching_id ?? null, kind, taskInstanceId: inst.id });
      if (p) setShots((s) => ({ ...s, [kind]: p.url }));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    supabase
      .from('measurements')
      .select('metric, value, measured_on')
      .in('metric', metrics)
      .order('measured_on', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        const m: Record<string, number> = {};
        for (const r of data ?? []) if (!(r.metric in m)) m[r.metric] = Number(r.value);
        setLast(m);
      });
  }, [metrics.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    const rows = metrics
      .filter((m) => values[m])
      .map((m) => ({ metric: m, value: Number(values[m].replace(',', '.')) }));
    if (rows.some((r) => !(r.value > 0))) return setError(t('m.measure.numbers'));
    if (rows.length === 0) return setError(t('m.measure.atLeastOne'));
    setBusy(true);
    setError(null);
    try {
      const inst = await ensureInstance(task.id);
      const { error } = await supabase.from('measurements').insert(
        rows.map((r) => ({
          client_id: clientId,
          coaching_id: task.program?.coaching_id ?? null,
          task_instance_id: inst.id,
          measured_on: localDate(),
          metric: r.metric,
          value: r.value,
        })),
      );
      if (error) throw error;
      await saveProgress(inst.id, { values: Object.fromEntries(rows.map((r) => [r.metric, r.value])) }, 'done');
      setDone(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Screen>
        <DoneBanner color={color} text={t('m.measure.saved')} />
        <PrimaryButton title={t('m.task.backHome')} color={color} onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      {payload.when ? <ThemedText themeColor="textSecondary">{t('m.measure.when', { when: payload.when })}</ThemedText> : null}
      <CoachNote text={task.client_note} />
      <Panel>
        {metrics.map((m) => (
          <TextField
            key={m}
            label={t(`metric.${m}`) + (last[m] ? `  (${t('m.measure.last', { v: last[m] })})` : '')}
            keyboardType="decimal-pad"
            value={values[m] ?? ''}
            onChangeText={(t) => setValues({ ...values, [m]: t })}
          />
        ))}
      </Panel>
      {options.ask_photos && (
        <Panel>
          <ThemedText type="smallBold">{t('web.photos.title')}</ThemedText>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {(['front', 'side'] as const).map((k) => (
              <Pressable key={k} onPress={() => shoot(k)} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                {shots[k] ? (
                  <Image source={{ uri: shots[k]! }} style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: 12 }} />
                ) : (
                  <View style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
                    <ThemedText style={{ color, fontWeight: '700' }}>+</ThemedText>
                  </View>
                )}
                <ThemedText type="small">{k === 'front' ? t('photo.front') : t('photo.side')}</ThemedText>
              </Pressable>
            ))}
          </View>
          <ThemedText type="small" themeColor="textSecondary">{t('m.measure.photosPrivate')}</ThemedText>
        </Panel>
      )}
      {error && <Message kind="error" text={error} />}
      <PrimaryButton title={t('common.save')} color={color} loading={busy} onPress={save} />
    </Screen>
  );
}
