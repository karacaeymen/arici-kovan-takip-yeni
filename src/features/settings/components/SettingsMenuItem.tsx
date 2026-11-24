import { ListItem, type ListItemProps } from '../../../components/ui/ListItem/ListItem';

// Ayarlar menüsündeki tek satır: başlık, isteğe bağlı açıklama; basılınca bir ekrana gider ya da
// bir eylem yapar. `destructive` (ör. çıkış) kırmızı yazılır. Görünümü ortak `ListItem`'dır.

export interface SettingsMenuItemProps {
  title: string;
  icon?: ListItemProps['icon'];
  subtitle?: string | null;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

export function SettingsMenuItem(props: SettingsMenuItemProps) {
  return <ListItem {...props} />;
}
