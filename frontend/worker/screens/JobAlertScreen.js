import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Alert
} from 'react-native';

export default function JobAlertScreen({ apiState }) {
  const [status, setStatus] = useState('pending'); // pending | accepted | rejected

  const job = {
    customerName: 'Rahul Sharma',
    service: 'Plumbing',
    description: 'Pipe leakage under kitchen sink. Water dripping since morning.',
    address: '14B, 3rd Cross, Koramangala, Bengaluru',
    distance: '2.3 km away',
    estimatedPay: '₹450 - ₹600',
    urgency: 'Urgent',
    postedTime: '2 mins ago',
  };

  function handleAccept() {
  if (apiState?.acceptJob) {
    apiState.acceptJob();
  }
  setStatus('accepted');
  Alert.alert('Job Accepted!', 'Customer has been notified. Safe travels!');
}

  function handleReject() {
    setStatus('rejected');
    Alert.alert('Job Rejected', 'You will be shown the next available job.');
  }

  if (status === 'accepted') {
    return (
      <View style={styles.resultContainer}>
        <Text style={styles.resultEmoji}>✅</Text>
        <Text style={styles.resultTitle}>Job Accepted!</Text>
        <Text style={styles.resultSub}>
          Head to {job.address}. {'\n'}Customer is waiting.
        </Text>
        <View style={styles.earningsBox}>
          <Text style={styles.earningsLabel}>Estimated earnings</Text>
          <Text style={styles.earningsAmount}>{job.estimatedPay}</Text>
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
        <Text style={styles.alertTime}>{job.postedTime}</Text>
      </View>

      {/* Job Card */}
      <View style={styles.jobCard}>

        {/* Urgency + Service */}
        <View style={styles.jobTopRow}>
          <View style={styles.serviceTag}>
            <Text style={styles.serviceTagText}>{job.service}</Text>
          </View>
          <View style={styles.urgencyTag}>
            <Text style={styles.urgencyText}>🚨 {job.urgency}</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description}>{job.description}</Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Details */}
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>👤</Text>
          <Text style={styles.detailText}>{job.customerName}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>📍</Text>
          <Text style={styles.detailText}>{job.address}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>🗺️</Text>
          <Text style={styles.detailText}>{job.distance}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>💰</Text>
          <Text style={[styles.detailText, styles.payText]}>{job.estimatedPay}</Text>
        </View>

      </View>

      {/* Timer note */}
      <Text style={styles.timerNote}>⏱ Respond within 60 seconds or job goes to next worker</Text>

      {/* Action Buttons */}
      <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
        <Text style={styles.acceptButtonText}>✅  Accept Job</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
        <Text style={styles.rejectButtonText}>✖  Reject Job</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E7D32',
  },
  onlineText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
  },
  alertBanner: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6F00',
    gap: 10,
  },
  alertIcon: {
    fontSize: 20,
  },
  alertText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#E65100',
  },
  alertTime: {
    fontSize: 12,
    color: '#BF360C',
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  jobTopRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  serviceTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  serviceTagText: {
    color: '#1565C0',
    fontWeight: '600',
    fontSize: 14,
  },
  urgencyTag: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  urgencyText: {
    color: '#C62828',
    fontWeight: '600',
    fontSize: 14,
  },
  description: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  detailIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  detailText: {
    fontSize: 14,
    color: '#444',
    flex: 1,
    lineHeight: 20,
  },
  payText: {
    color: '#2E7D32',
    fontWeight: '700',
    fontSize: 15,
  },
  timerNote: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  acceptButton: {
    backgroundColor: '#2E7D32',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  acceptButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
  rejectButton: {
    backgroundColor: '#FFF',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#C62828',
    marginBottom: 30,
  },
  rejectButtonText: {
    color: '#C62828',
    fontSize: 17,
    fontWeight: '600',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F5F7FA',
  },
  resultEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
    textAlign: 'center',
  },
  resultSub: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  earningsBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '100%',
  },
  earningsLabel: {
    fontSize: 13,
    color: '#555',
    marginBottom: 6,
  },
  earningsAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2E7D32',
  },
}); 
