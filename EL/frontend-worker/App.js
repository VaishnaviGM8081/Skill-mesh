import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';

const API_URL = 'http://10.124.46.38:3000';

export default function App() {
  const [isOnline, setIsOnline] = useState(false);
  const [jobAlert, setJobAlert] = useState(null);
  const [activeJob, setActiveJob] = useState(null);

  const toggleStatus = async () => {
    const nextStatus = !isOnline;
    setIsOnline(nextStatus);
    
    try {
      await fetch(`${API_URL}/api/workers/20/availability`, {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ availability_status: nextStatus })
      });
    } catch (e) {
       console.error("Redis Sync Error", e);
    }

    if (nextStatus) {
      setTimeout(() => {
        setJobAlert({ id: '1', customer: 'Srikanth', distance: '12 min away', price: '₹450', loc: 'Koramangala, BLR' });
      }, 3000);
    } else {
      setJobAlert(null);
    }
  };

  const acceptJob = async () => {
    try {
      await fetch(`${API_URL}/api/jobs/${jobAlert.id}/accept`, { method: 'POST' });
      setActiveJob(jobAlert);
      setJobAlert(null);
    } catch(e) {
      console.error(e);
    }
  };

  const completeJob = async () => {
    try {
      await fetch(`${API_URL}/api/jobs/${activeJob.id}/complete`, { method: 'POST' });
      Alert.alert("Job Completed!", "Escrow funds have been successfully released to your wallet.");
      setActiveJob(null);
      setIsOnline(false); // Reset session
    } catch(e) {
      console.error(e);
    }
  };

  if (activeJob) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#1e1b4b' }]}>
        <View style={styles.activeTracker}>
          <Text style={styles.alertTitle}>📍 Navigating to Customer...</Text>
          <Text style={styles.alertDesc}>Job ID: #{activeJob.id}</Text>
          
          <View style={styles.jobDetails}>
            <Text style={styles.jobText}>Customer: {activeJob.customer}</Text>
            <Text style={styles.jobText}>Location: {activeJob.loc}</Text>
            <Text style={styles.jobText}>ETA: {activeJob.distance}</Text>
            <Text style={[styles.jobText, { color: '#10b981', marginTop: 10, fontWeight: 'bold' }]}>
               Escrow Block Secured: {activeJob.price}
            </Text>
          </View>

          <TouchableOpacity style={[styles.toggleBtn, {backgroundColor: '#10b981', marginTop: 'auto'}]} onPress={completeJob}>
            <Text style={styles.toggleText}>MARK JOB COMPLETE</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Ravi Kumar</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>SILVER VERIFIED</Text></View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Today's Earnings</Text>
            <Text style={styles.statValue}>₹1,250</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Jobs Completed</Text>
            <Text style={styles.statValue}>3</Text>
          </View>
        </View>

        <View style={styles.statusBox}>
          <Text style={styles.statusTitle}>Current Status</Text>
          <TouchableOpacity 
            style={[styles.toggleBtn, isOnline ? styles.btnOnline : styles.btnOffline]} 
            onPress={toggleStatus}
          >
            <Text style={styles.toggleText}>{isOnline ? 'ONLINE - READY FOR JOBS' : 'GO ONLINE'}</Text>
          </TouchableOpacity>
        </View>

        {jobAlert && (
          <View style={styles.alertCard}>
            <View style={styles.pulseIndicator}></View>
            <Text style={styles.alertTitle}>New Job Request!</Text>
            <Text style={styles.alertDesc}>Plumbing • {jobAlert.distance}</Text>
            <View style={styles.jobDetails}>
              <Text style={styles.jobText}>Customer: {jobAlert.customer}</Text>
              <Text style={styles.jobText}>Offer: {jobAlert.price}</Text>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#10b981'}]} onPress={acceptJob}>
                <Text style={styles.actionText}>Accept Job</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#ef4444'}]} onPress={() => setJobAlert(null)}>
                <Text style={styles.actionText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 30 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  badge: { backgroundColor: 'rgba(245, 158, 11, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { color: '#fcd34d', fontWeight: 'bold', fontSize: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  statBox: { backgroundColor: '#1e293b', padding: 20, borderRadius: 16, width: '48%' },
  statLabel: { color: '#94a3b8', fontSize: 12, marginBottom: 8 },
  statValue: { color: '#10b981', fontSize: 24, fontWeight: 'bold' },
  statusBox: { backgroundColor: '#1e293b', padding: 25, borderRadius: 16, alignItems: 'center' },
  statusTitle: { color: '#f8fafc', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  toggleBtn: { width: '100%', padding: 20, borderRadius: 12, alignItems: 'center' },
  btnOffline: { backgroundColor: '#334155' },
  btnOnline: { backgroundColor: '#8b5cf6' },
  toggleText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  alertCard: { marginTop: 30, backgroundColor: '#1e1b4b', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#8b5cf6' },
  pulseIndicator: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#8b5cf6', position: 'absolute', top: 20, right: 20 },
  alertTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  alertDesc: { color: '#a78bfa', fontSize: 14, marginBottom: 15 },
  jobDetails: { backgroundColor: '#0f172a', padding: 15, borderRadius: 10, marginBottom: 20 },
  jobText: { color: '#e2e8f0', marginBottom: 5 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { width: '48%', padding: 15, borderRadius: 8, alignItems: 'center' },
  actionText: { color: '#fff', fontWeight: 'bold' },
  activeTracker: { flex: 1, padding: 30, paddingTop: 60, justifyContent: 'flex-start' }
});
