import * as SecureStore from 'expo-secure-store';
import { supabase } from './supabase';

/**
 * Persists tokens for Express API calls and syncs Supabase client session (refresh, etc.).
 */
export async function saveSessionFromBackend({ access_token, refresh_token }) {
  if (access_token) await SecureStore.setItemAsync('accessToken', access_token);
  if (refresh_token) await SecureStore.setItemAsync('refreshToken', refresh_token);
  if (access_token && refresh_token) {
    await supabase.auth.setSession({ access_token, refresh_token });
  }
}
