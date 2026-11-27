import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useI18n } from '@/lib/i18n';
import type { Instance, ProgramTask } from '@/lib/tasks';

export type TaskProps = { task: ProgramTask; instance: Instance | null; color: string };

export function Panel({ children, style }: { children: ReactNode; style?: object }) {
  return (
    <ThemedView type="backgroundElement" style={[styles.panel, style]}>
      {children}
    </ThemedView>
  );
}

export function CoachNote({ text }: { text: string | null | undefined }) {
  const { t } = useI18n();
  if (!text) return null;
  return (
    <Panel>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {t('m.task.coachNote')}
      </ThemedText>
      <ThemedText>{text}</ThemedText>
    </Panel>
  );
}

export function DoneBanner({ color, text }: { color: string; text?: string }) {
  const { t } = useI18n();
  return (
    <View style={[styles.done, { backgroundColor: color }]}>
      <ThemedText style={styles.doneText}>✓ {text ?? t('m.task.completed')}</ThemedText>
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
  color,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  color: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, { borderColor: color, backgroundColor: active ? color : 'transparent' }]}>
      <ThemedText type="smallBold" style={{ color: active ? '#fff' : color }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  done: { borderRadius: Spacing.three, padding: Spacing.three, alignItems: 'center' },
  doneText: { color: '#fff', fontWeight: '700' },
  chip: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minWidth: 44,
    alignItems: 'center',
  },
});
