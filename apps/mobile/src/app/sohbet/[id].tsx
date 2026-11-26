import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Message } from '@/components/form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

type ChatMessage = { id: string; sender_id: string; body: string; created_at: string; read_at: string | null };

const timeFmt = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function SohbetScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const { session } = useAuth();
  const me = session?.user.id;
  const theme = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const list = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    if (!id || !me) return;
    supabase
      .from('messages')
      .select('id, sender_id, body, created_at, read_at')
      .eq('thread_id', id)
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setMessages((data ?? []).reverse());
      });
    supabase.rpc('mark_thread_read', { p_thread_id: id });

    const channel = supabase
      .channel(`thread:${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `thread_id=eq.${id}` }, (payload) => {
        const m = payload.new as ChatMessage;
        if (!m?.id) return;
        setMessages((prev) =>
          prev.some((x) => x.id === m.id) ? prev.map((x) => (x.id === m.id ? { ...x, ...m } : x)) : [...prev, m],
        );
        if (payload.eventType === 'INSERT' && m.sender_id !== me) supabase.rpc('mark_thread_read', { p_thread_id: id });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, me]);

  if (!session) return <Redirect href="/giris" />;

  async function send() {
    const body = text.trim();
    if (!body || !id || !me) return;
    setSending(true);
    setError(null);
    const { data, error } = await supabase
      .from('messages')
      .insert({ thread_id: id, sender_id: me, body })
      .select('id, sender_id, body, created_at, read_at')
      .single();
    setSending(false);
    if (error) return setError(error.message);
    setText('');
    setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data]));
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen options={{ title: name ?? 'Sohbet', headerShown: true, headerBackTitle: 'Geri' }} />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
          <FlatList
            ref={list}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <ThemedText themeColor="textSecondary" style={{ textAlign: 'center' }}>
                Koçuna ilk mesajını yaz.
              </ThemedText>
            }
            renderItem={({ item }) => {
              const mine = item.sender_id === me;
              return (
                <View style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
                  <View style={[styles.bubble, mine ? styles.mine : { backgroundColor: theme.backgroundElement }]}>
                    <ThemedText style={mine ? { color: '#fff' } : undefined}>{item.body}</ThemedText>
                  </View>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.meta}>
                    {timeFmt.format(new Date(item.created_at))}
                    {mine ? (item.read_at ? ' · Okundu' : ' · Gönderildi') : ''}
                  </ThemedText>
                </View>
              );
            }}
          />
          {error && <Message kind="error" text={error} />}
          <View style={styles.composer}>
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
              placeholder="Mesaj yaz"
              placeholderTextColor={theme.textSecondary}
              value={text}
              onChangeText={setText}
              multiline
            />
            <Pressable onPress={send} disabled={sending || !text.trim()} style={[styles.send, (sending || !text.trim()) && { opacity: 0.4 }]}>
              <ThemedText style={{ color: '#fff', fontWeight: '700' }}>Gönder</ThemedText>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing.three, gap: Spacing.two },
  bubble: { maxWidth: '80%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8 },
  mine: { backgroundColor: '#18181B' },
  meta: { fontSize: 11, marginTop: 2 },
  composer: { flexDirection: 'row', gap: Spacing.two, padding: Spacing.two, alignItems: 'flex-end' },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, maxHeight: 120, fontSize: 16 },
  send: { backgroundColor: '#18181B', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
});
