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
import { API_URL } from '../apiConfig';
import { saveSessionFromBackend } from '../lib/authSession';
import * as SecureStore from 'expo-secure-store';

function toE164India(phoneDigits) {
  const d = phoneDigits.replace(/\D/g, '');
  if (d.length === 10) return `+91${d}`;
  if (d.startsWith('91') && d.length === 12) return `+${d}`;
  return d.startsWith('+') ? d : `+${d}`;
}

export default function PhoneAuthScreen({ navigation }) {
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

      const me = await fetch(`${API_URL}/api/workers/me`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      if (me.status === 404) {
        await SecureStore.deleteItemAsync('workerId');
        navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
      } else {
        const meJson = await me.json();
        if (meJson?.data?.id != null) {
          await SecureStore.setItemAsync('workerId', String(meJson.data.id));
        }
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      }
    } catch (e) {
      Alert.alert('Verify', e.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  if (loading && step === 'phone') {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingLogo}>⚡</Text>
        <Text style={styles.loadingTitle}>SkillMesh</Text>
        <ActivityIndicator color="#1565C0" size="large" style={{ marginTop: 40 }} />
        <Text style={styles.loadingText}>Sending OTP...</Text>
      </View>
    );
  }

  if (loading && step === 'otp') {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingLogo}>⚡</Text>
        <Text style={styles.loadingTitle}>SkillMesh</Text>
        <ActivityIndicator color="#1565C0" size="large" style={{ marginTop: 40 }} />
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
        <View style={styles.logoSection}>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>⚡</Text>
          </View>
          <Text style={styles.appName}>SkillMesh</Text>
          <Text style={styles.tagline}>Worker · Phone sign-in</Text>
        </View>

        <View style={styles.card}>
          {step === 'phone' && (
            <>
              <Text style={styles.cardTitle}>Enter your mobile number</Text>
              <Text style={styles.cardSub}>We will send a 6-digit OTP (SMS via Supabase)</Text>

              <View style={styles.phoneRow}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="98765 43210"
                  placeholderTextColor="#bbb"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={(t) => {
                    setPhone(t);
                    setError('');
                  }}
                  autoFocus
                />
              </View>

              {error ? <Text style={styles.errorText}>⚠ {error}</Text> : null}

              <TouchableOpacity
                style={[styles.primaryBtn, phone.replace(/\D/g, '').length !== 10 && styles.primaryBtnDisabled]}
                onPress={handleSendOTP}
                disabled={phone.replace(/\D/g, '').length !== 10}
              >
                <Text style={styles.primaryBtnText}>Send OTP →</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'otp' && (
            <>
              <TouchableOpacity onPress={() => setStep('phone')} style={styles.backRow}>
                <Text style={styles.backText}>← Change number</Text>
              </TouchableOpacity>

              <Text style={styles.cardTitle}>Verify OTP</Text>
              <Text style={styles.cardSub}>
                Sent to +91 {phone.slice(0, 5)} {phone.slice(5)}
              </Text>

              <TextInput
                ref={otpRef}
                style={styles.otpInput}
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={(t) => {
                  setOtp(t.replace(/\D/g, '').slice(0, 6));
                  setError('');
                }}
                placeholder="••••••"
                placeholderTextColor="#ccc"
              />

              {error ? <Text style={styles.errorText}>⚠ {error}</Text> : null}

              <TouchableOpacity
                style={[styles.primaryBtn, otp.length !== 6 && styles.primaryBtnDisabled]}
                onPress={handleVerifyOTP}
                disabled={otp.length !== 6}
              >
                <Text style={styles.primaryBtnText}>Verify & Continue →</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4FF' },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
  },
  loadingLogo: { fontSize: 48 },
  loadingTitle: { fontSize: 28, fontWeight: '700', color: '#1565C0', marginTop: 8 },
  loadingText: { fontSize: 14, color: '#888', marginTop: 16 },
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#1565C0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoIcon: { fontSize: 36 },
  appName: { fontSize: 30, fontWeight: '700', color: '#1565C0' },
  tagline: { fontSize: 14, color: '#888', marginTop: 4 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A2E', marginBottom: 6 },
  cardSub: { fontSize: 14, color: '#888', marginBottom: 24, lineHeight: 20 },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  countryCode: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  countryCodeText: { fontSize: 14, fontWeight: '600', color: '#333' },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A2E',
    letterSpacing: 1,
  },
  errorText: { fontSize: 13, color: '#C62828', marginBottom: 12 },
  primaryBtn: {
    backgroundColor: '#1565C0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnDisabled: { backgroundColor: '#B0BEC5' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backRow: { marginBottom: 16 },
  backText: { fontSize: 13, color: '#1565C0', fontWeight: '500' },
  otpInput: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '700',
    color: '#1A1A2E',
  },
});
