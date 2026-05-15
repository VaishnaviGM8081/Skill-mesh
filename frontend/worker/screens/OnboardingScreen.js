import { useState, useEffect } from 'react';
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
import * as Location from 'expo-location';

const TRADES = [
  { key: 'plumber', label: '🔧 Plumber' },
  { key: 'electrician', label: '⚡ Electrician' },
  { key: 'carpenter', label: '🪵 Carpenter' },
  { key: 'painter', label: '🎨 Painter' },
  { key: 'ac_technician', label: '❄️ AC Tech' },
  { key: 'cleaner', label: '🧹 Cleaner' },
  { key: 'cook', label: '👨‍🍳 Cook' },
  { key: 'security', label: '🛡️ Security' },
  { key: 'driver', label: '🚗 Driver' },
  { key: 'gardener', label: '🌿 Gardener' },
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

  // Pre-fill phone if available
  useEffect(() => {
    async function prefill() {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/api/workers/me`, { headers });
        const json = await res.json();
        if (json.success && json.data?.phone) {
          setPhone(json.data.phone);
        }
      } catch (err) {
        console.log('Prefill error:', err);
      }
    }
    prefill();
  }, []);

  const addSkill = () => {
    if (currentSkill.trim()) {
      setSkills([...skills, currentSkill.trim()]);
      setCurrentSkill('');
    }
  };

  const removeSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };
  const verifyPincode = async (enteredPincode) => {
    try {
      console.log('Verifying Pincode:', enteredPincode);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return true; // Just allow if no permission (dev-friendly)

      // 1. Try last known position first (INSTANT)
      let location = await Location.getLastKnownPositionAsync({});
      
      // 2. If no last known, try a fast current position check (max 2 seconds)
      if (!location) {
        console.log('No last known location, trying fast fetch...');
        location = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
        ]).catch(() => null);
      }

      if (!location) {
        console.log('Location check skipped (too slow)');
        return true; 
      }

      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const detectedPincode = reverseGeocode[0].postalCode;
        console.log('Detected Pincode from GPS:', detectedPincode);

        if (!detectedPincode) {
           console.log('GPS found location but no pincode string');
           return true; // Fallback if GPS is working but postal code is missing in geo data
        }

        if (detectedPincode !== enteredPincode.trim()) {
          console.log('Pincode Mismatch! GPS:', detectedPincode, 'Entered:', enteredPincode);
          Alert.alert(
            'Location Mismatch',
            `You entered ${enteredPincode}, but your GPS says you are at ${detectedPincode}. Please enter your current location.`
          );
          return false;
        }

        return true;
      }

      console.log('Reverse geocode returned no results');
      return true; // Fallback: allow if GPS is active but geocoding fails (common in some areas)

    } catch (err) {
      console.error('Location verification error:', err);
      // In dev/test, we often want to allow registration even if GPS fails
      return true; 
    }
  };

  async function handleSubmit() {
    if (!name.trim() || !phone.trim() || !experience.trim() || !pincode.trim()) {
      Alert.alert('Required Fields', 'Please fill in all mandatory fields.');
      return;
    }
    setLoading(true);
    const verified =
      await verifyPincode(pincode);

    if (!verified) {
      setLoading(false);
      return;
    }
    try {
      console.log('Submitting profile for:', name);
      const headers = await getAuthHeaders();
      const body = {
        name: name.trim(),
        phone: phone.trim(),
        trade_category: trade,
        years_experience: parseInt(experience),
        pincode: pincode.trim(),
        payment_preference: 'upi',
        availability_status: true,
      };
      
      console.log('API Request Body:', JSON.stringify(body));

      const res = await fetch(`${API_URL}/api/workers/profile`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      console.log('API Response Status:', res.status);
      const json = await res.json().catch((err) => {
        console.log('JSON Parse Error:', err);
        return {};
      });

      if (!res.ok || !json.success) {
        console.log('Server returned error:', json);
        throw new Error(json.error || `Server error (${res.status})`);
      }

      const workerId = json.data.id;
      console.log('Worker registered successfully, ID:', workerId);

      await SecureStore.setItemAsync('workerId', String(workerId));
      
      Alert.alert('Success!', 'Registration complete. Welcome to SkillMesh!', [
        { text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Main' }] }) }
      ]);
    } catch (e) {
      console.error('Registration Exception:', e);
      Alert.alert('Registration Failed', e.message || 'Unknown network error. Please try again.');
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
