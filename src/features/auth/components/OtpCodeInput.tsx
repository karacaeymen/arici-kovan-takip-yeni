import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, MIN_TOUCH_SIZE, radius, spacing, typography } from '../../../theme';

// Doğrulama kodu girişi: hane hane kutular görünür, altta tek bir metin kutusu yazmayı alır.
// iOS'ta SMS'ten gelen kod klavyenin üstünde önerilir (`oneTimeCode`), Android'de otomatik doldurulur.

export interface OtpCodeInputProps {
  label: string;
  value: string;
  length: number;
  onChange: (code: string) => void;
  onComplete?: (code: string) => void;
  error?: string | null;
  editable?: boolean;
}

export function OtpCodeInput({
  label,
  value,
  length,
  onChange,
  onComplete,
  error,
  editable = true,
}: OtpCodeInputProps) {
  const handleChange = (text: string) => {
    const code = text.replace(/\D/g, '').slice(0, length);
    onChange(code);
    if (code.length === length) onComplete?.(code);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.boxes}>
        {Array.from({ length }, (_, i) => (
          <View
            key={i}
            style={[
              styles.box,
              i === value.length && styles.boxActive,
              error ? styles.boxError : null,
            ]}
          >
            <Text style={styles.digit}>{value[i] ?? ''}</Text>
          </View>
        ))}
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={handleChange}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          maxLength={length}
          editable={editable}
          autoFocus
          caretHidden
          style={styles.hiddenInput}
        />
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  label: { ...typography.body, fontWeight: '600', color: colors.text },
  boxes: { flexDirection: 'row', gap: spacing.sm },
  box: {
    flex: 1,
    minHeight: MIN_TOUCH_SIZE + spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  boxActive: { borderColor: colors.primary },
  boxError: { borderColor: colors.danger },
  digit: { ...typography.title, color: colors.text },
  // Kutuların üstünü kaplar: kutuya dokunmak klavyeyi açar, yazı kutularda görünür.
  hiddenInput: { ...StyleSheet.absoluteFill, color: 'transparent', opacity: 0.02 },
  error: { ...typography.caption, color: colors.danger },
});
