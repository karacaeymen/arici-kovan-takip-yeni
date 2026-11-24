import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { formatMobileDigits } from '../../../lib/format';
import {
  colors,
  CONTROL_BORDER,
  CONTROL_HEIGHT,
  radius,
  spacing,
  typography,
} from '../../../theme';

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
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.ring, focused && !error && styles.ringFocused]}>
        <View
          style={[
            styles.field,
            focused && styles.fieldFocused,
            error ? styles.fieldError : null,
            !editable && styles.fieldDisabled,
          ]}
        >
          <Text style={styles.prefix}>+90</Text>
          <TextInput
            accessibilityLabel={label}
            value={formatMobileDigits(digits)}
            onChangeText={(text) => onChangeDigits(toMobileDigits(text))}
            onSubmitEditing={onSubmit}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            autoComplete="tel"
            returnKeyType="done"
            editable={editable}
            style={styles.input}
          />
        </View>
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
  // Odak halkası: kutunun dışında 3 dp bal sarısı çerçeve.
  ring: { borderWidth: 3, borderColor: 'transparent', borderRadius: radius.md + 3, margin: -3 },
  ringFocused: { borderColor: colors.primary },
  field: {
    minHeight: CONTROL_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: CONTROL_BORDER,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    gap: 10,
  },
  fieldFocused: { borderColor: colors.text },
  fieldError: { borderColor: colors.danger, borderWidth: 3 },
  fieldDisabled: { backgroundColor: colors.disabledBackground, borderColor: colors.border },
  prefix: { ...typography.bodyStrong, color: colors.textMuted },
  input: { ...typography.body, flex: 1, color: colors.text, paddingVertical: spacing.sm },
  errorRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  error: { ...typography.captionStrong, flex: 1, color: colors.danger },
});
