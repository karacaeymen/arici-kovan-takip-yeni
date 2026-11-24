import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { t } from '../../../i18n';
import { colors, MIN_TOUCH_SIZE, radius, shadows, spacing, typography } from '../../../theme';

// Alttan açılan panel (TODO.md T0.8): seçim ve onaylar için. Başparmağın ulaştığı yerde durur.
// Arka plana dokunmak, "Kapat" düğmesi ve Android geri tuşu paneli kapatır.

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          onPress={onClose}
          style={styles.scrim}
        />
        <View
          accessibilityViewIsModal
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}
        >
          <View style={styles.grab} />
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              onPress={onClose}
              style={({ pressed }) => [styles.close, pressed && styles.closePressed]}
            >
              <MaterialCommunityIcons name="close" size={26} color={colors.secondary} />
            </Pressable>
          </View>
          <View style={styles.content}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: colors.scrim },
  sheet: {
    paddingTop: spacing.sm,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadows.sheet,
  },
  grab: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    marginBottom: spacing.xs,
    borderRadius: 3,
    backgroundColor: colors.borderStrong,
  },
  header: {
    minHeight: MIN_TOUCH_SIZE,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.screen,
    paddingRight: spacing.sm,
  },
  title: { ...typography.subtitle, flex: 1, color: colors.text },
  close: {
    width: MIN_TOUCH_SIZE,
    height: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  closePressed: { backgroundColor: colors.surfaceAlt },
  content: { paddingHorizontal: spacing.screen, gap: spacing.md },
});
