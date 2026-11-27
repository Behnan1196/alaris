import { COACH_SHARE_VERSION, DOMAINS, HEALTH_DATA_VERSION, type DomainKey, translateError } from '@alaris/shared';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Message, PrimaryButton, SwitchRow, TextField } from '@/components/form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

type Preview = { coach_name: string; coach_title: string | null; domain_keys: string[] };

export default function KocEkleScreen() {
  const { session } = useAuth();
  const { t } = useI18n();
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
    if (error) return setError(translateError(error.message, t));
    if (!data?.length) return setError(t('err.inviteInvalid'));
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
      return setError(translateError(error.message, t));
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
          {t('m.addCoach.intro')}
        </ThemedText>
        <TextField
          label={t('web.invite.code')}
          value={code}
          onChangeText={(v) => setCode(v.toUpperCase())}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={8}
          style={styles.code}
        />
        {error && <Message kind="error" text={error} />}
        <PrimaryButton title={t('common.continue')} onPress={check} loading={loading} disabled={code.length !== 8} />
      </Screen>
    );
  }

  const coachName = [preview.coach_title, preview.coach_name].filter(Boolean).join(' ');
  return (
    <Screen>
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          {t('m.addCoach.invitedBy')}
        </ThemedText>
        <ThemedText style={styles.coachName}>{coachName}</ThemedText>
        <View style={styles.tags}>
          {preview.domain_keys.map((k) => {
            const d = DOMAINS[k as DomainKey];
            return (
              <View key={k} style={[styles.tag, { backgroundColor: d?.color ?? '#555' }]}>
                <ThemedText type="smallBold" style={{ color: '#fff' }}>
                  {t(`domain.${k as DomainKey}`)}
                </ThemedText>
              </View>
            );
          })}
        </View>
      </ThemedView>

      <SwitchRow value={share} onValueChange={setShare}>
        <ThemedText type="small">
          {t('m.addCoach.share', { coach: coachName })}
        </ThemedText>
      </SwitchRow>
      <SwitchRow value={health} onValueChange={setHealth}>
        <ThemedText type="small">
          {t('m.addCoach.health')}
        </ThemedText>
      </SwitchRow>
      <ThemedText type="small" themeColor="textSecondary">
        {t('m.addCoach.otherCoaches')}
      </ThemedText>
      {error && <Message kind="error" text={error} />}
      <PrimaryButton
        title={t('m.addCoach.submit')}
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
