import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

console.log("URL =", process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log("KEY EXISTS =", !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

const ExpoSecureStoreAdapter = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

console.log("Supabase initialized");