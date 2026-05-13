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

const TRADES = [
  { key: 'plumber', label: 'Plumber' },
  { key: 'electrician', label: 'Electrician' },
  { key: 'carpenter', label: 'Carpenter' },
  { key: 'painter', label: 'Painter' },
];

export default function OnboardingScreen({ navigation }) {
  const [name, setName] = useState('');
  const [trade, setTrade] = useState('plumber');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert('Profile', 'Please enter your name');
      return;
    }
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const latitude = 12.9352;
      const longitude = 77.6245;
      const res = await fetch(`${API_URL}/api/workers/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: name.trim(),
          trade_category: trade,
          latitude,
          longitude,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Registration failed');
      }
      await SecureStore.setItemAsync('workerId', String(json.data.id));
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
          <Text style={styles.title}>Complete worker profile</Text>
          <Text style={styles.sub}>We use your Supabase phone session and store your trade in SkillMesh.</Text>

          <Text style={styles.label}>Full name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Trade</Text>
          <View style={styles.tradeRow}>
            {TRADES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.tradeChip, trade === t.key && styles.tradeChipOn]}
                onPress={() => setTrade(t.key)}
              >
                <Text style={[styles.tradeChipText, trade === t.key && styles.tradeChipTextOn]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.hint}>Location defaults to Koramangala demo coordinates (same as backend seed).</Text>

          <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save & continue</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  scroll: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 },
  sub: { fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 20 },
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
  tradeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tradeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tradeChipOn: { backgroundColor: '#E3F2FD', borderColor: '#1565C0' },
  tradeChipText: { color: '#555', fontWeight: '600' },
  tradeChipTextOn: { color: '#1565C0' },
  hint: { fontSize: 12, color: '#888', marginBottom: 24 },
  btn: {
    backgroundColor: '#1565C0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
