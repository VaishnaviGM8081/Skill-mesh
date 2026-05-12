import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView
} from 'react-native';

const steps = [
  { id: 1, label: 'Job Confirmed', icon: '✅', done: true },
  { id: 2, label: 'Worker Accepted', icon: '👷', done: true },
  { id: 3, label: 'Worker On the Way', icon: '🛵', done: false, active: true },
  { id: 4, label: 'Job In Progress', icon: '🔧', done: false },
  { id: 5, label: 'Completed & Paid', icon: '💰', done: false },
];

export default function JobTrackingScreen({ route, navigation }) {
  const worker = route.params?.worker || { name: 'Raju Kumar', eta: '15 min', price: '₹500' };
  const service = route.params?.service || { name: 'Plumber', icon: '🔧' };
  const [eta, setEta] = useState(parseInt(worker.eta));

  useEffect(() => {
    const timer = setInterval(() => {
      setEta(prev => prev > 1 ? prev - 1 : 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

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
          <Text style={styles.etaLabel}>Worker arriving in</Text>
          <Text style={styles.etaTime}>{eta} min</Text>
          <Text style={styles.etaWorker}>{worker.name} · {service.icon} {service.name}</Text>
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
          {steps.map((step, index) => (
            <View key={step.id} style={styles.stepRow}>
              <View style={styles.stepLeft}>
                <View style={[
                  styles.stepCircle,
                  step.done && styles.stepDone,
                  step.active && styles.stepActive,
                ]}>
                  <Text style={styles.stepIcon}>{step.icon}</Text>
                </View>
                {index < steps.length - 1 && (
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
        <View style={styles.workerCard}>
          <View style={styles.workerAvatar}>
            <Text style={styles.workerAvatarText}>
              {worker.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          <View style={styles.workerInfo}>
            <Text style={styles.workerName}>{worker.name}</Text>
            <Text style={styles.workerMeta}>⭐ {worker.rating || '4.8'} · Verified ✓</Text>
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

        {/* Escrow Notice */}
        <View style={styles.escrowBanner}>
          <Text style={styles.escrowIcon}>🔒</Text>
          <View>
            <Text style={styles.escrowTitle}>Payment Protected</Text>
            <Text style={styles.escrowSub}>{worker.price} held in escrow · Released after job completion</Text>
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
