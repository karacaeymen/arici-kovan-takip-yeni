import { StyleSheet, Text, View } from 'react-native';

// İskelet ekran. Metinler T0.8'de i18n'e, renkler src/theme'e taşınacak;
// bugünün görevleri T4.7'de eklenecek.
export function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Arıcı Kovan Takip</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
});
