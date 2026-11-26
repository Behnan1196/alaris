import { COACH_SHARE_VERSION, DOMAINS, HEALTH_DATA_VERSION, type DomainKey } from '@alaris/shared';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Message, PrimaryButton, SwitchRow, TextField } from '@/components/form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

type Preview = { coach_name: string; coach_title: string | null; domain_keys: string[] };

export default function KocEkleScreen() {
  const { session } = useAuth();
  const [code, setCode] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [share, setShare] = useState(false);
  const [health, setHealth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function check() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.rpc('invite_preview', { p_code: code });
    setLoading(false);
    if (error) return setError(error.message);
    if (!data?.length) return setError('Kod bulunamadı, kullanılmış ya da süresi dolmuş.');
    setPreview(data[0]);
  }

  async function accept() {
    setLoading(true);
    setError(null);
    const { data: coachingId, error } = await supabase.rpc('redeem_invite', {
      p_code: code,
      p_consent_version: COACH_SHARE_VERSION,
    });
    if (error) {
      setLoading(false);
      return setError(error.message);
    }
    await supabase.from('consents').insert({
      client_id: session!.user.id,
      type: 'health_data',
      coaching_id: coachingId,
      text_version: HEALTH_DATA_VERSION,
    });
    setLoading(false);
    router.back();
  }

  if (!session) return <Redirect href="/giris" />;

  if (!preview) {
    return (
      <Screen>
        <ThemedText themeColor="textSecondary">
          Koçundan aldığın 8 karakterlik davet kodunu yaz.
        </ThemedText>
        <TextField
          label="Davet kodu"
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={8}
          style={styles.code}
        />
        {error && <Message kind="error" text={error} />}
        <PrimaryButton title="Devam" onPress={check} loading={loading} disabled={code.length !== 8} />
      </Screen>
    );
  }

  const coachName = [preview.coach_title, preview.coach_name].filter(Boolean).join(' ');
  return (
    <Screen>
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          Davet eden koç
        </ThemedText>
        <ThemedText style={styles.coachName}>{coachName}</ThemedText>
        <View style={styles.tags}>
          {preview.domain_keys.map((k) => {
            const d = DOMAINS[k as DomainKey];
            return (
              <View key={k} style={[styles.tag, { backgroundColor: d?.color ?? '#555' }]}>
                <ThemedText type="smallBold" style={{ color: '#fff' }}>
                  {d?.name ?? k}
                </ThemedText>
              </View>
            );
          })}
        </View>
      </ThemedView>

      <SwitchRow value={share} onValueChange={setShare}>
        <ThemedText type="small">
          {coachName} ile programlarımı, kayıtlarımı ve mesajlarımı paylaşmayı kabul ediyorum.
          Koçluğu bitirdiğimde bu izin sona erer.
        </ThemedText>
      </SwitchRow>
      <SwitchRow value={health} onValueChange={setHealth}>
        <ThemedText type="small">
          Kilo, vücut ölçüleri, beslenme kayıtları ve fotoğraflar gibi sağlık verilerimin bu koçluk için
          işlenmesine açık rıza veriyorum.
        </ThemedText>
      </SwitchRow>
      <ThemedText type="small" themeColor="textSecondary">
        Diğer koçların bu koçluğun ayrıntılarını görmesi ayrıca senin iznine bağlı.
      </ThemedText>
      {error && <Message kind="error" text={error} />}
      <PrimaryButton
        title="Koçu ekle"
        onPress={accept}
        loading={loading}
        disabled={!share || !health}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  code: { fontSize: 24, letterSpacing: 6, fontWeight: '600' },
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  coachName: { fontSize: 22, fontWeight: '600', lineHeight: 28 },
  tags: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  tag: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 },
});
