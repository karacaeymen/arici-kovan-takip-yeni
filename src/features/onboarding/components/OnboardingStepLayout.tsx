import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '../../../theme';

import { OnboardingProgress } from './OnboardingProgress';

// İlk açılış adımlarının ortak düzeni: üstte ilerleme, başlık ve açıklama; ortada içerik;
// altta (başparmağın ulaştığı yerde) eylem düğmeleri.

export interface OnboardingStepLayoutProps {
  step: number;
  total: number;
  title: string;
  subtitle: string;
  children?: ReactNode;
  actions: ReactNode;
}

export function OnboardingStepLayout({
  step,
  total,
  title,
  subtitle,
  children,
  actions,
}: OnboardingStepLayoutProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <OnboardingProgress current={step} total={total} />
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          {children}
          <View style={styles.actions}>{actions}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, padding: spacing.xl, gap: spacing.xl },
  header: { gap: spacing.sm },
  title: { ...typography.title, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted },
  actions: { marginTop: 'auto', gap: spacing.sm },
});
