import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, TextInput, KeyboardAvoidingView,
  Platform, ActivityIndicator
} from 'react-native';

export default function LoginScreen({ navigation }) {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'loading'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);

  function handleSendOTP() {
    if (phone.length !== 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setStep('loading');
    // Simulate API call delay
    setTimeout(() => setStep('otp'), 1500);
  }

  function handleOTPChange(value, index) {
    if (!/^\d*$/.test(value)) return; // only digits
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    // Auto-move to next box
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleOTPBackspace(e, index) {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleVerifyOTP() {
    const entered = otp.join('');
    if (entered.length !== 4) {
      setError('Enter the 4-digit OTP');
      return;
    }
    setError('');
    setStep('loading');
    // Simulate verification — accept any 4-digit OTP for demo
    setTimeout(() => {
      navigation.replace('Main');
    }, 1500);
  }

  function handleResend() {
    setOtp(['', '', '', '']);
    setError('');
    setStep('loading');
    setTimeout(() => setStep('otp'), 1500);
  }

  // ── Loading Screen ──
  if (step === 'loading') {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingLogo}>⚡</Text>
        <Text style={styles.loadingTitle}>SkillMesh</Text>
        <ActivityIndicator color="#1565C0" size="large" style={{ marginTop: 40 }} />
        <Text style={styles.loadingText}>
          {otp.join('').length === 4 ? 'Verifying OTP...' : 'Sending OTP...'}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>⚡</Text>
          </View>
          <Text style={styles.appName}>SkillMesh</Text>
          <Text style={styles.tagline}>Work. Earn. Grow.</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>

          {step === 'phone' && (
            <>
              <Text style={styles.cardTitle}>Enter your mobile number</Text>
              <Text style={styles.cardSub}>We'll send a 4-digit OTP to verify</Text>

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
                  onChangeText={text => {
                    setPhone(text);
                    setError('');
                  }}
                  autoFocus
                />
              </View>

              {error ? <Text style={styles.errorText}>⚠ {error}</Text> : null}

              <TouchableOpacity
                style={[styles.primaryBtn, phone.length !== 10 && styles.primaryBtnDisabled]}
                onPress={handleSendOTP}
                disabled={phone.length !== 10}
              >
                <Text style={styles.primaryBtnText}>Send OTP →</Text>
              </TouchableOpacity>

              <Text style={styles.disclaimer}>
                By continuing, you agree to SkillMesh's Terms of Service and Privacy Policy
              </Text>
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

              {/* OTP Boxes */}
              <View style={styles.otpRow}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={ref => inputRefs.current[index] = ref}
                    style={[styles.otpBox, digit && styles.otpBoxFilled]}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    onChangeText={val => handleOTPChange(val, index)}
                    onKeyPress={e => handleOTPBackspace(e, index)}
                    autoFocus={index === 0}
                    selectTextOnFocus
                  />
                ))}
              </View>

              {error ? <Text style={styles.errorText}>⚠ {error}</Text> : null}

              {/* Demo hint */}
              <View style={styles.demoHint}>
                <Text style={styles.demoHintText}>💡 Demo: enter any 4 digits</Text>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, otp.join('').length !== 4 && styles.primaryBtnDisabled]}
                onPress={handleVerifyOTP}
                disabled={otp.join('').length !== 4}
              >
                <Text style={styles.primaryBtnText}>Verify & Continue →</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleResend} style={styles.resendRow}>
                <Text style={styles.resendText}>Didn't receive OTP? </Text>
                <Text style={styles.resendLink}>Resend</Text>
              </TouchableOpacity>
            </>
          )}

        </View>

        {/* Worker types */}
        <View style={styles.workerTypes}>
          {['🔧 Plumber', '⚡ Electrician', '🪚 Carpenter', '🚗 Driver'].map((w, i) => (
            <View key={i} style={styles.workerChip}>
              <Text style={styles.workerChipText}>{w}</Text>
            </View>
          ))}
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4FF' },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  loadingScreen: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', backgroundColor: '#F0F4FF',
  },
  loadingLogo: { fontSize: 48 },
  loadingTitle: { fontSize: 28, fontWeight: '700', color: '#1565C0', marginTop: 8 },
  loadingText: { fontSize: 14, color: '#888', marginTop: 16 },
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoBox: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#1565C0',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  logoIcon: { fontSize: 36 },
  appName: { fontSize: 30, fontWeight: '700', color: '#1565C0' },
  tagline: { fontSize: 14, color: '#888', marginTop: 4 },
  card: {
    backgroundColor: '#fff', borderRadius: 20,
    padding: 24, elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A2E', marginBottom: 6 },
  cardSub: { fontSize: 14, color: '#888', marginBottom: 24, lineHeight: 20 },
  phoneRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E0E0E0',
    borderRadius: 12, marginBottom: 8, overflow: 'hidden',
  },
  countryCode: {
    backgroundColor: '#F5F5F5', paddingHorizontal: 14,
    paddingVertical: 14, borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  countryCodeText: { fontSize: 14, fontWeight: '600', color: '#333' },
  phoneInput: {
    flex: 1, paddingHorizontal: 14,
    paddingVertical: 14, fontSize: 16,
    color: '#1A1A2E', letterSpacing: 1,
  },
  errorText: { fontSize: 13, color: '#C62828', marginBottom: 12 },
  primaryBtn: {
    backgroundColor: '#1565C0', borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 8,
  },
  primaryBtnDisabled: { backgroundColor: '#B0BEC5' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disclaimer: {
    fontSize: 11, color: '#bbb', textAlign: 'center',
    marginTop: 16, lineHeight: 16,
  },
  backRow: { marginBottom: 16 },
  backText: { fontSize: 13, color: '#1565C0', fontWeight: '500' },
  otpRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: 8, gap: 12,
  },
  otpBox: {
    flex: 1, height: 60, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E0E0E0',
    textAlign: 'center', fontSize: 24,
    fontWeight: '700', color: '#1A1A2E',
    backgroundColor: '#FAFAFA',
  },
  otpBoxFilled: { borderColor: '#1565C0', backgroundColor: '#F0F4FF' },
  demoHint: {
    backgroundColor: '#FFF8E1', borderRadius: 8,
    padding: 8, alignItems: 'center', marginBottom: 16,
  },
  demoHintText: { fontSize: 12, color: '#F57F17' },
  resendRow: {
    flexDirection: 'row', justifyContent: 'center',
    marginTop: 16, alignItems: 'center',
  },
  resendText: { fontSize: 13, color: '#888' },
  resendLink: { fontSize: 13, color: '#1565C0', fontWeight: '600' },
  workerTypes: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: 8, marginTop: 24,
  },
  workerChip: {
    backgroundColor: '#fff', paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 20,
    borderWidth: 0.5, borderColor: '#E0E0E0',
  },
  workerChipText: { fontSize: 12, color: '#666' },
});