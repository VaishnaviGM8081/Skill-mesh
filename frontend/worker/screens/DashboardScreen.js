import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useLanguage } from '../LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { getAuthHeaders } from '../lib/authFetch';
import { API_URL } from '../apiConfig';

export default function DashboardScreen({ navigation, apiState }) {
  const { t } = useLanguage();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/api/workers/me`, { headers });
      const json = await res.json();
      if (json.success) {
        setWorker(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const stats = {
    todayEarnings: '₹0',
    weekEarnings: '₹0',
    monthEarnings: '₹0',
    completionRate: '100%',
  };

  const recentJobs = []; // Fetch from real API later

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1565C0" />
      </SafeAreaView>
    );
  }

  if (!worker) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Profile not found. Please complete onboarding.</Text>
        <TouchableOpacity 
          style={styles.toggleBar} 
          onPress={() => navigation.navigate('Onboarding')}
        >
          <Text>Go to Onboarding</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isOnline = worker.availability_status;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{t.goodMorning}</Text>
            <Text style={styles.workerName}>{worker.name}</Text>
            <Text style={styles.trade}>{worker.trade_category} · {worker.trust_score || 0} Trust</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 8 }}>
            <LanguageSwitcher />
            <View style={styles.avatarBox}>
              <Text style={styles.avatarText}>RK</Text>
            </View>
          </View>
        </View>

        {/* Online Toggle */}
        <TouchableOpacity
          style={[styles.toggleBar, isOnline ? styles.toggleOn : styles.toggleOff]}
          onPress={() => apiState?.toggleStatus ? apiState.toggleStatus() : setIsOnline(!isOnline)}
        >
          <View style={[styles.toggleDot, isOnline ? styles.dotOn : styles.dotOff]} />
          <Text style={[styles.toggleText, isOnline ? styles.toggleTextOn : styles.toggleTextOff]}>
            {isOnline ? t.online : t.offline}
          </Text>
        </TouchableOpacity>

        {/* Rating Row */}
        <View style={styles.ratingRow}>
          <View style={styles.ratingItem}>
            <Text style={styles.ratingValue}>⭐ {worker.average_rating || '0.0'}</Text>
            <Text style={styles.ratingLabel}>{t.rating}</Text>
          </View>
          <View style={styles.ratingDivider} />
          <View style={styles.ratingItem}>
            <Text style={styles.ratingValue}>{worker.total_jobs || 0}</Text>
            <Text style={styles.ratingLabel}>{t.jobsDone}</Text>
          </View>
          <View style={styles.ratingDivider} />
          <View style={styles.ratingItem}>
            <Text style={styles.ratingValue}>{stats.completionRate}</Text>
            <Text style={styles.ratingLabel}>{t.completion}</Text>
          </View>
        </View>

        {/* Earnings Section */}
        <Text style={styles.sectionTitle}>{t.earnings}</Text>
        <View style={styles.earningsGrid}>
          <View style={styles.earningCard}>
            <Text style={styles.earningPeriod}>{t.today}</Text>
            <Text style={styles.earningAmount}>{stats.todayEarnings}</Text>
          </View>
          <View style={styles.earningCard}>
            <Text style={styles.earningPeriod}>{t.thisWeek}</Text>
            <Text style={styles.earningAmount}>{stats.weekEarnings}</Text>
          </View>
          <View style={[styles.earningCard, styles.earningCardFull]}>
            <Text style={styles.earningPeriod}>{t.thisMonth}</Text>
            <Text style={[styles.earningAmount, styles.earningAmountBig]}>
              {stats.monthEarnings}
            </Text>
          </View>
        </View>

        {/* Recent Jobs */}
        <Text style={styles.sectionTitle}>{t.recentJobs}</Text>
        {recentJobs.map((job) => (
          <View key={job.id} style={styles.jobRow}>
            <View style={styles.jobLeft}>
              <Text style={styles.jobService}>{job.service}</Text>
              <Text style={styles.jobCustomer}>{job.customer} · {job.location}</Text>
              <Text style={styles.jobDate}>{job.date}</Text>
            </View>
            <View style={styles.jobRight}>
              <Text style={styles.jobAmount}>{job.amount}</Text>
              <View style={[styles.statusBadge, job.status === 'Completed' ? styles.statusDone : styles.statusCancelled]}>
                <Text style={[styles.statusText, job.status === 'Completed' ? styles.statusTextDone : styles.statusTextCancelled]}>
                  {job.status === 'Completed' ? t.completed : t.cancelled}
                </Text>
              </View>
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, marginTop: 10 },
  greeting: { fontSize: 14, color: '#888', marginBottom: 2 },
  workerName: { fontSize: 22, fontWeight: '700', color: '#1A1A2E' },
  trade: { fontSize: 13, color: '#4CAF50', marginTop: 2, fontWeight: '500' },
  avatarBox: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1565C0', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  toggleBar: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 20, gap: 10 },
  toggleOn: { backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#A5D6A7' },
  toggleOff: { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  toggleDot: { width: 12, height: 12, borderRadius: 6 },
  dotOn: { backgroundColor: '#2E7D32' },
  dotOff: { backgroundColor: '#9E9E9E' },
  toggleText: { fontSize: 14, fontWeight: '500' },
  toggleTextOn: { color: '#2E7D32' },
  toggleTextOff: { color: '#9E9E9E' },
  ratingRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 24, justifyContent: 'space-around', elevation: 2 },
  ratingItem: { alignItems: 'center' },
  ratingValue: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  ratingLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  ratingDivider: { width: 1, backgroundColor: '#F0F0F0' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },
  earningsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  earningCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, minWidth: '40%', elevation: 2 },
  earningCardFull: { width: '100%', flex: 0, backgroundColor: '#1565C0' },
  earningPeriod: { fontSize: 12, color: '#888', marginBottom: 6 },
  earningAmount: { fontSize: 20, fontWeight: '700', color: '#1A1A2E' },
  earningAmountBig: { fontSize: 28, color: '#fff' },
  jobRow: { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, elevation: 1 },
  jobLeft: { flex: 1 },
  jobService: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  jobCustomer: { fontSize: 13, color: '#666', marginTop: 2 },
  jobDate: { fontSize: 11, color: '#aaa', marginTop: 4 },
  jobRight: { alignItems: 'flex-end', gap: 6 },
  jobAmount: { fontSize: 15, fontWeight: '700', color: '#2E7D32' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statusDone: { backgroundColor: '#E8F5E9' },
  statusCancelled: { backgroundColor: '#FFEBEE' },
  statusText: { fontSize: 11, fontWeight: '600' },
  statusTextDone: { color: '#2E7D32' },
  statusTextCancelled: { color: '#C62828' },
});