import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import {
  colors,
  CONTROL_BORDER,
  CONTROL_HEIGHT,
  radius,
  spacing,
  typography,
} from '../../../theme';

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
        <View style={styles.errorRow}>
          <MaterialCommunityIcons name="alert-circle-outline" size={22} color={colors.danger} />
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  label: { ...typography.captionStrong, color: colors.text },
  boxes: { flexDirection: 'row', gap: spacing.sm },
  box: {
    flex: 1,
    minHeight: CONTROL_HEIGHT + spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: CONTROL_BORDER,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  // Sıradaki hane: koyu kenarlık ve bal halkası (odak).
  boxActive: { borderColor: colors.text, borderWidth: 3, backgroundColor: colors.primarySoft },
  boxError: { borderColor: colors.danger, borderWidth: 3 },
  digit: { ...typography.number, color: colors.text },
  // Kutuların üstünü kaplar: kutuya dokunmak klavyeyi açar, yazı kutularda görünür.
  hiddenInput: { ...StyleSheet.absoluteFill, color: 'transparent', opacity: 0.02 },
  errorRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  error: { ...typography.captionStrong, flex: 1, color: colors.danger },
});
