import * as SecureStore from 'expo-secure-store';

export async function getAccessToken() {
  return SecureStore.getItemAsync('accessToken');
}

export async function getAuthHeaders() {
  const token = await getAccessToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function clearAuthStorage() {
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
  await SecureStore.deleteItemAsync('workerId');
}
