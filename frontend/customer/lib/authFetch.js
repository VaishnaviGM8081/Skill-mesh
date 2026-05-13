import * as SecureStore from 'expo-secure-store';

export async function getAuthHeaders() {
  const token = await SecureStore.getItemAsync('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function clearAuthStorage() {
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
  await SecureStore.deleteItemAsync('customerId');
}
