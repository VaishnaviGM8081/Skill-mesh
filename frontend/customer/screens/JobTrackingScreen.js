import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView
} from 'react-native';
import { API_BASE_URL } from '../apiConfig';

const steps = [
  { id: 1, label: 'Job Confirmed', icon: '✅', done: true },
  { id: 2, label: 'Worker Accepted', icon: '👷', done: true },
  { id: 3, label: 'Worker On the Way', icon: '🛵', done: false, active: true },
  { id: 4, label: 'Job In Progress', icon: '🔧', done: false },
  { id: 5, label: 'Completed & Paid', icon: '💰', done: false },
];
export default function JobTrackingScreen({ route, navigation }) {
  const jobId = route.params?.jobId;
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJobStatus() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`);
        const data = await res.json();
        if (data.success) {
          setJob(data.data);
          if (data.data.status === 'completed' || data.data.status === 'cancelled') {
            clearInterval(timer);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchJobStatus();
    const timer = setInterval(fetchJobStatus, 5000);
    return () => clearInterval(timer);
  }, [jobId]);

  const currentStatus = job?.status || 'pending';
  const displaySteps = steps.map(step => {
    if (currentStatus === 'pending') return { ...step, done: step.id <= 1, active: step.id === 2 };
    if (currentStatus === 'in_progress') return { ...step, done: step.id <= 3, active: step.id === 4 };
    if (currentStatus === 'completed') return { ...step, done: true, active: false };
    return step;
  });

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

        {/* ETA Card */}
        <View style={styles.etaCard}>
          <Text style={styles.etaLabel}>Status</Text>
          <Text style={styles.etaTime}>{currentStatus.toUpperCase()}</Text>
          <Text style={styles.etaWorker}>{job?.workers?.name || 'Worker'} · {job?.workers?.trade_category || 'Service'}</Text>
        </View>

        {/* Map Placeholder */}
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapIcon}>🗺️</Text>
          <Text style={styles.mapText}>Live map tracking</Text>
          <Text style={styles.mapSub}>Worker location updates every 30 seconds</Text>
        </View>

        {/* Progress Steps */}
        <Text style={styles.sectionTitle}>Job Status</Text>
        <View style={styles.stepsCard}>
          {displaySteps.map((step, index) => (
            <View key={step.id} style={styles.stepRow}>
              <View style={styles.stepLeft}>
                <View style={[
                  styles.stepCircle,
                  step.done && styles.stepDone,
                  step.active && styles.stepActive,
                ]}>
                  <Text style={styles.stepIcon}>{step.icon}</Text>
                </View>
                {index < displaySteps.length - 1 && (
                  <View style={[styles.stepLine, step.done && styles.stepLineDone]} />
                )}
              </View>
              <Text style={[
                styles.stepLabel,
                step.done && styles.stepLabelDone,
                step.active && styles.stepLabelActive,
              ]}>
                {step.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Worker Contact Card */}
        <Text style={styles.sectionTitle}>Your Worker</Text>
        {job?.workers && (
        <View style={styles.workerCard}>
          <View style={styles.workerAvatar}>
            <Text style={styles.workerAvatarText}>
              {job.workers.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          <View style={styles.workerInfo}>
            <Text style={styles.workerName}>{job.workers.name}</Text>
            <Text style={styles.workerMeta}>⭐ {job.workers.rating || '4.8'} · Verified ✓</Text>
          </View>
          <View style={styles.contactButtons}>
            <TouchableOpacity style={styles.callBtn}>
              <Text style={styles.callBtnText}>📞 Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chatBtn}>
              <Text style={styles.chatBtnText}>💬 Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
        )}

        {/* Escrow Notice */}
        <View style={styles.escrowBanner}>
          <Text style={styles.escrowIcon}>🔒</Text>
          <View>
            <Text style={styles.escrowTitle}>Payment Protected</Text>
            <Text style={styles.escrowSub}>{job?.price || '₹450'} held in escrow · Released after job completion</Text>
          </View>
        </View>

        {/* Cancel */}
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel Job</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  container: { flex: 1, padding: 20 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20, marginTop: 10,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#1A1A2E' },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFEBEE', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 20, gap: 6,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C62828' },
  liveText: { fontSize: 12, color: '#C62828', fontWeight: '600' },
  etaCard: {
    backgroundColor: '#1565C0', borderRadius: 16,
    padding: 24, alignItems: 'center', marginBottom: 16,
  },
  etaLabel: { fontSize: 14, color: '#90CAF9', marginBottom: 8 },
  etaTime: { fontSize: 52, fontWeight: '700', color: '#fff' },
  etaWorker: { fontSize: 13, color: '#BBDEFB', marginTop: 8 },
  mapPlaceholder: {
    backgroundColor: '#E8EAF6', borderRadius: 14,
    padding: 30, alignItems: 'center', marginBottom: 24,
  },
  mapIcon: { fontSize: 40, marginBottom: 8 },
  mapText: { fontSize: 15, fontWeight: '600', color: '#3949AB' },
  mapSub: { fontSize: 12, color: '#7986CB', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },
  stepsCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 24, elevation: 2 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, minHeight: 50 },
  stepLeft: { alignItems: 'center', width: 36 },
  stepCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center',
  },
  stepDone: { backgroundColor: '#E8F5E9' },
  stepActive: { backgroundColor: '#E3F2FD', borderWidth: 2, borderColor: '#1565C0' },
  stepIcon: { fontSize: 16 },
  stepLine: { width: 2, flex: 1, backgroundColor: '#F0F0F0', marginVertical: 2 },
  stepLineDone: { backgroundColor: '#A5D6A7' },
  stepLabel: { fontSize: 14, color: '#aaa', paddingTop: 8 },
  stepLabelDone: { color: '#2E7D32' },
  stepLabelActive: { color: '#1565C0', fontWeight: '600' },
  workerCard: {
    backgroundColor: '#fff', borderRadius: 14,
    padding: 16, flexDirection: 'row',
    alignItems: 'center', gap: 12, marginBottom: 16, elevation: 2,
  },
  workerAvatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#1565C0', justifyContent: 'center', alignItems: 'center',
  },
  workerAvatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  workerInfo: { flex: 1 },
  workerName: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  workerMeta: { fontSize: 12, color: '#666', marginTop: 3 },
  contactButtons: { flexDirection: 'row', gap: 8 },
  callBtn: {
    backgroundColor: '#E8F5E9', paddingHorizontal: 12,
    paddingVertical: 8, borderRadius: 10,
  },
  callBtnText: { fontSize: 12, color: '#2E7D32', fontWeight: '600' },
  chatBtn: {
    backgroundColor: '#E3F2FD', paddingHorizontal: 12,
    paddingVertical: 8, borderRadius: 10,
  },
  chatBtnText: { fontSize: 12, color: '#1565C0', fontWeight: '600' },
  escrowBanner: {
    backgroundColor: '#F3E5F5', borderRadius: 12,
    padding: 14, flexDirection: 'row',
    alignItems: 'center', gap: 12, marginBottom: 16,
  },
  escrowIcon: { fontSize: 24 },
  escrowTitle: { fontSize: 14, fontWeight: '600', color: '#4A148C' },
  escrowSub: { fontSize: 12, color: '#7B1FA2', marginTop: 2 },
  cancelBtn: {
    borderWidth: 1.5, borderColor: '#EF9A9A',
    borderRadius: 14, padding: 16, alignItems: 'center',
  },
  cancelText: { color: '#C62828', fontSize: 15, fontWeight: '600' },
}); 
