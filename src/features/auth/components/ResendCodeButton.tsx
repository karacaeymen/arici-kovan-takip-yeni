import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../components/ui/Button/Button';
import { t } from '../../../i18n';
import { colors, MIN_TOUCH_SIZE, typography } from '../../../theme';

// "Kodu tekrar gönder": bekleme süresi bitene kadar geri sayım gösterir.

export interface ResendCodeButtonProps {
  secondsLeft: number;
  onPress: () => void;
  sending?: boolean;
}

export function ResendCodeButton({ secondsLeft, onPress, sending }: ResendCodeButtonProps) {
  if (secondsLeft > 0) {
    return (
      <View style={styles.waiting}>
        <Text style={styles.waitingText}>{t('auth.otp.resendIn', { seconds: secondsLeft })}</Text>
      </View>
    );
  }
  return <Button variant="text" label={t('auth.otp.resend')} onPress={onPress} loading={sending} />;
}

const styles = StyleSheet.create({
  waiting: { minHeight: MIN_TOUCH_SIZE, alignItems: 'center', justifyContent: 'center' },
  waitingText: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
});
