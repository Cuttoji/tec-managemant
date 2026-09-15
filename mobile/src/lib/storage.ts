import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LoginResponse, SessionUser } from '@/types';

const TOKEN_KEY = 'techmanage_token';
const USER_KEY = 'techmanage_user';
const PERMS_KEY = 'techmanage_permissions';

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const [user, perms] = await Promise.all([
    AsyncStorage.getItem(USER_KEY),
    AsyncStorage.getItem(PERMS_KEY),
  ]);
  if (!user) return null;
  return {
    ...JSON.parse(user),
    permissions: perms ? JSON.parse(perms) : [],
  };
}

export async function storeAuthResponse(data: LoginResponse): Promise<void> {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, data.token],
    [USER_KEY, JSON.stringify(data.user)],
    [PERMS_KEY, JSON.stringify(data.permissions)],
  ]);
}

export async function clearAuth(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, PERMS_KEY]);
}
