import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, Text } from 'react-native';

import {
  colors,
  CONTROL_BORDER,
  MIN_TOUCH_SIZE,
  radius,
  spacing,
  typography,
} from '../../../theme';

// Seçilebilir etiket (TODO.md T0.8): mizaç, süzgeç gibi. Seçiliyken bal sarısı ve onay işaretli
// (renk tek başına anlam taşımasın); ekran okuyucuya "seçili" bildirilir. En az 56 dp.

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function Chip({ label, selected = false, onPress, disabled }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled: disabled === true }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        pressed && (selected ? styles.selectedPressed : styles.pressed),
        selected && !pressed && styles.selected,
        disabled && styles.disabled,
      ]}
    >
      {selected ? <MaterialCommunityIcons name="check" size={20} color={colors.onPrimary} /> : null}
      <Text style={[styles.text, selected && styles.selectedText, disabled && styles.disabledText]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: MIN_TOUCH_SIZE,
    minWidth: MIN_TOUCH_SIZE,
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: CONTROL_BORDER,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.surfaceAlt, borderColor: colors.text },
  selected: { backgroundColor: colors.primary, borderColor: colors.primaryBorder },
  selectedPressed: { backgroundColor: colors.primaryPressed, borderColor: colors.primaryBorder },
  disabled: { backgroundColor: colors.disabledBackground, borderColor: colors.border },
  text: { ...typography.captionStrong, fontSize: 17, color: colors.text },
  selectedText: { fontFamily: typography.button.fontFamily, color: colors.onPrimary },
  disabledText: { color: colors.textDisabled },
});
