import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import {
  colors,
  CONTROL_BORDER,
  CONTROL_HEIGHT,
  radius,
  spacing,
  typography,
} from '../../../theme';

// İşletme ve arılık adı girişi: etiket, 60 dp yazı alanı (odaktayken bal halkası) ve ikonlu hata.

export interface NameFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  error?: string | null;
  editable?: boolean;
  maxLength?: number;
}

export function NameField({
  label,
  placeholder,
  value,
  onChangeText,
  onSubmit,
  error,
  editable = true,
  maxLength,
}: NameFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.ring, focused && !error && styles.ringFocused]}>
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          editable={editable}
          maxLength={maxLength}
          style={[
            styles.input,
            focused && styles.inputFocused,
            error ? styles.inputError : null,
            !editable && styles.inputDisabled,
          ]}
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
  // Odak halkası: kutunun dışında 3 dp bal sarısı çerçeve.
  ring: { borderWidth: 3, borderColor: 'transparent', borderRadius: radius.md + 3, margin: -3 },
  ringFocused: { borderColor: colors.primary },
  input: {
    ...typography.body,
    minHeight: CONTROL_HEIGHT,
    borderWidth: CONTROL_BORDER,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    color: colors.text,
  },
  inputFocused: { borderColor: colors.text },
  inputError: { borderColor: colors.danger, borderWidth: 3 },
  inputDisabled: {
    backgroundColor: colors.disabledBackground,
    borderColor: colors.border,
    color: colors.textDisabled,
  },
  errorRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  error: { ...typography.captionStrong, flex: 1, color: colors.danger },
});
