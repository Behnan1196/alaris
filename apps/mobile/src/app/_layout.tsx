import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/lib/auth';
import { I18nProvider, useI18n } from '@/lib/i18n';

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { loading } = useAuth();
  const { t } = useI18n();
  if (loading) return null;

  // Oturum yönlendirmesi grup yerleşimlerinde: (tabs) ve koc-ekle girişsiz /giris'e,
  // (auth) girişliyken /'a yönlendirir.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="gorev/[id]" options={{ headerShown: true, headerBackTitle: t('common.back') }} />
      <Stack.Screen name="sohbet/[id]" options={{ headerShown: true, headerBackTitle: t('common.back') }} />
      <Stack.Screen
        name="aliskanliklar"
        options={{ headerShown: true, title: t('m.habits.title'), headerBackTitle: t('common.back') }}
      />
      <Stack.Screen
        name="koc-ekle"
        options={{ presentation: 'modal', headerShown: true, title: t('m.addCoach.title') }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <I18nProvider>
        <AuthProvider>
          <AnimatedSplashOverlay />
          <RootStack />
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
