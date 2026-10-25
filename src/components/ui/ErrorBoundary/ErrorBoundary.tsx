import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// Rota grubunda yakalanmamış bir hata olunca görünen ekran (TODO.md T0.7).
// Expo Router `error` ve `retry` verir; `onError` ile hata bildirilir (bileşen Sentry'yi bilmez).
// Metinler T0.8'de i18n'e, renkler src/theme'e taşınacak.

export interface ErrorBoundaryProps {
  error: Error;
  retry: () => void | Promise<void>;
  onError?: (error: Error) => void;
}

export function ErrorBoundary({ error, retry, onError }: ErrorBoundaryProps) {
  useEffect(() => {
    onError?.(error);
  }, [error, onError]);

  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text style={styles.title}>Bir şeyler ters gitti</Text>
      <Text style={styles.message}>
        Kayıtlarınız telefonda güvende. Tekrar deneyin; sorun sürerse uygulamayı yeniden açın.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => void retry()}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>Tekrar dene</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  title: { fontSize: 22, fontWeight: '600', textAlign: 'center' },
  message: { fontSize: 17, textAlign: 'center' },
  // Saha kullanımı: eldivenle basılabilecek büyüklükte (en az 56 pt)
  button: {
    minHeight: 56,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#1f1f1f',
  },
  buttonPressed: { opacity: 0.8 },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: '600' },
});
