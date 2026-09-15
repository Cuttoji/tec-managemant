import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Resolve the backend API base URL.
 * - Override with EXPO_PUBLIC_API_URL env var (recommended for physical devices).
 * - Android emulator can't reach host `localhost`, use 10.0.2.2 instead.
 * - Falls back to app.json `extra.apiUrl`.
 */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const fromAppJson = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  if (fromAppJson) return fromAppJson.replace(/\/$/, '');

  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
  return 'http://localhost:3000';
}
