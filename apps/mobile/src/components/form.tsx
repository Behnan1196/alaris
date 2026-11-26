import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function TextField({ label, ...props }: TextInputProps & { label: string }) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        {...props}
        style={[
          styles.input,
          { color: theme.text, backgroundColor: theme.backgroundElement },
          props.style,
        ]}
      />
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  color = '#18181B',
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  color?: string;
}) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: color, opacity: inactive ? 0.5 : pressed ? 0.8 : 1 },
      ]}>
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <ThemedText style={styles.buttonText}>{title}</ThemedText>
      )}
    </Pressable>
  );
}

export function SwitchRow({
  value,
  onValueChange,
  children,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <View style={styles.switchRow}>
      <Switch value={value} onValueChange={onValueChange} />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

export function Message({ kind, text }: { kind: 'error' | 'info'; text: string }) {
  return (
    <View
      style={[styles.message, { backgroundColor: kind === 'error' ? '#FEF2F2' : '#ECFDF5' }]}>
      <ThemedText type="small" style={{ color: kind === 'error' ? '#991B1B' : '#065F46' }}>
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.one },
  input: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    borderRadius: Spacing.two,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  switchRow: { flexDirection: 'row', gap: Spacing.three, alignItems: 'center' },
  message: { borderRadius: Spacing.two, padding: Spacing.three },
});
