import { type DomainKey } from '@alaris/shared';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Message } from '@/components/form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

type Row = {
  id: string;
  coachName: string;
  initials: string;
  domains: string[];
  last: { body: string; created_at: string } | null;
  unread: number;
};

function when(iso: string, intl: string) {
  const timeFmt = new Intl.DateTimeFormat(intl, { hour: '2-digit', minute: '2-digit' });
  const dayFmt = new Intl.DateTimeFormat(intl, { day: 'numeric', month: 'short' });
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString() ? timeFmt.format(d) : dayFmt.format(d);
}

export default function MesajlarScreen() {
  const { session } = useAuth();
  const { t, intl } = useI18n();
  const uid = session?.user.id;
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!uid) return;
    const [threads, coachings] = await Promise.all([
      supabase
        .from('threads')
        .select('id, coach_id, coach:coach_profiles!threads_coach_id_fkey(title, profile:profiles!coach_profiles_user_id_fkey(full_name))')
        .eq('client_id', uid),
      supabase.from('coachings').select('coach_id, coaching_domains(domain_key)').eq('client_id', uid).neq('status', 'ended'),
    ]);
    if (threads.error) return setError(threads.error.message);
    const ids = threads.data.map((x) => x.id);
    const [recent, unread] = ids.length
      ? await Promise.all([
          supabase.from('messages').select('thread_id, body, created_at').in('thread_id', ids).order('created_at', { ascending: false }).limit(200),
          supabase.from('messages').select('thread_id').in('thread_id', ids).is('read_at', null).neq('sender_id', uid),
        ])
      : [{ data: [] }, { data: [] }];

    const lastOf = new Map<string, Row['last']>();
    for (const m of recent.data ?? []) if (!lastOf.has(m.thread_id)) lastOf.set(m.thread_id, m);
    const unreadOf = new Map<string, number>();
    for (const m of unread.data ?? []) unreadOf.set(m.thread_id, (unreadOf.get(m.thread_id) ?? 0) + 1);

    setRows(
      threads.data
        .map((th) => {
          const name = th.coach?.profile?.full_name ?? '';
          const domains = (coachings.data ?? [])
            .filter((c) => c.coach_id === th.coach_id)
            .map((c) => c.coaching_domains.map((d) => d.domain_key));
          return {
            id: th.id,
            coachName: [th.coach?.title, name].filter(Boolean).join(' '),
            initials: name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase(),
            domains: domains.flat(),
            last: lastOf.get(th.id) ?? null,
            unread: unreadOf.get(th.id) ?? 0,
          };
        })
        .sort((a, b) => (b.last?.created_at ?? '').localeCompare(a.last?.created_at ?? '')),
    );
  }, [uid]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <Screen tabs>
      <ThemedText style={styles.title}>{t('nav.messages')}</ThemedText>
      {error && <Message kind="error" text={error} />}
      {!rows && !error && <ActivityIndicator />}
      {rows?.length === 0 && (
        <ThemedText themeColor="textSecondary">{t('m.msg.empty')}</ThemedText>
      )}
      {rows?.map((r) => (
        <Pressable key={r.id} onPress={() => router.push({ pathname: '/sohbet/[id]', params: { id: r.id, name: r.coachName || t('common.coach') } })}>
          {({ pressed }) => (
            <ThemedView type="backgroundElement" style={[styles.row, pressed && { opacity: 0.7 }]}>
              <View style={styles.avatar}>
                <ThemedText style={styles.avatarText}>{r.initials}</ThemedText>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.rowHead}>
                  <ThemedText type="smallBold">{r.coachName || t('common.coach')}</ThemedText>
                  {r.last && (
                    <ThemedText type="small" themeColor="textSecondary">
                      {when(r.last.created_at, intl)}
                    </ThemedText>
                  )}
                </View>
                {r.domains.length ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {r.domains.map((d) => t(`domain.${d as DomainKey}`)).join(' · ')}
                  </ThemedText>
                ) : null}
                <View style={styles.rowHead}>
                  <ThemedText type="small" numberOfLines={1} style={{ flex: 1 }}>
                    {r.last?.body ?? t('msg.noMessages')}
                  </ThemedText>
                  {r.unread > 0 && (
                    <View style={styles.badge}>
                      <ThemedText style={styles.badgeText}>{r.unread}</ThemedText>
                    </View>
                  )}
                </View>
              </View>
            </ThemedView>
          )}
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  row: { flexDirection: 'row', gap: Spacing.three, borderRadius: Spacing.three, padding: Spacing.three, alignItems: 'center' },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#18181B', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700' },
  badge: { backgroundColor: '#DC2626', borderRadius: 999, minWidth: 20, paddingHorizontal: 6, alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700', lineHeight: 18 },
});
