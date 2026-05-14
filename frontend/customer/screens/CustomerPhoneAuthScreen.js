import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../apiConfig';
import { getAuthHeaders, clearAuthStorage } from '../lib/authFetch';
import { saveSessionFromBackend } from '../lib/authSession';
import { supabase } from '../lib/supabase';

function toE164India(phoneDigits) {
  const d = phoneDigits.replace(/\D/g, '');
  if (d.length === 10) return `+91${d}`;
  if (d.startsWith('91') && d.length === 12) return `+${d}`;
  return d.startsWith('+') ? d : `+${d}`;
}

async function ensureCustomerRegistered(accessToken) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
  let me = await fetch(`${API_URL}/api/customers/me`, { headers });
  if (me.status === 404) {
    const reg = await fetch(`${API_URL}/api/customers/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'SkillMesh Customer' }),
    });
    const regJson = await reg.json().catch(() => ({}));
    if (!reg.ok || !regJson.success) {
      throw new Error(regJson.error || 'Customer registration failed');
    }
    await SecureStore.setItemAsync('customerId', String(regJson.data.id));
    return;
  }
  const meJson = await me.json().catch(() => ({}));
  if (!me.ok || !meJson.success) {
    throw new Error(meJson.error || 'Could not load customer profile');
  }
  await SecureStore.setItemAsync('customerId', String(meJson.data.id));
}

export default function CustomerPhoneAuthScreen({ navigation }) {
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const otpRef = useRef(null);

  async function handleSendOTP() {
    if (phone.replace(/\D/g, '').length !== 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const e164 = toE164India(phone);
      const res = await fetch(`${API_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: e164 }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to send OTP');
      }
      setStep('otp');
      setTimeout(() => otpRef.current?.focus(), 200);
    } catch (e) {
      Alert.alert('OTP', e.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP() {
    const token = otp.replace(/\D/g, '');
    if (token.length !== 6) {
      setError('Enter the 6-digit OTP');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const e164 = toE164India(phone);
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: e164, token }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Invalid OTP');
      }
      const { access_token, refresh_token } = json.data;
      await saveSessionFromBackend({ access_token, refresh_token });
      await ensureCustomerRegistered(access_token);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e) {
      Alert.alert('Verify', e.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOutLocal() {
    await supabase.auth.signOut();
    await clearAuthStorage();
    navigation.reset({ index: 0, routes: [{ name: 'PhoneAuth' }] });
  }

  if (loading && step === 'phone') {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color="#6A1B9A" size="large" />
        <Text style={styles.loadingText}>Sending OTP...</Text>
      </View>
    );
  }

  if (loading && step === 'otp') {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color="#6A1B9A" size="large" />
        <Text style={styles.loadingText}>Verifying OTP...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Text style={styles.title}>SkillMesh Customer</Text>
        <Text style={styles.sub}>Sign in with your phone (Supabase SMS)</Text>

        <View style={styles.card}>
          {step === 'phone' && (
            <>
              <Text style={styles.label}>Mobile number</Text>
              <View style={styles.phoneRow}>
                <Text style={styles.cc}>🇮🇳 +91</Text>
                <TextInput
                  style={styles.phoneInput}
                  keyboardType="number-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={(t) => {
                    setPhone(t);
                    setError('');
                  }}
                />
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <TouchableOpacity
                style={[styles.btn, phone.replace(/\D/g, '').length !== 10 && styles.btnDisabled]}
                disabled={phone.replace(/\D/g, '').length !== 10}
                onPress={handleSendOTP}
              >
                <Text style={styles.btnText}>Send OTP</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'otp' && (
            <>
              <TouchableOpacity onPress={() => setStep('phone')}>
                <Text style={styles.link}>← Change number</Text>
              </TouchableOpacity>
              <Text style={styles.label}>6-digit OTP</Text>
              <TextInput
                ref={otpRef}
                style={styles.otp}
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <TouchableOpacity
                style={[styles.btn, otp.length !== 6 && styles.btnDisabled]}
                disabled={otp.length !== 6}
                onPress={handleVerifyOTP}
              >
                <Text style={styles.btnText}>Verify</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <TouchableOpacity onPress={handleSignOutLocal} style={{ marginTop: 24 }}>
          <Text style={styles.link}>Clear local session</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3E5F5' },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3E5F5' },
  loadingText: { marginTop: 12, color: '#555' },
  title: { fontSize: 26, fontWeight: '800', color: '#4A148C', textAlign: 'center' },
  sub: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8, marginBottom: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
  },
  label: { fontWeight: '700', color: '#333', marginBottom: 8 },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    marginBottom: 8,
  },
  cc: { paddingHorizontal: 12, paddingVertical: 14, backgroundColor: '#F5F5F5' },
  phoneInput: { flex: 1, padding: 14, fontSize: 16 },
  otp: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 14,
    fontSize: 22,
    letterSpacing: 6,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '700',
  },
  error: { color: '#C62828', marginBottom: 8 },
  btn: { backgroundColor: '#6A1B9A', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  btnDisabled: { backgroundColor: '#CE93D8' },
  btnText: { color: '#fff', fontWeight: '800' },
  link: { color: '#6A1B9A', fontWeight: '600', marginBottom: 12 },
});
