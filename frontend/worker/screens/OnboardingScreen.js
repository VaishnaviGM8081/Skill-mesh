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
  { key: 'mechanic', label: 'Mechanic' },
  { key: 'ac_service', label: 'AC Service' },
];

export default function OnboardingScreen({ navigation }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [trade, setTrade] = useState('plumber');
  const [experience, setExperience] = useState('');
  const [pincode, setPincode] = useState('');
  const [skills, setSkills] = useState([]);
  const [currentSkill, setCurrentSkill] = useState('');
  const [loading, setLoading] = useState(false);

  const addSkill = () => {
    if (currentSkill.trim()) {
      setSkills([...skills, currentSkill.trim()]);
      setCurrentSkill('');
    }
  };

  const removeSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  async function handleSubmit() {
    if (!name.trim() || !phone.trim() || !experience.trim() || !pincode.trim()) {
      Alert.alert('Required Fields', 'Please fill in all mandatory fields.');
      return;
    }
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/api/workers/profile`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          trade_category: trade,
          years_experience: parseInt(experience),
          pincode: pincode.trim(),
          payment_preference: 'upi',
          availability_status: true,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Registration failed');
      }

      const workerId = json.data.id;

      // Add skills if any (assumes worker_skills table exists as before)
      for (const skill of skills) {
        await fetch(`${API_URL}/api/workers/skills`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            skill_name: skill,
            photo_url: null,
          }),
        });
      }

      await SecureStore.setItemAsync('workerId', String(workerId));
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
          <Text style={styles.title}>Complete Your Worker Profile</Text>
          <Text style={styles.sub}>Tell us about your expertise to start receiving jobs.</Text>

          {/* Section: Basic Info */}
          <Text style={styles.sectionHeader}>Basic Information</Text>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Rajesh Kumar"
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

          <Text style={styles.label}>Trade Category *</Text>
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

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.label}>Experience (Years) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 5"
                keyboardType="numeric"
                value={experience}
                onChangeText={setExperience}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Pincode *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 560034"
                keyboardType="numeric"
                maxLength={6}
                value={pincode}
                onChangeText={setPincode}
              />
            </View>
          </View>

          {/* Section: Skills Flow */}
          <Text style={styles.sectionHeader}>Skills & Specialties</Text>
          <Text style={styles.label}>Add specific skills (e.g. Pipe Fitting, Wiring)</Text>
          <View style={styles.skillInputRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Enter skill"
              value={currentSkill}
              onChangeText={setCurrentSkill}
            />
            <TouchableOpacity style={styles.addSkillBtn} onPress={addSkill}>
              <Text style={styles.addSkillBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.skillsList}>
            {skills.map((skill, index) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillTagText}>{skill}</Text>
                <TouchableOpacity onPress={() => removeSkill(index)}>
                  <Text style={styles.removeSkillText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Complete Registration</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  scroll: { padding: 24, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: '800', color: '#1A1A2E', marginBottom: 8 },
  sub: { fontSize: 14, color: '#666', marginBottom: 32, lineHeight: 20 },
  sectionHeader: { fontSize: 18, fontWeight: '700', color: '#1565C0', marginTop: 16, marginBottom: 16 },
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
  row: { flexDirection: 'row' },
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
  skillInputRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  addSkillBtn: {
    backgroundColor: '#1565C0',
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
  },
  addSkillBtnText: { color: '#fff', fontWeight: '700' },
  skillsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 },
  skillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  skillTagText: { color: '#4338CA', fontWeight: '600', marginRight: 8 },
  removeSkillText: { color: '#4338CA', fontWeight: '800' },
  btn: {
    backgroundColor: '#1565C0',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
