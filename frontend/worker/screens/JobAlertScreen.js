import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Vibration
} from 'react-native';
import { getAuthHeaders } from '../lib/authFetch';
import { API_URL } from '../apiConfig';

const JOB_TIMEOUT_SECONDS = 60;

export default function JobAlertScreen({ apiState }) {
  const [status, setStatus] = useState('pending'); // pending | accepted | rejected
  const [countdown, setCountdown] = useState(JOB_TIMEOUT_SECONDS);
  const timerRef = useRef(null);

  const job = apiState?.jobAlert;

  // Vibrate when a new job arrives
  useEffect(() => {
    if (job) {
      Vibration.vibrate([0, 400, 200, 400, 200, 400]);
      setStatus('pending');
      setCountdown(JOB_TIMEOUT_SECONDS);
    }
  }, [job?.id]);

  // Real countdown timer — auto-reject at 0
  useEffect(() => {
    if (!job || status !== 'pending') {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleReject(true); // auto-reject
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [job?.id, status]);

  async function handleAccept() {
    clearInterval(timerRef.current);
    if (apiState?.acceptJob) apiState.acceptJob();
    setStatus('accepted');
    Alert.alert('Job Accepted!', 'Customer has been notified. Safe travels!');
  }

  async function handleReject(isAuto = false) {
    clearInterval(timerRef.current);
    setStatus('rejected');

    // Notify backend so the job can be offered to the next worker
    if (job?.id) {
      try {
        const headers = await getAuthHeaders();
        await fetch(`${API_URL}/api/jobs/${job.id}/status`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status: 'rejected' }),
        });
      } catch (e) {
        console.error('Reject API error:', e);
      }
    }

    // Clear the alert from global state so polling can find the next job
    apiState?.setJobAlert?.(null);

    if (!isAuto) {
      Alert.alert('Job Rejected', "You'll be shown the next available job.");
    }
  }

  if (!job) {
    return (
      <View style={styles.resultContainer}>
        <Text style={styles.resultEmoji}>📡</Text>
        <Text style={styles.resultTitle}>Waiting for jobs...</Text>
        <Text style={styles.resultSub}>Stay online to receive new service requests near you.</Text>
      </View>
    );
  }

  if (status === 'accepted') {
    return (
      <View style={styles.resultContainer}>
        <Text style={styles.resultEmoji}>✅</Text>
        <Text style={styles.resultTitle}>Job Accepted!</Text>
        <Text style={styles.resultSub}>
          Head to the customer address.{'\n'}Customer is waiting.
        </Text>
        <View style={styles.earningsBox}>
          <Text style={styles.earningsLabel}>Job Status</Text>
          <Text style={styles.earningsAmount}>In Progress</Text>
        </View>
      </View>
    );
  }

  if (status === 'rejected') {
    return (
      <View style={styles.resultContainer}>
        <Text style={styles.resultEmoji}>🔍</Text>
        <Text style={styles.resultTitle}>Finding next job...</Text>
        <Text style={styles.resultSub}>We'll notify you when a new job is available nearby.</Text>
      </View>
    );
  }

  // Countdown color: green → yellow → red
  const timerColor = countdown > 30 ? '#2E7D32' : countdown > 10 ? '#F57F17' : '#C62828';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SkillMesh</Text>
        <View style={styles.onlineBadge}>
          <View style={styles.greenDot} />
          <Text style={styles.onlineText}>Online</Text>
        </View>
      </View>

      {/* Alert Banner */}
      <View style={styles.alertBanner}>
        <Text style={styles.alertIcon}>🔔</Text>
        <Text style={styles.alertText}>New job near you!</Text>
        <Text style={styles.alertTime}>{job.postedTime || 'Just now'}</Text>
      </View>

      {/* Job Card */}
      <View style={styles.jobCard}>

        {/* Urgency + Service */}
        <View style={styles.jobTopRow}>
          <View style={styles.serviceTag}>
            <Text style={styles.serviceTagText}>{job.service || job.trade_category || 'Service'}</Text>
          </View>
          <View style={styles.urgencyTag}>
            <Text style={styles.urgencyText}>🚨 {job.urgency || 'Normal'}</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description}>{job.description || job.notes || 'No description provided.'}</Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Details */}
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>👤</Text>
          <Text style={styles.detailText}>{job.customers?.name || 'Customer'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>📍</Text>
          <Text style={styles.detailText}>{job.customers?.address || job.pincode || '—'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>📝</Text>
          <Text style={styles.detailText}>{job.notes || 'No notes provided'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>💰</Text>
          <Text style={[styles.detailText, styles.payText]}>
            {job.amount ? `₹${job.amount}` : 'Fixed Price'}
          </Text>
        </View>

      </View>

      {/* Real Countdown Timer */}
      <View style={styles.timerContainer}>
        <Text style={[styles.timerCount, { color: timerColor }]}>{countdown}s</Text>
        <Text style={styles.timerLabel}>Respond before time runs out or job goes to next worker</Text>
        {/* Timer progress bar */}
        <View style={styles.timerBar}>
          <View style={[styles.timerFill, {
            width: `${(countdown / JOB_TIMEOUT_SECONDS) * 100}%`,
            backgroundColor: timerColor
          }]} />
        </View>
      </View>

      {/* Action Buttons */}
      <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
        <Text style={styles.acceptButtonText}>✅  Accept Job</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.rejectButton} onPress={() => handleReject(false)}>
        <Text style={styles.rejectButtonText}>✖  Reject Job</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A2E' },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 6 },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2E7D32' },
  onlineText: { fontSize: 13, color: '#2E7D32', fontWeight: '600' },
  alertBanner: { backgroundColor: '#FFF3E0', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#FF6F00', gap: 10 },
  alertIcon: { fontSize: 20 },
  alertText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#E65100' },
  alertTime: { fontSize: 12, color: '#BF360C' },
  jobCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  jobTopRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  serviceTag: { backgroundColor: '#E3F2FD', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  serviceTagText: { color: '#1565C0', fontWeight: '600', fontSize: 14 },
  urgencyTag: { backgroundColor: '#FFEBEE', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  urgencyText: { color: '#C62828', fontWeight: '600', fontSize: 14 },
  description: { fontSize: 15, color: '#333', lineHeight: 22, marginBottom: 16 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 10 },
  detailIcon: { fontSize: 16, marginTop: 1 },
  detailText: { fontSize: 14, color: '#444', flex: 1, lineHeight: 20 },
  payText: { color: '#2E7D32', fontWeight: '700', fontSize: 15 },
  timerContainer: { alignItems: 'center', marginBottom: 20, backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 1 },
  timerCount: { fontSize: 36, fontWeight: '800', marginBottom: 4 },
  timerLabel: { fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 12, lineHeight: 18 },
  timerBar: { width: '100%', height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: 3 },
  acceptButton: { backgroundColor: '#2E7D32', padding: 18, borderRadius: 14, alignItems: 'center', marginBottom: 12 },
  acceptButtonText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  rejectButton: { backgroundColor: '#FFF', padding: 18, borderRadius: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#C62828', marginBottom: 30 },
  rejectButtonText: { color: '#C62828', fontSize: 17, fontWeight: '600' },
  resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#F5F7FA' },
  resultEmoji: { fontSize: 64, marginBottom: 20 },
  resultTitle: { fontSize: 26, fontWeight: '700', color: '#1A1A2E', marginBottom: 12, textAlign: 'center' },
  resultSub: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 24, marginBottom: 30 },
  earningsBox: { backgroundColor: '#E8F5E9', borderRadius: 12, padding: 20, alignItems: 'center', width: '100%' },
  earningsLabel: { fontSize: 13, color: '#555', marginBottom: 6 },
  earningsAmount: { fontSize: 28, fontWeight: '700', color: '#2E7D32' },
});
