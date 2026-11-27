import { LOCALES, LOCALE_NAMES } from '@alaris/shared';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useI18n } from '@/lib/i18n';

/** Küçük dil seçici: Türkçe / English. */
export function LanguagePicker({ align = 'flex-end' }: { align?: 'flex-start' | 'flex-end' | 'center' }) {
  const { locale, setLocale, t } = useI18n();
  return (
    <View style={[styles.row, { alignSelf: align }]} accessibilityLabel={t('common.language')}>
      {LOCALES.map((l) => {
        const on = l === locale;
        return (
          <Pressable key={l} onPress={() => setLocale(l)} style={[styles.chip, on && styles.on]} accessibilityState={{ selected: on }}>
            <ThemedText type="small" style={on ? styles.onText : undefined} themeColor={on ? undefined : 'textSecondary'}>
              {LOCALE_NAMES[l]}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4 },
  chip: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  on: { backgroundColor: '#18181B' },
  onText: { color: '#fff' },
});
