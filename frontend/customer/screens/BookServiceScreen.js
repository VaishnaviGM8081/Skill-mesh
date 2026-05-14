import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView, TextInput, ActivityIndicator
} from 'react-native';
import { API_BASE_URL } from '../apiConfig';


export default function BookServiceScreen({ route, navigation }) {
  const service = route.params?.service || { name: 'Plumber', icon: '🔧' };
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(false);

  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [customerPincode, setCustomerPincode] = useState('560001');

  // Customer location state (lat/lng null means fallback to pincode matching)
  const customerLocation = { latitude: null, longitude: null, pincode: customerPincode };

  async function fetchMatchedWorkers(skillToMatch) {
    setIsLoadingWorkers(true);
    try {
      // Normalize skill to lowercase for API query (DB stores lowercase)
      const skillQuery = skillToMatch.toLowerCase();
      const rawRes = await fetch(
        `${API_BASE_URL}/api/jobs/match-workers?skill=${skillQuery}&pincode=${customerLocation.pincode}`,
        { method: 'GET' }
      );
      const res = await rawRes.json();
      if (res.success) {
        // trust_score in DB is 0-100, normalize to 0-1 first
        const mapped = res.workers.map(w => {
          const trustNorm = w.trust_score > 1 ? w.trust_score / 100 : w.trust_score;
          return {
            id: w.id,
            name: w.name,
            rating: (trustNorm * 5).toFixed(1),
            jobs: Math.floor(Math.random() * 100) + 10,
            distance: w.distance_km != null ? `${w.distance_km} km` : 'Nearby',
            price: '₹500',
            eta: w.distance_km != null ? `${Math.ceil(w.distance_km * 5 + 10)} min` : '~15 min',
            verified: trustNorm > 0.5,
            badge: w.match_score > 0.7 ? 'Best Match' : null,
          };
        });
        setWorkers(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch matched workers', err);
    } finally {
      setIsLoadingWorkers(false);
    }
  }

  // Fetch workers when screen loads, service changes, or pincode changes
  useEffect(() => {
    if (!isEditingLocation) {
      fetchMatchedWorkers(service.name);
    }
  }, [service.name, customerPincode, isEditingLocation]);

  useEffect(() => {
    if (description.length < 10) {
      setAnalysis(null);
      return;
    }
    const timer = setTimeout(async () => {
      setIsAnalyzing(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/jobs/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description })
        });
        const data = await res.json();
        if (data.success) {
          setAnalysis(data.data);
          // Auto-fetch new workers if NLP suggests a different skill
          if (data.data.skill && data.data.skill !== service.name) {
             fetchMatchedWorkers(data.data.skill);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [description]);

  function handleBook() {
    if (!selected) return;
    navigation.navigate('JobTracking', { worker: selected, service });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container}>

        {/* Back + Title */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{service.icon} {service.name}</Text>
        </View>

        {/* Description */}
        <Text style={styles.label}>Describe your problem</Text>
        <TextInput
          style={styles.textArea}
          placeholder="e.g. Pipe leaking under kitchen sink since morning..."
          placeholderTextColor="#aaa"
          multiline
          numberOfLines={3}
          value={description}
          onChangeText={setDescription}
        />

        {/* NLP Analysis Box */}
        {isAnalyzing && (
           <ActivityIndicator size="small" color="#1565C0" style={{ marginBottom: 10 }} />
        )}
        {analysis && !isAnalyzing && (
          <View style={styles.analysisBox}>
            <Text style={styles.analysisTitle}>✨ Detected Details</Text>
            <Text style={styles.analysisText}><Text style={{fontWeight:'700'}}>Skill:</Text> {analysis.skill}</Text>
            <Text style={styles.analysisText}><Text style={{fontWeight:'700'}}>Intent:</Text> {analysis.intent}</Text>
            <Text style={styles.analysisText}><Text style={{fontWeight:'700'}}>Urgency:</Text> {analysis.urgency}</Text>
          </View>
        )}

        {/* Location */}
        <Text style={styles.label}>Your location (Pincode)</Text>
        <View style={styles.locationBox}>
          <Text style={styles.locationIcon}>📍</Text>
          {isEditingLocation ? (
            <TextInput 
              style={[styles.locationText, { borderBottomWidth: 1, borderBottomColor: '#ccc', padding: 0 }]}
              value={customerPincode}
              onChangeText={setCustomerPincode}
              keyboardType="numeric"
              maxLength={6}
              autoFocus
            />
          ) : (
            <Text style={styles.locationText}>Pincode: {customerPincode}</Text>
          )}
          <TouchableOpacity onPress={() => setIsEditingLocation(!isEditingLocation)}>
            <Text style={styles.changeText}>{isEditingLocation ? 'Save' : 'Change'}</Text>
          </TouchableOpacity>
        </View>

        {/* AI Match Banner */}
        <View style={styles.aiBanner}>
          <Text style={styles.aiIcon}>🤖</Text>
          <Text style={styles.aiText}>AI matched 3 workers near you based on rating, distance and availability</Text>
        </View>

        {/* Worker List */}
        <Text style={styles.label}>Available Workers</Text>

        {isLoadingWorkers ? (
          <ActivityIndicator size="large" color="#1565C0" style={{ marginTop: 20 }} />
        ) : workers.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>No matching workers found near you.</Text>
        ) : (
          workers.map((worker) => (
            <TouchableOpacity
              key={worker.id}
              style={[styles.workerCard, selected?.id === worker.id && styles.workerSelected]}
              onPress={() => setSelected(worker)}
            >
              {worker.badge && (
                <View style={styles.topBadge}>
                  <Text style={styles.topBadgeText}>🏆 {worker.badge}</Text>
                </View>
              )}
              <View style={styles.workerRow}>
                <View style={styles.workerAvatar}>
                  <Text style={styles.workerAvatarText}>
                    {worker.name ? worker.name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'W'}
                  </Text>
                </View>
                <View style={styles.workerInfo}>
                  <View style={styles.workerNameRow}>
                    <Text style={styles.workerName}>{worker.name}</Text>
                    {worker.verified && <Text style={styles.verifiedBadge}>✓ Verified</Text>}
                  </View>
                  <Text style={styles.workerStats}>
                    ⭐ {worker.rating} · {worker.jobs} jobs · {worker.distance}
                  </Text>
                  <Text style={styles.workerEta}>🕐 Arrives in {worker.eta}</Text>
                </View>
                <View style={styles.workerPrice}>
                  <Text style={styles.priceText}>{worker.price}</Text>
                  <Text style={styles.priceLabel}>est.</Text>
                </View>
              </View>
              {selected?.id === worker.id && (
                <View style={styles.selectedTick}>
                  <Text style={styles.selectedTickText}>✓ Selected</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}

        {/* Book Button */}
        <TouchableOpacity
          style={[styles.bookButton, !selected && styles.bookButtonDisabled]}
          onPress={handleBook}
          disabled={!selected}
        >
          <Text style={styles.bookButtonText}>
            {selected ? `Book ${selected.name} →` : 'Select a worker to book'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24, marginTop: 10 },
  backBtn: { padding: 4 },
  backText: { fontSize: 15, color: '#1565C0', fontWeight: '500' },
  title: { fontSize: 20, fontWeight: '700', color: '#1A1A2E' },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  analysisBox: {
    backgroundColor: '#E8F5E9', borderRadius: 12, padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: '#C8E6C9'
  },
  analysisTitle: { fontSize: 14, fontWeight: '700', color: '#2E7D32', marginBottom: 8 },
  analysisText: { fontSize: 13, color: '#1B5E20', marginBottom: 4 },
  textArea: {
    backgroundColor: '#fff', borderRadius: 12,
    padding: 14, fontSize: 14, color: '#333',
    marginBottom: 20, elevation: 1,
    textAlignVertical: 'top', minHeight: 80,
  },
  locationBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12,
    padding: 14, marginBottom: 20, elevation: 1, gap: 10,
  },
  locationIcon: { fontSize: 16 },
  locationText: { flex: 1, fontSize: 13, color: '#333' },
  changeText: { fontSize: 13, color: '#1565C0', fontWeight: '600' },
  aiBanner: {
    backgroundColor: '#EDE7F6', borderRadius: 12,
    padding: 14, flexDirection: 'row',
    alignItems: 'center', marginBottom: 20, gap: 10,
  },
  aiIcon: { fontSize: 20 },
  aiText: { flex: 1, fontSize: 13, color: '#4527A0', lineHeight: 18 },
  workerCard: {
    backgroundColor: '#fff', borderRadius: 14,
    padding: 16, marginBottom: 12, elevation: 2,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  workerSelected: { borderColor: '#1565C0', backgroundColor: '#F0F4FF' },
  topBadge: {
    backgroundColor: '#FFF8E1', alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 20, marginBottom: 10,
  },
  topBadgeText: { fontSize: 11, color: '#F57F17', fontWeight: '600' },
  workerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  workerAvatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#1565C0',
    justifyContent: 'center', alignItems: 'center',
  },
  workerAvatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  workerInfo: { flex: 1 },
  workerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  workerName: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  verifiedBadge: {
    fontSize: 10, color: '#2E7D32',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10,
  },
  workerStats: { fontSize: 12, color: '#666', marginTop: 4 },
  workerEta: { fontSize: 12, color: '#1565C0', marginTop: 3 },
  workerPrice: { alignItems: 'flex-end' },
  priceText: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  priceLabel: { fontSize: 11, color: '#888' },
  selectedTick: {
    marginTop: 10, backgroundColor: '#E3F2FD',
    borderRadius: 8, padding: 6, alignItems: 'center',
  },
  selectedTickText: { fontSize: 13, color: '#1565C0', fontWeight: '600' },
  bookButton: {
    backgroundColor: '#1565C0', borderRadius: 14,
    padding: 18, alignItems: 'center', marginTop: 8,
  },
  bookButtonDisabled: { backgroundColor: '#B0BEC5' },
  bookButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});