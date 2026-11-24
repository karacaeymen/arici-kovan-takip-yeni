import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../../components/ui/Button/Button';
import { t } from '../../../i18n';
import { colors, spacing, typography } from '../../../theme';
import { PhoneInput } from '../components/PhoneInput';
import { useLogin } from '../hooks/useLogin';

/** Telefon numarasıyla giriş: numarayı al, SMS kodu gönder, doğrulama ekranına geç. */
export function LoginScreen() {
  const router = useRouter();
  const { digits, changeDigits, error, sending, submit } = useLogin();

  const handleSubmit = async () => {
    const phone = await submit();
    if (phone) router.push({ pathname: '/otp-verify', params: { phone } });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              {t('auth.login.title')}
            </Text>
            <Text style={styles.subtitle}>{t('auth.login.subtitle')}</Text>
          </View>
          <PhoneInput
            label={t('auth.login.phoneLabel')}
            placeholder={t('auth.login.phonePlaceholder')}
            digits={digits}
            onChangeDigits={changeDigits}
            onSubmit={() => void handleSubmit()}
            error={error ? t(`auth.errors.${error}`) : null}
            editable={!sending}
          />
          <Button
            label={t('auth.login.submit')}
            onPress={() => void handleSubmit()}
            disabled={digits.length < 10}
            loading={sending}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.screen, gap: spacing.xl },
  header: { gap: spacing.sm },
  title: { ...typography.title, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted },
});
