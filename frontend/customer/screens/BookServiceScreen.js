import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Audio } from 'expo-av';

import { API_BASE_URL } from '../apiConfig';
import { supabase } from '../lib/supabase';

// Smart keyword-based category detection
const detectCategory = (text) => {
  const input = text.toLowerCase();

  // Electrician
  if (
    input.includes('bulb') ||
    input.includes('light') ||
    input.includes('switch') ||
    input.includes('fan') ||
    input.includes('wire') ||
    input.includes('wiring') ||
    input.includes('electric') ||
    input.includes('power') ||
    input.includes('socket')
  ) {
    return 'Electrician';
  }

  // Plumber
  if (
    input.includes('pipe') ||
    input.includes('tap') ||
    input.includes('water') ||
    input.includes('leak') ||
    input.includes('drain') ||
    input.includes('sink') ||
    input.includes('toilet')
  ) {
    return 'Plumber';
  }

  // Carpenter
  if (
    input.includes('wood') ||
    input.includes('door') ||
    input.includes('chair') ||
    input.includes('table') ||
    input.includes('furniture') ||
    input.includes('cupboard')
  ) {
    return 'Carpenter';
  }

  return null;
};

export default function BookServiceScreen({ route, navigation }) {
  const service = route.params?.service || {
    name: 'Plumber',
    icon: '🔧',
  };

  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [image, setImage] = useState(null);
  const [suggestedPrice, setSuggestedPrice] = useState(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const [workers, setWorkers] = useState([]);
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(false);

  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [customerPincode, setCustomerPincode] = useState('560059');

  // Customer location state
  const customerLocation = {
    latitude: null,
    longitude: null,
    pincode: customerPincode,
  };

  async function startRecording() {
    try {
      if (recording) {
        try { await recording.stopAndUnloadAsync(); } catch (e) {}
        setRecording(null);
      }
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone access to use voice search.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: newRec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(newRec);
      setIsRecording(true);
    } catch (err) { console.error('Failed to start recording', err); }
  }

  async function stopRecording() {
    setIsRecording(false);
    if (!recording) return;
    
    let uri;
    try {
      await recording.stopAndUnloadAsync();
      uri = recording.getURI();
    } catch (e) {
      console.log('Safe unload failed:', e);
    }
    
    setRecording(null);
    if (!uri) return;

    try {
      setIsTranscribing(true);
      const formData = new FormData();
      formData.append('audio', { uri, name: 'audio.m4a', type: 'audio/m4a' });
      
      console.log('Transcribing audio from URI:', uri);
      const res = await fetch(`${API_BASE_URL}/api/jobs/transcribe`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const data = await res.json();
      console.log('Transcribe response:', data);
      
      if (data.success) {
        if (data.text && data.text.trim().length > 0) {
          setDescription(data.text);
        } else {
          Alert.alert('No Speech Detected', 'We couldn\'t hear anything. Please try speaking louder or closer to the mic.');
        }
      } else {
        const errorMsg = data.error || 'Transcription failed on server';
        console.error('Transcription error:', errorMsg);
        Alert.alert('Transcription Error', errorMsg);
      }
    } catch (err) {
      console.error('Transcription Network Error:', err);
      Alert.alert('Transcription Error', 'Network failed: ' + err.message);
    } finally {
      setIsTranscribing(false);
    }
  }

  async function fetchMatchedWorkers(skillToMatch) {
    setIsLoadingWorkers(true);

    try {
      const skillQuery = skillToMatch.toLowerCase();
      const url = `${API_BASE_URL}/api/jobs/match-workers?skill=${skillQuery}&pincode=${customerLocation.pincode}`;
      console.log('Fetching workers from:', url);

      const rawRes = await fetch(url).catch(err => {
        throw new Error(`Connection failed! Check Wi-Fi or IP: ${API_BASE_URL}`);
      });

      if (!rawRes.ok) throw new Error(`Server Error: ${rawRes.status}`);
      
      const res = await rawRes.json();
      const workersList = res.workers || res.data || [];
      console.log('Found workers:', workersList.length);

      if (workersList.length > 0) {
        const mapped = workersList.map((w) => {
          // ── Realistic price by trade + experience ──────────────────────────
          const BASE_RATES = {
            plumber: { base: 300, perYear: 30 },
            electrician: { base: 350, perYear: 35 },
            carpenter: { base: 400, perYear: 40 },
            painter: { base: 250, perYear: 25 },
            ac_technician: { base: 500, perYear: 50 },
            cleaner: { base: 200, perYear: 15 },
            cook: { base: 300, perYear: 25 },
            gardener: { base: 200, perYear: 20 },
            driver: { base: 250, perYear: 20 },
            security: { base: 300, perYear: 15 },
          };
          const trade = w.trade_category?.toLowerCase() || 'plumber';
          const rate = BASE_RATES[trade] || { base: 300, perYear: 25 };
          // Add experience premium + small unique variance per worker id
          const workerId = Number(w.id) || 1;
          const variance = (workerId % 5) * 25; // 0, 25, 50, 75, or 100
          const exp = Number(w.years_experience) || 1;

          const rawPrice =
            rate.base +
            (exp * rate.perYear) +
            variance;
          // Round to nearest ₹50 for clean look
          const price = `₹${Math.round(rawPrice / 50) * 50}`;

          // ── Realistic ETA based on real distance + traffic jitter ──────────
          let eta;
          if (w.distance_km != null) {
            // Bengaluru avg speed ~18 km/h in traffic
            const driveMin = Math.ceil((w.distance_km / 18) * 60);
            // Add 5-20 min prep time (varies by worker id for consistency)
            const prepTime = 5 + (w.id % 16);
            const totalMin = driveMin + prepTime;
            eta = totalMin < 60
              ? `${totalMin} min`
              : `${Math.floor(totalMin / 60)}h ${totalMin % 60}m`;
          } else {
            // No location data — show a reasonable range
            const baseMin = 20 + (w.id % 25);
            eta = `${baseMin}–${baseMin + 15} min`;
          }

          // ── Real rating from DB (fallback: derive from trust) ─────────────
          const trustNorm = w.trust_score > 1 ? w.trust_score : w.trust_score * 100;
          const rating = w.average_rating != null
            ? Number(w.average_rating).toFixed(1)
            : (trustNorm * 0.05).toFixed(1); // trust 0-100 → 0.0-5.0

          // ── Real job count from DB ─────────────────────────────────────────
          const jobs = w.total_jobs != null
            ? w.total_jobs
            : Math.floor(trustNorm * 1.5); // estimate from trust if missing

          // ── Distance display ──────────────────────────────────────────────
          const distance = w.distance_km != null ? `${w.distance_km} km` : 'Nearby';

          return {
            id: w.id,
            name: w.name,
            rating,
            jobs,
            distance,
            price,
            eta,
            verified: trustNorm > 50,
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

  // Fetch workers on load
  useEffect(() => {
    if (!isEditingLocation) {
      fetchMatchedWorkers(service.name);
    }
  }, [service.name, customerPincode, isEditingLocation]);

  // NLP + Smart Category Detection
  useEffect(() => {
    if (description.length < 5) {
      setAnalysis(null);
      setSuggestedPrice(null);
      return;
    }

    const timer = setTimeout(async () => {
      // 1. Local category detection
      const localSkill = detectCategory(description);

      // 2. Call ML Service for NLP Analysis & Price Suggestion
      setIsAnalyzing(true);
      try {
        // NLP Analysis
        const res = await fetch(
          `${API_BASE_URL}/api/jobs/analyze`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ description }),
          }
        );

        const data = await res.json();

        // Price Suggestion
        const priceRes = await fetch(
          `${API_BASE_URL}/api/jobs/price-suggestion`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              category: localSkill || data.data?.skill || service.name, 
              description 
            }),
          }
        );
        const priceData = await priceRes.json();
        setSuggestedPrice(priceData);

        if (data.success) {
          // Prefer local detection if available
          const finalSkill =
            localSkill || data.data.skill;

          const updatedAnalysis = {
            ...data.data,
            skill: finalSkill,
          };

          setAnalysis(updatedAnalysis);

          // Fetch correct workers
          if (
            finalSkill &&
            finalSkill !== service.name
          ) {
            fetchMatchedWorkers(finalSkill);
          }
        }
      } catch (err) {
        console.error('NLP Analysis Error:', err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [description]);

  const [isBooking, setIsBooking] = useState(false);

  const uploadImage = async (uri) => {
    try {
      const fileName = `${Date.now()}.jpg`;
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: fileName,
        type: 'image/jpeg',
      });

      const { data, error } = await supabase.storage
        .from('job-photos')
        .upload(`problems/${fileName}`, formData, {
          contentType: 'image/jpeg',
        });

      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('job-photos')
        .getPublicUrl(`problems/${fileName}`);

      return publicUrl;
    } catch (error) {
      console.error('Image upload failed:', error);
      return null;
    }
  };

  async function handleBook() {
    if (!selected) return;
    setIsBooking(true);
    try {
      // 1. Upload photo if exists
      let photoUrl = null;
      if (image) {
        photoUrl = await uploadImage(image);
      }

      // ── Get Supabase session token (Customer App uses Supabase auth) ──
      const { data: { session } } = await supabase.auth.getSession();

      // DEV MODE BYPASS: If no session exists, use the DEV customer token
      const DEV_CUSTOMER_UID = '0ba38fa3-1ab4-405e-884d-1c43d3721680';
      const token = session?.access_token || DEV_CUSTOMER_UID;

      // ── Ensure customer record exists in DB ──────────────────────────
      const ensureRes = await fetch(`${API_BASE_URL}/api/customers/ensure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          phone: session?.user?.phone || session?.user?.email || 'guest-user',
        }),
      });
      // Non-blocking — if this endpoint doesn't exist yet, we proceed anyway
      if (!ensureRes.ok) console.warn('Customer ensure endpoint not available, proceeding...');

      const rawPrice = selected.price?.replace(/[₹,]/g, '') || '0';

      const res = await fetch(`${API_BASE_URL}/api/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          worker_id: selected.id,
          pincode: customerPincode,
          notes: description || null,
          amount: parseInt(rawPrice, 10) || null,
          trade_category: service.name.toLowerCase(),
          problem_photo_url: photoUrl,
        }),
      });

      let data;

      try {
        data = await res.json();
      } catch (e) {
        Alert.alert('Booking Failed', 'Invalid backend response');
        return;
      }

      if (!data.success) {
        Alert.alert(
          'Booking Failed',
          data.error || 'Could not create job. Please try again.'
        );
        return;
      }

      navigation.navigate('JobTracking', {
        jobId: data.data.id,
        worker: selected,
        service,
      });
    } catch (err) {
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
      console.error('Booking error:', err);
    } finally {
      setIsBooking(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>
            {service.icon} {service.name}
          </Text>
        </View>

        {/* Description */}
        <Text style={styles.label}>
          Describe your problem
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Or type the problem here..."
            placeholderTextColor="#94a3b8"
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        <TouchableOpacity 
          style={[styles.photoButton, image && styles.photoButtonActive]} 
          onPress={pickImage}
        >
          <Text style={{fontSize: 24}}>📷</Text>
          <Text style={[styles.photoButtonText, image && {color: '#10b981'}]}>
            {image ? "Photo Added!" : "Add Photo of Problem"}
          </Text>
        </TouchableOpacity>

        {image && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: image }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.removeImage} onPress={() => setImage(null)}>
              <Text style={{color: 'white', fontWeight: 'bold'}}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            style={[styles.textArea, { flex: 1, marginRight: 10 }]}
            placeholder="e.g. Bulb not working in bedroom..."
            placeholderTextColor="#aaa"
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
          />
          <TouchableOpacity 
            style={[styles.micBtn, isRecording && styles.micBtnActive]} 
            onPress={isRecording ? stopRecording : startRecording}
          >
            {isTranscribing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.micIcon}>{isRecording ? '⏹️' : '🎙️'}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* NLP Analysis */}
        {isAnalyzing && (
          <ActivityIndicator
            size="small"
            color="#1565C0"
            style={{ marginBottom: 10 }}
          />
        )}

        {analysis && !isAnalyzing && (
          <View style={styles.analysisBox}>
            <Text style={styles.analysisTitle}>
              ✨ Detected Details
            </Text>

            <Text style={styles.analysisText}>
              <Text style={{ fontWeight: '700' }}>
                Skill:
              </Text>{' '}
              {analysis.skill}
            </Text>

            <Text style={styles.analysisText}>
              <Text style={{ fontWeight: '700' }}>
                Intent:
              </Text>{' '}
              {analysis.intent}
            </Text>

            <Text style={styles.analysisText}>
              <Text style={{ fontWeight: '700' }}>
                Urgency:
              </Text>{' '}
              {analysis.urgency}
            </Text>
          </View>
        )}

        {suggestedPrice && (
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>
              💡 Suggested Price: ₹{suggestedPrice.suggested_min} - ₹{suggestedPrice.suggested_max}
            </Text>
            <Text style={styles.priceBadgeSub}>
              {suggestedPrice.note}
            </Text>
          </View>
        )}

        {/* Location */}
        <Text style={styles.label}>
          Your location (Pincode)
        </Text>

        <View style={styles.locationBox}>
          <Text style={styles.locationIcon}>📍</Text>

          {isEditingLocation ? (
            <TextInput
              style={[
                styles.locationText,
                {
                  borderBottomWidth: 1,
                  borderBottomColor: '#ccc',
                  padding: 0,
                },
              ]}
              value={customerPincode}
              onChangeText={setCustomerPincode}
              keyboardType="numeric"
              maxLength={6}
              autoFocus
            />
          ) : (
            <Text style={styles.locationText}>
              Pincode: {customerPincode}
            </Text>
          )}

          <TouchableOpacity
            onPress={() =>
              setIsEditingLocation(!isEditingLocation)
            }
          >
            <Text style={styles.changeText}>
              {isEditingLocation ? 'Save' : 'Change'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* AI Banner */}
        <View style={styles.aiBanner}>
          <Text style={styles.aiIcon}>🤖</Text>

          <Text style={styles.aiText}>
            AI matched workers near you based on
            skill, distance and availability
          </Text>
        </View>

        {/* Workers */}
        <Text style={styles.label}>
          Available Workers
        </Text>

        {isLoadingWorkers ? (
          <ActivityIndicator
            size="large"
            color="#1565C0"
            style={{ marginTop: 20 }}
          />
        ) : workers.length === 0 ? (
          <Text
            style={{
              textAlign: 'center',
              marginTop: 20,
              color: '#666',
            }}
          >
            No matching workers found near you.
          </Text>
        ) : (
          workers.map((worker) => (
            <TouchableOpacity
              key={worker.id}
              style={[
                styles.workerCard,
                selected?.id === worker.id &&
                styles.workerSelected,
              ]}
              onPress={() => setSelected(worker)}
            >
              {worker.badge && (
                <View style={styles.topBadge}>
                  <Text style={styles.topBadgeText}>
                    🏆 {worker.badge}
                  </Text>
                </View>
              )}

              <View style={styles.workerRow}>

                <View style={styles.workerAvatar}>
                  <Text style={styles.workerAvatarText}>
                    {worker.name
                      ? worker.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                      : 'W'}
                  </Text>
                </View>

                <View style={styles.workerInfo}>
                  <View style={styles.workerNameRow}>
                    <Text style={styles.workerName}>
                      {worker.name}
                    </Text>

                    {worker.verified && (
                      <Text style={styles.verifiedBadge}>
                        ✓ Verified
                      </Text>
                    )}
                  </View>

                  <Text style={styles.workerStats}>
                    ⭐ {worker.rating} ·{' '}
                    {worker.jobs} jobs ·{' '}
                    {worker.distance}
                  </Text>

                  <Text style={styles.workerEta}>
                    🕐 Arrives in {worker.eta}
                  </Text>
                </View>

                <View style={styles.workerPrice}>
                  <Text style={styles.priceText}>
                    {worker.price}
                  </Text>

                  <Text style={styles.priceLabel}>
                    est.
                  </Text>
                </View>
              </View>

              {selected?.id === worker.id && (
                <View style={styles.selectedTick}>
                  <Text style={styles.selectedTickText}>
                    ✓ Selected
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}

        {/* Book Button */}
        <TouchableOpacity
          style={[styles.bookButton, (!selected || isBooking) && styles.bookButtonDisabled]}
          onPress={handleBook}
          disabled={!selected || isBooking}
        >
          {isBooking
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.bookButtonText}>
              {selected ? `Book ${selected.name} →` : 'Select a worker to book'}
            </Text>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  container: {
    flex: 1,
    padding: 20,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
    marginTop: 10,
  },

  backBtn: {
    padding: 4,
  },

  backText: {
    fontSize: 15,
    color: '#1565C0',
    fontWeight: '500',
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },

  textArea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#333',
    marginBottom: 20,
    elevation: 1,
    textAlignVertical: 'top',
    minHeight: 80,
  },

  analysisBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },

  analysisTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 8,
  },

  analysisText: {
    fontSize: 13,
    color: '#1B5E20',
    marginBottom: 4,
  },

  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    elevation: 1,
    gap: 10,
  },

  locationIcon: {
    fontSize: 16,
  },

  locationText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },

  changeText: {
    fontSize: 13,
    color: '#1565C0',
    fontWeight: '600',
  },

  aiBanner: {
    backgroundColor: '#EDE7F6',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },

  aiIcon: {
    fontSize: 20,
  },

  aiText: {
    flex: 1,
    fontSize: 13,
    color: '#4527A0',
    lineHeight: 18,
  },

  workerCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },

  workerSelected: {
    borderColor: '#1565C0',
    backgroundColor: '#F0F4FF',
  },

  topBadge: {
    backgroundColor: '#FFF8E1',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 10,
  },

  topBadgeText: {
    fontSize: 11,
    color: '#F57F17',
    fontWeight: '600',
  },

  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  workerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1565C0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  workerAvatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  workerInfo: {
    flex: 1,
  },

  workerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  workerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
  },

  verifiedBadge: {
    fontSize: 10,
    color: '#2E7D32',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },

  workerStats: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },

  workerEta: {
    fontSize: 12,
    color: '#1565C0',
    marginTop: 3,
  },

  workerPrice: {
    alignItems: 'flex-end',
  },

  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
  },

  priceLabel: {
    fontSize: 11,
    color: '#888',
  },

  selectedTick: {
    marginTop: 10,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
  },

  selectedTickText: {
    fontSize: 13,
    color: '#1565C0',
    fontWeight: '600',
  },

  bookButton: {
    backgroundColor: '#1565C0',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },

  bookButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },

  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  micBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1565C0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  micBtnActive: {
    backgroundColor: '#d32f2f',
    transform: [{ scale: 1.1 }],
  },
  micIcon: {
    fontSize: 24,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 10,
  },
  photoButtonActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  photoButtonText: {
    color: '#8b5cf6',
    fontWeight: '600',
    fontSize: 16,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  removeImage: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceBadge: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#ffedd5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    flexDirection: 'column',
  },
  priceBadgeText: {
    color: '#9a3412',
    fontWeight: '700',
    fontSize: 14,
  },
  priceBadgeSub: {
    color: '#c2410c',
    fontSize: 11,
    marginTop: 2,
    fontStyle: 'italic',
  },
});