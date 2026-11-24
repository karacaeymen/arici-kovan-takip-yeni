import { Redirect, useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../../components/ui/Button/Button';
import { t } from '../../../i18n';
import { colors, spacing, typography } from '../../../theme';
import { OtpCodeInput } from '../components/OtpCodeInput';
import { ResendCodeButton } from '../components/ResendCodeButton';
import { useOtpVerify } from '../hooks/useOtpVerify';

export interface OtpVerifyScreenProps {
  /** Kodun gönderildiği numara (`+905…`); giriş ekranından gelir. */
  phone: string;
}

/**
 * SMS kodunu doğrular. Başarılı olunca oturum açılır; ana sayfaya yönlendirmeyi oturum kapısı
 * (`(auth)` düzenindeki `SessionGate`) yapar.
 */
export function OtpVerifyScreen({ phone }: OtpVerifyScreenProps) {
  if (!phone) return <Redirect href="/login" />;
  return <OtpVerifyForm phone={phone} />;
}

function OtpVerifyForm({ phone }: OtpVerifyScreenProps) {
  const router = useRouter();
  const otp = useOtpVerify(phone);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              {t('auth.otp.title')}
            </Text>
            <Text style={styles.subtitle}>
              {t('auth.otp.subtitle', { phone: otp.displayPhone })}
            </Text>
          </View>
          <OtpCodeInput
            label={t('auth.otp.codeLabel')}
            value={otp.code}
            length={otp.codeLength}
            onChange={otp.changeCode}
            onComplete={(code) => void otp.verify(code)}
            error={otp.error ? t(`auth.errors.${otp.error}`) : null}
            editable={!otp.verifying}
          />
          {otp.resent ? <Text style={styles.notice}>{t('auth.otp.resent')}</Text> : null}
          <Button
            label={t('auth.otp.submit')}
            onPress={() => void otp.verify()}
            disabled={otp.code.length < otp.codeLength}
            loading={otp.verifying}
          />
          <ResendCodeButton
            secondsLeft={otp.secondsLeft}
            onPress={() => void otp.resend()}
            sending={otp.resending}
          />
          <Button variant="text" label={t('auth.otp.changePhone')} onPress={() => router.back()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.screen, gap: spacing.lg },
  header: { gap: spacing.sm, marginBottom: spacing.sm },
  title: { ...typography.title, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted },
  notice: { ...typography.caption, color: colors.success },
});
