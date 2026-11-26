import { DOMAINS, HABIT_FREQUENCY_LABELS, type DomainKey } from '@alaris/shared';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { setHabitValue, type HabitView } from '@/lib/habits';

const ACCENT = '#18181B';

/** Bugünün alışkanlıkları: sayaçlı olanlarda "+", tek dokunuşlularda onay. */
export function HabitList({
  habits,
  onChanged,
  onError,
  showAll = false,
  onDelete,
}: {
  habits: HabitView[];
  onChanged: (id: string, value: number) => void;
  onError: (msg: string) => void;
  showAll?: boolean;
  onDelete?: (h: HabitView) => void;
}) {
  const list = showAll ? habits : habits.filter((h) => h.due);

  async function change(h: HabitView, value: number) {
    onChanged(h.id, value); // iyimser güncelleme
    try {
      await setHabitValue(h.id, value);
    } catch (e) {
      onChanged(h.id, h.today);
      onError((e as Error).message);
    }
  }

  return (
    <View style={{ gap: Spacing.two }}>
      {list.map((h) => {
        const color = h.domain_key ? (DOMAINS[h.domain_key as DomainKey]?.color ?? ACCENT) : ACCENT;
        const sub = [
          h.coaching_id ? 'Koçundan' : 'Kendi alışkanlığın',
          HABIT_FREQUENCY_LABELS[h.frequency],
          h.frequency === 'three_per_week'
            ? `bu hafta ${h.weekCount}/3`
            : h.show_streak && h.streak > 0
              ? `${h.streak} gün seri`
              : null,
        ]
          .filter(Boolean)
          .join(' · ');
        return (
          <View key={h.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <ThemedText type="smallBold">{h.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {sub}
              </ThemedText>
              {onDelete && !h.coaching_id && (
                <Pressable onPress={() => onDelete(h)}>
                  <ThemedText type="small" style={{ color: '#B91C1C' }}>
                    Kaldır
                  </ThemedText>
                </Pressable>
              )}
            </View>
            {h.target ? (
              <View style={styles.counter}>
                <Pressable
                  onPress={() => change(h, Math.max(0, h.today - 1))}
                  style={[styles.round, { borderColor: color }]}>
                  <ThemedText style={{ color, fontWeight: '700' }}>−</ThemedText>
                </Pressable>
                <ThemedText type="smallBold" style={{ minWidth: 56, textAlign: 'center' }}>
                  {h.today} / {h.target}
                  {h.unit ? `\n${h.unit}` : ''}
                </ThemedText>
                <Pressable
                  onPress={() => change(h, h.today + 1)}
                  style={[styles.round, { borderColor: color, backgroundColor: color }]}>
                  <ThemedText style={{ color: '#fff', fontWeight: '700' }}>+</ThemedText>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => change(h, h.doneToday ? 0 : 1)}
                style={[styles.round, { borderColor: color, backgroundColor: h.doneToday ? color : 'transparent' }]}>
                <ThemedText style={{ color: h.doneToday ? '#fff' : color, fontWeight: '700' }}>✓</ThemedText>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}

/** Değeri değişen alışkanlığın görünümünü yeniden hesaplar. */
export function withValue(habits: HabitView[], id: string, value: number): HabitView[] {
  return habits.map((h) => {
    if (h.id !== id) return h;
    const doneToday = value >= (h.target ?? 1);
    const streakDelta = doneToday === h.doneToday ? 0 : doneToday ? 1 : -1;
    return {
      ...h,
      today: value,
      doneToday,
      streak: Math.max(0, h.streak + streakDelta),
      weekCount: Math.max(0, h.weekCount + streakDelta),
    };
  });
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 48 },
  counter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  round: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
