import { StyleSheet, Text, TextInput, View } from 'react-native';

import { formatMobileDigits } from '../../../lib/format';
import { colors, MIN_TOUCH_SIZE, radius, spacing, typography } from '../../../theme';

// Türkiye cep telefonu girişi: "+90" sabit, numara yazıldıkça `532 123 45 67` diye gruplanır.
// Değer yalnızca rakam olarak (`5321234567`) dışarı verilir.

export interface PhoneInputProps {
  label: string;
  placeholder: string;
  digits: string;
  onChangeDigits: (digits: string) => void;
  onSubmit?: () => void;
  error?: string | null;
  editable?: boolean;
}

/** Yazılanı rakama çevirir; baştaki 0 ve +90 atılır, en fazla 10 hane. */
export function toMobileDigits(text: string): string {
  let digits = text.replace(/\D/g, '');
  if (text.trim().startsWith('+90') || (digits.startsWith('90') && digits.length > 10)) {
    digits = digits.slice(2);
  }
  return digits.replace(/^0+/, '').slice(0, 10);
}

export function PhoneInput({
  label,
  placeholder,
  digits,
  onChangeDigits,
  onSubmit,
  error,
  editable = true,
}: PhoneInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, error ? styles.fieldError : null]}>
        <Text style={styles.prefix}>+90</Text>
        <TextInput
          accessibilityLabel={label}
          value={formatMobileDigits(digits)}
          onChangeText={(text) => onChangeDigits(toMobileDigits(text))}
          onSubmitEditing={onSubmit}
          placeholder={placeholder}
          placeholderTextColor={colors.textDisabled}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          returnKeyType="done"
          editable={editable}
          style={styles.input}
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
  field: {
    minHeight: MIN_TOUCH_SIZE,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  fieldError: { borderColor: colors.danger },
  prefix: { ...typography.subtitle, color: colors.textMuted },
  input: { ...typography.subtitle, flex: 1, color: colors.text, paddingVertical: spacing.md },
  error: { ...typography.caption, color: colors.danger },
});
