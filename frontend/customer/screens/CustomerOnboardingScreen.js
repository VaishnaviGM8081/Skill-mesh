import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { API_URL } from '../apiConfig';
import { getAuthHeaders } from '../lib/authFetch';
import * as SecureStore from 'expo-secure-store';

export default function CustomerOnboardingScreen({ navigation }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!name.trim() || !phone.trim() || !address.trim() || !pincode.trim()) {
      Alert.alert('Required Fields', 'Please fill in all mandatory fields.');
      return;
    }
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/api/customers/profile`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          pincode: pincode.trim(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Registration failed');
      }
      await SecureStore.setItemAsync('customerId', String(json.data.id));
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e) {
      Alert.alert('Register', e.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Welcome to SkillMesh</Text>
          <Text style={styles.sub}>Complete your profile to start booking services.</Text>

          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Priyan Sharma"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 9876543210"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={styles.label}>Full Address *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="House No, Street, Area..."
            multiline
            numberOfLines={3}
            value={address}
            onChangeText={setAddress}
          />

          <Text style={styles.label}>Pincode *</Text>
          <TextInput
            style={styles.input}
            placeholder="6-digit pincode"
            keyboardType="numeric"
            maxLength={6}
            value={pincode}
            onChangeText={setPincode}
          />

          <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Start Exploring</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3E5F5' },
  scroll: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '800', color: '#6A1B9A', marginBottom: 8 },
  sub: { fontSize: 14, color: '#666', marginBottom: 32, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  btn: {
    backgroundColor: '#6A1B9A',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
