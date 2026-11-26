import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/lib/auth';

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { loading } = useAuth();
  if (loading) return null;

  // Oturum yönlendirmesi grup yerleşimlerinde: (tabs) ve koc-ekle girişsiz /giris'e,
  // (auth) girişliyken /'a yönlendirir.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="gorev/[id]" options={{ headerShown: true, headerBackTitle: 'Geri' }} />
      <Stack.Screen name="sohbet/[id]" options={{ headerShown: true, headerBackTitle: 'Geri' }} />
      <Stack.Screen
        name="aliskanliklar"
        options={{ headerShown: true, title: 'Alışkanlıklarım', headerBackTitle: 'Geri' }}
      />
      <Stack.Screen
        name="koc-ekle"
        options={{ presentation: 'modal', headerShown: true, title: 'Koç ekle' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <RootStack />
      </AuthProvider>
    </ThemeProvider>
  );
}
