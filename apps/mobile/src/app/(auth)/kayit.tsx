import { KVKK_VERSION } from '@alaris/shared';
import { Link } from 'expo-router';
import { useState } from 'react';

import { Message, PrimaryButton, SwitchRow, TextField } from '@/components/form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { translateAuthError } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function KayitScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [kvkk, setKvkk] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function submit() {
    if (password.length < 8) return setError('Şifre en az 8 karakter olmalı.');
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim(), kvkk_version: KVKK_VERSION, marketing_opt_in: marketing },
      },
    });
    setLoading(false);
    if (error) return setError(translateAuthError(error.message));
    if (!data.session) setSentTo(email.trim());
  }

  if (sentTo) {
    return (
      <Screen>
        <ThemedText type="subtitle">E-postanı kontrol et</ThemedText>
        <Message
          kind="info"
          text={`Onay bağlantısını ${sentTo} adresine gönderdik. Bağlantıya tıkladıktan sonra buraya dönüp giriş yap.`}
        />
        <Link href="/giris">
          <ThemedText type="linkPrimary">Giriş ekranına dön</ThemedText>
        </Link>
      </Screen>
    );
  }

  return (
    <Screen>
      <ThemedText type="subtitle">Kaydol</ThemedText>
      <ThemedText themeColor="textSecondary">
        Alaris danışanlar için ücretsiz. Kaydolduktan sonra koçunun verdiği davet koduyla bağlanırsın.
      </ThemedText>
      <TextField label="Ad soyad" value={fullName} onChangeText={setFullName} autoComplete="name" />
      <TextField
        label="E-posta"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
      />
      <TextField
        label="Şifre (en az 8 karakter)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
      />
      <SwitchRow value={kvkk} onValueChange={setKvkk}>
        <ThemedText type="small">
          Aydınlatma metnini okudum, kişisel verilerimin işlenmesine açık rıza veriyorum. (Taslak
          metin, sürüm {KVKK_VERSION})
        </ThemedText>
      </SwitchRow>
      <SwitchRow value={marketing} onValueChange={setMarketing}>
        <ThemedText type="small">Haber ve kampanya e-postaları almak istiyorum (isteğe bağlı).</ThemedText>
      </SwitchRow>
      {error && <Message kind="error" text={error} />}
      <PrimaryButton
        title="Kaydol"
        onPress={submit}
        loading={loading}
        disabled={!fullName.trim() || !email || !password || !kvkk}
      />
      <Link href="/giris">
        <ThemedText type="linkPrimary">Zaten hesabın var mı? Giriş yap</ThemedText>
      </Link>
    </Screen>
  );
}
