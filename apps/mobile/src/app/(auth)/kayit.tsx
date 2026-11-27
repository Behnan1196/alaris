import { KVKK_VERSION, translateError } from '@alaris/shared';
import { Link } from 'expo-router';
import { useState } from 'react';

import { Message, PrimaryButton, SwitchRow, TextField } from '@/components/form';
import { LanguagePicker } from '@/components/language-picker';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

export default function KayitScreen() {
  const { t, locale } = useI18n();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [kvkk, setKvkk] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function submit() {
    if (password.length < 8) return setError(t('auth.err.passwordShort'));
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim(), kvkk_version: KVKK_VERSION, marketing_opt_in: marketing, locale },
      },
    });
    setLoading(false);
    if (error) return setError(translateError(error.message, t));
    if (!data.session) setSentTo(email.trim());
  }

  if (sentTo) {
    return (
      <Screen>
        <ThemedText type="subtitle">{t('m.auth.checkEmail')}</ThemedText>
        <Message kind="info" text={`${t('auth.confirmSent', { email: sentTo })} ${t('m.auth.confirmThenSignIn')}`} />
        <Link href="/giris">
          <ThemedText type="linkPrimary">{t('m.auth.backToSignIn')}</ThemedText>
        </Link>
      </Screen>
    );
  }

  return (
    <Screen>
      <LanguagePicker />
      <ThemedText type="subtitle">{t('auth.signUp')}</ThemedText>
      <ThemedText themeColor="textSecondary">{t('m.auth.signUpIntro')}</ThemedText>
      <TextField label={t('auth.fullName')} value={fullName} onChangeText={setFullName} autoComplete="name" />
      <TextField
        label={t('auth.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
      />
      <TextField label={t('auth.passwordNew')} value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
      <SwitchRow value={kvkk} onValueChange={setKvkk}>
        <ThemedText type="small">
          {t('auth.kvkkConsent')} ({t('m.auth.draftVersion', { version: KVKK_VERSION })})
        </ThemedText>
      </SwitchRow>
      <SwitchRow value={marketing} onValueChange={setMarketing}>
        <ThemedText type="small">{t('auth.marketing')}</ThemedText>
      </SwitchRow>
      {error && <Message kind="error" text={error} />}
      <PrimaryButton title={t('auth.signUp')} onPress={submit} loading={loading} disabled={!fullName.trim() || !email || !password || !kvkk} />
      <Link href="/giris">
        <ThemedText type="linkPrimary">{t('m.auth.toSignIn')}</ThemedText>
      </Link>
    </Screen>
  );
}
