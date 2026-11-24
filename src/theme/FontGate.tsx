import { IBMPlexSans_400Regular } from '@expo-google-fonts/ibm-plex-sans/400Regular';
import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans/600SemiBold';
import { IBMPlexSans_700Bold } from '@expo-google-fonts/ibm-plex-sans/700Bold';
import { useFonts } from 'expo-font';
import type { ReactNode } from 'react';

// Uygulamanın yazı tipini (IBM Plex Sans 400/600/700) açılışta yükler; yüklenene kadar ekran
// çizilmez. Yükleme başarısız olursa uygulama sistem yazı tipiyle açılır (kayıt yapmayı engellemez).
// Kalınlıklar ayrı ayrı import edilir: paketin kökünden almak 18 dosyanın hepsini uygulamaya ekler.
// Kök `_layout.tsx` bununla sarılır (TODO.md T0.8).

export function FontGate({ children }: { children: ReactNode }) {
  const [loaded, error] = useFonts({
    IBMPlexSans_400Regular,
    IBMPlexSans_600SemiBold,
    IBMPlexSans_700Bold,
  });
  if (!loaded && !error) return null;
  return <>{children}</>;
}
