import { Tabs } from 'expo-router';

// Sekme başlıkları T0.8'de i18n'e (tr.json) taşınacak.
export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Ana Sayfa' }} />
    </Tabs>
  );
}
