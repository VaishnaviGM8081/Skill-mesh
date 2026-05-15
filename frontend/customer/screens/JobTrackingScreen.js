import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Modal, TextInput,
  TouchableOpacity, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { API_BASE_URL } from '../apiConfig';

const STEPS = [
  { id: 1, label: 'Job Confirmed',    icon: '✅' },
  { id: 2, label: 'Worker Accepted',  icon: '👷' },
  { id: 3, label: 'On the Way',       icon: '🛵' },
  { id: 4, label: 'Job In Progress',  icon: '🔧' },
  { id: 5, label: 'Completed & Paid', icon: '💰' },
];

export default function JobTrackingScreen({ route, navigation }) {
  const jobId = route.params?.jobId;

  const [job, setJob]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Rating
  const [showRating, setShowRating]           = useState(false);
  const [selectedRating, setSelectedRating]   = useState(0);
  const [review, setReview]                   = useState('');
  const [submitting, setSubmitting]           = useState(false);
  const [rated, setRated]                     = useState(false);

  useEffect(() => {
    if (!jobId) { setLoading(false); return; }
    let timer;

    async function fetchJob() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const DEV_CUSTOMER_UID = '0ba38fa3-1ab4-405e-884d-1c43d3721680';
        const token = session?.access_token || DEV_CUSTOMER_UID;
        const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setJob(data.data);
          const s = data.data.status;
          if (s === 'completed' || s === 'cancelled') {
            clearInterval(timer);
            let hasRating = false;
            try {
              const reqs = JSON.parse(data.data.additional_requirements || '{}');
              if (reqs.customer_rating) hasRating = true;
            } catch (err) {}
            
            if (s === 'completed' && !hasRating && !rated) {
              setTimeout(() => setShowRating(true), 1500);
            }
          }
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }

    fetchJob();
    timer = setInterval(fetchJob, 5000);
    return () => clearInterval(timer);
  }, [jobId]);

  async function submitRating() {
    if (!selectedRating) return Alert.alert('Select a rating', 'Tap a star to rate.');
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const DEV_CUSTOMER_UID = '0ba38fa3-1ab4-405e-884d-1c43d3721680';
      const token = session?.access_token || DEV_CUSTOMER_UID;
      const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating: selectedRating, review: review.trim() || null }),
      });
      const data = await res.json();
      if (data.success) {
        setRated(true); setShowRating(false);
        Alert.alert('Thanks! ⭐', 'Your rating has been submitted.');
      } else {
        Alert.alert('Error', data.error || 'Could not submit rating.');
      }
    } catch { Alert.alert('Network Error', 'Could not submit rating.'); }
    finally { setSubmitting(false); }
  }

  const status = job?.status || 'pending';

  const displaySteps = STEPS.map(step => {
    if (status === 'pending')     return { ...step, done: step.id <= 1, active: step.id === 2 };
    if (status === 'in_progress') return { ...step, done: step.id <= 3, active: step.id === 4 };
    if (status === 'completed')   return { ...step, done: true,  active: false };
    if (status === 'cancelled')   return { ...step, done: false, active: false };
    return step;
  });

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1565C0" />
      </SafeAreaView>
    );
  }

  if (!jobId || !job) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center', padding: 40 }]}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>📋</Text>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 }}>No job found</Text>
        <Text style={{ fontSize: 14, color: '#888', textAlign: 'center' }}>Something went wrong loading this job.</Text>
        <TouchableOpacity style={[styles.rateBtn, { marginTop: 20 }]} onPress={() => navigation.goBack()}>
          <Text style={styles.rateBtnText}>← Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const RATING_LABELS = ['', 'Poor', 'Below Average', 'Good', 'Very Good', 'Excellent!'];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Job Tracking</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>

        {/* Status Card */}
        <View style={styles.etaCard}>
          <Text style={styles.etaLabel}>Status</Text>
          <Text style={styles.etaTime}>{status.replace('_', ' ').toUpperCase()}</Text>
          <Text style={styles.etaWorker}>
            {job.workers?.name || 'Worker'} · {job.workers?.trade_category || 'Service'}
          </Text>
        </View>

        {/* Map Placeholder */}
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapIcon}>🗺️</Text>
          <Text style={styles.mapText}>Live map tracking</Text>
          <Text style={styles.mapSub}>Worker location updates every 30 seconds</Text>
        </View>

        {/* Progress Steps */}
        <Text style={styles.sectionTitle}>Job Progress</Text>
        <View style={styles.stepsCard}>
          {displaySteps.map((step, i) => (
            <View key={step.id} style={styles.stepRow}>
              <View style={styles.stepLeft}>
                <View style={[styles.stepCircle, step.done && styles.stepDone, step.active && styles.stepActive]}>
                  <Text style={styles.stepIcon}>{step.icon}</Text>
                </View>
                {i < displaySteps.length - 1 && (
                  <View style={[styles.stepLine, step.done && styles.stepLineDone]} />
                )}
              </View>
              <Text style={[styles.stepLabel, step.done && styles.stepLabelDone, step.active && styles.stepLabelActive]}>
                {step.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Worker Card */}
        <Text style={styles.sectionTitle}>Your Worker</Text>
        <View style={styles.workerCard}>
          <View style={styles.workerAvatar}>
            <Text style={styles.workerAvatarText}>
              {(job.workers?.name || 'W').split(' ').map(n => n[0]).join('').slice(0, 2)}
            </Text>
          </View>
          <View style={styles.workerInfo}>
            <Text style={styles.workerName}>{job.workers?.name || 'Worker'}</Text>
            <Text style={styles.workerMeta}>
              ⭐ {job.workers?.average_rating || '—'} · Verified ✓
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.chatBtn} 
            onPress={() => navigation.navigate('Chat', { jobId: job.id, workerName: job.workers?.name })}
          >
            <Text style={{fontSize: 20}}>💬</Text>
          </TouchableOpacity>
        </View>

        {/* Escrow Banner */}
        <View style={styles.escrowBanner}>
          <Text style={styles.escrowIcon}>🔒</Text>
          <View>
            <Text style={styles.escrowTitle}>Payment Protected</Text>
            <Text style={styles.escrowSub}>
              ₹{job.amount || '—'} held in escrow · Released after job completion
            </Text>
          </View>
        </View>

        {/* Rate button (shows after completion) */}
        {status === 'completed' && !rated && (
          <TouchableOpacity style={styles.rateBtn} onPress={() => setShowRating(true)}>
            <Text style={styles.rateBtnText}>⭐  Rate Your Worker</Text>
          </TouchableOpacity>
        )}
        {rated && (
          <View style={styles.ratedBanner}>
            <Text style={styles.ratedText}>✅ Rating submitted. Thank you!</Text>
          </View>
        )}

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>← Back to Home</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Rating Modal ── */}
      <Modal visible={showRating} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Rate your worker</Text>
            <Text style={styles.modalSub}>{job.workers?.name || 'Worker'}</Text>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setSelectedRating(star)}>
                  <Text style={[styles.star, star <= selectedRating && styles.starSelected]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            {selectedRating > 0 && (
              <Text style={styles.ratingLabel}>{RATING_LABELS[selectedRating]}</Text>
            )}

            <TextInput
              style={styles.reviewInput}
              placeholder="Write a quick review (optional)"
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={3}
              value={review}
              onChangeText={setReview}
            />

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={submitRating}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitBtnText}>Submit Rating</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowRating(false)} style={{ marginTop: 14 }}>
              <Text style={{ textAlign: 'center', color: '#888', fontSize: 14 }}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  title: { fontSize: 22, fontWeight: '700', color: '#1A1A2E' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFEBEE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C62828' },
  liveText: { fontSize: 12, color: '#C62828', fontWeight: '600' },
  etaCard: { backgroundColor: '#1565C0', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16 },
  etaLabel: { fontSize: 14, color: '#90CAF9', marginBottom: 8 },
  etaTime: { fontSize: 28, fontWeight: '700', color: '#fff' },
  etaWorker: { fontSize: 13, color: '#BBDEFB', marginTop: 8 },
  mapPlaceholder: { backgroundColor: '#E8EAF6', borderRadius: 14, padding: 30, alignItems: 'center', marginBottom: 24 },
  mapIcon: { fontSize: 40, marginBottom: 8 },
  mapText: { fontSize: 15, fontWeight: '600', color: '#3949AB' },
  mapSub: { fontSize: 12, color: '#7986CB', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },
  stepsCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 24, elevation: 2 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, minHeight: 50 },
  stepLeft: { alignItems: 'center', width: 36 },
  stepCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  stepDone: { backgroundColor: '#E8F5E9' },
  stepActive: { backgroundColor: '#E3F2FD', borderWidth: 2, borderColor: '#1565C0' },
  stepIcon: { fontSize: 16 },
  stepLine: { width: 2, flex: 1, backgroundColor: '#F0F0F0', marginVertical: 2 },
  stepLineDone: { backgroundColor: '#A5D6A7' },
  stepLabel: { fontSize: 14, color: '#aaa', paddingTop: 8 },
  stepLabelDone: { color: '#2E7D32' },
  stepLabelActive: { color: '#1565C0', fontWeight: '600' },
  workerCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, elevation: 2 },
  workerAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#1565C0', justifyContent: 'center', alignItems: 'center' },
  workerAvatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  workerInfo: { flex: 1 },
  workerName: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  workerMeta: { fontSize: 12, color: '#666', marginTop: 3 },
  escrowBanner: { backgroundColor: '#F3E5F5', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  escrowIcon: { fontSize: 24 },
  escrowTitle: { fontSize: 14, fontWeight: '600', color: '#4A148C' },
  escrowSub: { fontSize: 12, color: '#7B1FA2', marginTop: 2 },
  rateBtn: { backgroundColor: '#FF6F00', borderRadius: 14, padding: 18, alignItems: 'center', marginBottom: 12 },
  rateBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  ratedBanner: { backgroundColor: '#E8F5E9', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  ratedText: { color: '#2E7D32', fontSize: 15, fontWeight: '600' },
  cancelBtn: { borderWidth: 1.5, borderColor: '#BBDEFB', borderRadius: 14, padding: 16, alignItems: 'center' },
  cancelText: { color: '#1565C0', fontSize: 15, fontWeight: '600' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A2E', textAlign: 'center', marginBottom: 4 },
  modalSub: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 8 },
  star: { fontSize: 44, color: '#E0E0E0' },
  starSelected: { color: '#FFA000' },
  ratingLabel: { textAlign: 'center', fontSize: 16, fontWeight: '600', color: '#FF6F00', marginBottom: 20 },
  reviewInput: { backgroundColor: '#F5F7FA', borderRadius: 12, padding: 14, fontSize: 14, color: '#333', marginBottom: 20, textAlignVertical: 'top', minHeight: 80 },
  submitBtn: { backgroundColor: '#1565C0', borderRadius: 14, padding: 18, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  chatBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E3F2FD'
  }
});
