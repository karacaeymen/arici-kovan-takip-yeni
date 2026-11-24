import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/ui/AppText/AppText';
import { t } from '../../../i18n';
import { colors, spacing } from '../../../theme';

// İskelet ekran. Bugünün görevleri T4.7'de eklenecek.
export function HomeScreen() {
  return (
    <View style={styles.container}>
      <AppText variant="title" header align="center">
        {t('app.name')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.screen,
    backgroundColor: colors.background,
  },
});
