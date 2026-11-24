import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  colors,
  CONTROL_BORDER,
  CONTROL_HEIGHT,
  radius,
  spacing,
  typography,
} from '../../../theme';

// Segmentli seçim (TODO.md T0.8): 2–4 seçenekten biri (ör. kraliçe durumu). Seçenekler eşit
// genişlikte; 2 ya da 3 seçenek tek satırda, 4 seçenek iki satırda. Seçili seçenek bal sarısı
// ve sağ üstte onay işaretli (renk tek başına anlam taşımasın). Ekran okuyucuda radyo düğmeleri.
// `allowDeselect` ile seçili seçeneğe yeniden basmak seçimi kaldırır (`null`).

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedChoiceProps<T extends string> {
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
  allowDeselect?: boolean;
  disabled?: boolean;
}

function toRows<T>(items: readonly T[]): T[][] {
  const columns = items.length <= 3 ? items.length : 2;
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += columns) rows.push(items.slice(i, i + columns));
  return rows;
}

export function SegmentedChoice<T extends string>({
  label,
  options,
  value,
  onChange,
  allowDeselect,
  disabled,
}: SegmentedChoiceProps<T>) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.rows}>
        {toRows(options).map((row) => (
          <View key={row[0]?.value} style={styles.row}>
            {row.map((option) => {
              const selected = option.value === value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityLabel={option.label}
                  accessibilityState={{ checked: selected, disabled: disabled === true }}
                  disabled={disabled}
                  onPress={() => onChange(selected && allowDeselect ? null : option.value)}
                  style={({ pressed }) => [
                    styles.option,
                    pressed && (selected ? styles.selectedPressed : styles.pressed),
                    selected && !pressed && styles.selected,
                    disabled && styles.disabled,
                  ]}
                >
                  {selected ? (
                    <MaterialCommunityIcons
                      name="check"
                      size={20}
                      color={colors.onPrimary}
                      style={styles.check}
                    />
                  ) : null}
                  <Text
                    style={[
                      styles.text,
                      selected && styles.selectedText,
                      disabled && styles.disabledText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  label: { ...typography.captionStrong, color: colors.text },
  rows: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  option: {
    flex: 1,
    minHeight: CONTROL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
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
  check: { position: 'absolute', top: 3, right: 4 },
  text: { ...typography.captionStrong, fontSize: 17, color: colors.text, textAlign: 'center' },
  selectedText: { fontFamily: typography.button.fontFamily, color: colors.onPrimary },
  disabledText: { color: colors.textDisabled },
});
