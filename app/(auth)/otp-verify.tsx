import { useLocalSearchParams } from 'expo-router';

import { OtpVerifyScreen } from '@/features/auth/screens/OtpVerifyScreen';

export default function OtpVerifyRoute() {
  const { phone } = useLocalSearchParams<{ phone?: string }>();
  return <OtpVerifyScreen phone={typeof phone === 'string' ? phone : ''} />;
}
