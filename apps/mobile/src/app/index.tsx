import { DOMAINS } from '@alaris/shared';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

export default function KocluklarimScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">Koçluklarım</ThemedText>
        <ThemedText>Geliştirme iskeleti. Widget&apos;lar sırayla eklenecek.</ThemedText>
        {Object.values(DOMAINS).map((d) => (
          <View key={d.key} style={[styles.card, { backgroundColor: d.color, opacity: d.enabled ? 1 : 0.5 }]}>
            <ThemedText style={styles.cardText}>
              {d.name}
              {d.enabled ? '' : ' · Yakında'}
            </ThemedText>
          </View>
        ))}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: {
    flex: 1,
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  card: { borderRadius: Spacing.three, padding: Spacing.four },
  cardText: { color: '#fff', fontWeight: '600' },
});
