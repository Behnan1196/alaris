import { Link } from 'expo-router';
import { useState } from 'react';

import { Message, PrimaryButton, TextField } from '@/components/form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { translateAuthError } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function GirisScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) setError(translateAuthError(error.message));
    // Başarılıysa oturum değişir ve kök yerleşim Koçluklarım'a geçer.
  }

  return (
    <Screen>
      <ThemedText type="subtitle">Alaris</ThemedText>
      <ThemedText themeColor="textSecondary">Koçlarınla çalışmaya devam etmek için giriş yap.</ThemedText>
      <TextField
        label="E-posta"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <TextField
        label="Şifre"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
      />
      {error && <Message kind="error" text={error} />}
      <PrimaryButton title="Giriş yap" onPress={submit} loading={loading} disabled={!email || !password} />
      <Link href="/kayit">
        <ThemedText type="linkPrimary">Hesabın yok mu? Kaydol</ThemedText>
      </Link>
    </Screen>
  );
}
