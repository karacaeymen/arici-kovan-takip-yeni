import { Pressable, StyleSheet, Text, View } from 'react-native';

import { t } from '../../../i18n';
import {
  colors,
  CONTROL_BORDER,
  MIN_TOUCH_SIZE,
  radius,
  spacing,
  typography,
} from '../../../theme';

// Sayaç satırı (TODO.md T0.8): solda etiket (ve isteğe bağlı açıklama), sağda – değer +. Klavye
// açmadan sayı girişi (ör. çerçeve sayısı). Ekran okuyucuda "ayarlanabilir" öğedir.
// Değer `null` ise (henüz girilmedi) "–" görünür; + ilk basışta en küçük değeri yazar.

export interface StepperProps {
  label: string;
  helper?: string;
  value: number | null;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

export function Stepper({
  label,
  helper,
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  disabled,
}: StepperProps) {
  const canDecrease = !disabled && value !== null && value > min;
  const canIncrease = !disabled && (value === null || value < max);
  const decrease = () => canDecrease && onChange(Math.max(min, value - step));
  const increase = () =>
    canIncrease && onChange(value === null ? min : Math.min(max, value + step));

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={
        value === null ? { text: t('ui.stepper.empty') } : { now: value, min, max }
      }
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={({ nativeEvent }) =>
        nativeEvent.actionName === 'increment' ? increase() : decrease()
      }
      style={styles.row}
    >
      <View style={styles.texts}>
        <Text style={styles.label}>{label}</Text>
        {helper ? <Text style={styles.helper}>{helper}</Text> : null}
      </View>
      <View style={styles.stepper}>
        <StepButton
          symbol="−"
          label={t('ui.stepper.decrease', { label })}
          onPress={decrease}
          enabled={canDecrease}
        />
        <Text style={styles.value}>{value ?? t('ui.stepper.empty')}</Text>
        <StepButton
          symbol="+"
          label={t('ui.stepper.increase', { label })}
          onPress={increase}
          enabled={canIncrease}
        />
      </View>
    </View>
  );
}

function StepButton(props: {
  symbol: string;
  label: string;
  onPress: () => void;
  enabled: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.label}
      accessibilityState={{ disabled: !props.enabled }}
      disabled={!props.enabled}
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        !props.enabled && styles.buttonDisabled,
      ]}
    >
      <Text style={[styles.symbol, !props.enabled && styles.symbolDisabled]}>{props.symbol}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  texts: { flex: 1, gap: 2 },
  label: { ...typography.bodyStrong, lineHeight: 24, color: colors.text },
  helper: { ...typography.caption, color: colors.textMuted },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  value: { ...typography.number, minWidth: 60, textAlign: 'center', color: colors.text },
  button: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: CONTROL_BORDER,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  buttonPressed: { backgroundColor: colors.surfaceAlt, borderColor: colors.text },
  buttonDisabled: { backgroundColor: colors.disabledBackground, borderColor: colors.border },
  symbol: { fontSize: 30, lineHeight: 34, color: colors.text },
  symbolDisabled: { color: colors.textDisabled },
});
