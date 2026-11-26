import { DOMAINS, type DomainKey } from '@alaris/shared';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Message } from '@/components/form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

type Widget = {
  key: string;
  domainKey: string;
  coachName: string;
  programName: string | null;
  week: number | null;
  weeks: number | null;
};

const dateFmt = new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

function currentWeek(startDate: string | null, weeks: number) {
  if (!startDate) return null;
  const days = Math.floor((Date.now() - new Date(startDate).getTime()) / 86_400_000);
  if (days < 0) return null;
  return Math.min(weeks, Math.floor(days / 7) + 1);
}

export default function KocluklarimScreen() {
  const { session } = useAuth();
  const [name, setName] = useState('');
  const [widgets, setWidgets] = useState<Widget[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const uid = session?.user.id;
    if (!uid) return;
    const [profile, coachings] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', uid).single(),
      supabase
        .from('coachings')
        .select(
          `id,
           coach:coach_profiles!coachings_coach_id_fkey(title, profile:profiles!coach_profiles_user_id_fkey(full_name)),
           coaching_domains(domain_key),
           programs(name, weeks, start_date, status, domain_key)`,
        )
        .eq('client_id', uid)
        .neq('status', 'ended'),
    ]);
    if (coachings.error) return setError(coachings.error.message);
    setName(profile.data?.full_name?.split(' ')[0] ?? '');

    const list: Widget[] = [];
    for (const c of coachings.data) {
      const coachName = [c.coach?.title, c.coach?.profile?.full_name].filter(Boolean).join(' ');
      for (const { domain_key } of c.coaching_domains) {
        const program = c.programs.find((p) => p.domain_key === domain_key && p.status === 'active');
        list.push({
          key: `${c.id}:${domain_key}`,
          domainKey: domain_key,
          coachName,
          programName: program?.name ?? null,
          week: program ? currentWeek(program.start_date, program.weeks) : null,
          weeks: program?.weeks ?? null,
        });
      }
    }
    const order = Object.keys(DOMAINS);
    list.sort((a, b) => order.indexOf(a.domainKey) - order.indexOf(b.domainKey));
    setWidgets(list);
  }, [session?.user.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <Screen tabs>
      <View style={styles.header}>
        <ThemedText type="small" themeColor="textSecondary">
          {dateFmt.format(new Date())}
        </ThemedText>
        <ThemedText style={styles.hello}>
          {greeting()}
          {name ? `, ${name}` : ''}
        </ThemedText>
        {widgets && (
          <ThemedText type="small" themeColor="textSecondary">
            {widgets.length ? `${widgets.length} aktif koçluk alanı` : 'Henüz bir koçun yok'}
          </ThemedText>
        )}
      </View>

      {error && <Message kind="error" text={error} />}
      {!widgets && !error && <ActivityIndicator />}

      {widgets?.map((w) => {
        const d = DOMAINS[w.domainKey as DomainKey];
        return (
          <View key={w.key} style={[styles.widget, { backgroundColor: d?.color ?? '#333' }]}>
            <ThemedText type="smallBold" style={styles.widgetMuted}>
              {d?.name ?? w.domainKey}
            </ThemedText>
            <ThemedText style={styles.widgetTitle}>
              {w.programName ?? 'Program bekleniyor'}
            </ThemedText>
            <ThemedText type="small" style={styles.widgetMuted}>
              {w.coachName}
              {w.week && w.weeks ? ` · Hafta ${w.week} / ${w.weeks}` : ''}
            </ThemedText>
            {!w.programName && (
              <ThemedText type="small" style={styles.widgetMuted}>
                Koçun programı gönderince bugünün işi burada görünecek.
              </ThemedText>
            )}
          </View>
        );
      })}

      <Pressable onPress={() => router.push('/koc-ekle')}>
        {({ pressed }) => (
          <ThemedView type="backgroundElement" style={[styles.addCoach, pressed && { opacity: 0.7 }]}>
            <ThemedText type="smallBold">+ Davet koduyla koç ekle</ThemedText>
          </ThemedView>
        )}
      </Pressable>

      <Pressable onPress={() => supabase.auth.signOut()}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.signOut}>
          Çıkış yap
        </ThemedText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.one, marginBottom: Spacing.two },
  hello: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  widget: { borderRadius: Spacing.four, padding: Spacing.four, gap: Spacing.one, minHeight: 140 },
  widgetTitle: { color: '#fff', fontSize: 22, lineHeight: 28, fontWeight: '700' },
  widgetMuted: { color: 'rgba(255,255,255,0.85)' },
  addCoach: { borderRadius: Spacing.three, padding: Spacing.three, alignItems: 'center' },
  signOut: { textAlign: 'center', marginTop: Spacing.three },
});
