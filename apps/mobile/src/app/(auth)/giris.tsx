import { translateError } from '@alaris/shared';
import { Link } from 'expo-router';
import { useState } from 'react';

import { Message, PrimaryButton, TextField } from '@/components/form';
import { LanguagePicker } from '@/components/language-picker';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

export default function GirisScreen() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) setError(translateError(error.message, t));
    // Başarılıysa oturum değişir ve kök yerleşim Koçluklarım'a geçer.
  }

  return (
    <Screen>
      <LanguagePicker />
      <ThemedText type="subtitle">Alaris</ThemedText>
      <ThemedText themeColor="textSecondary">{t('m.auth.signInIntro')}</ThemedText>
      <TextField
        label={t('auth.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <TextField
        label={t('auth.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
      />
      {error && <Message kind="error" text={error} />}
      <PrimaryButton title={t('auth.signIn')} onPress={submit} loading={loading} disabled={!email || !password} />
      <Link href="/kayit">
        <ThemedText type="linkPrimary">{t('m.auth.toSignUp')}</ThemedText>
      </Link>
    </Screen>
  );
}
