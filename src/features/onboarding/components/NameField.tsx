import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, MIN_TOUCH_SIZE, radius, spacing, typography } from '../../../theme';

// İşletme ve arılık adı girişi: etiket, büyük yazı alanı ve hata metni.

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
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={colors.textDisabled}
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="done"
        editable={editable}
        maxLength={maxLength}
        style={[styles.input, error ? styles.inputError : null]}
      />
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
  input: {
    ...typography.subtitle,
    minHeight: MIN_TOUCH_SIZE,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    color: colors.text,
  },
  inputError: { borderColor: colors.danger },
  error: { ...typography.caption, color: colors.danger },
});
