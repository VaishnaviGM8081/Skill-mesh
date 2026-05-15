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

const formatINR = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

const getInitials = (name = '') =>
  name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'W';

const getCompletionRate = (jobs) => {
  if (!jobs || jobs.length === 0) return '—';
  const completed = jobs.filter(j => j.status === 'completed').length;
  return `${Math.round((completed / jobs.length) * 100)}%`;
};

// Wraps each fetch with its own 5s timeout — prevents any single call from hanging forever
const fetchWithTimeout = (url, options, ms = 5000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
};

export default function DashboardScreen({ navigation, apiState }) {
  const { t } = useLanguage();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState({ today: 0, week: 0, month: 0, total_completed: 0 });
  const [recentJobs, setRecentJobs] = useState([]);
  const [toggling, setToggling] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();

      // All 3 fetches run in parallel, each with its own 5s timeout
      // Promise.allSettled means one failure won't block the others
      const [workerRes, earningsRes, historyRes] = await Promise.allSettled([
        fetchWithTimeout(`${API_URL}/api/workers/me`, { headers }),
        fetchWithTimeout(`${API_URL}/api/workers/earnings`, { headers }),
        fetchWithTimeout(`${API_URL}/api/workers/jobs/history`, { headers }),
      ]);

      if (workerRes.status === 'fulfilled') {
        try {
          const json = await workerRes.value.json();
          if (json.success) setWorker(json.data);
        } catch (_) {}
      }
      if (earningsRes.status === 'fulfilled') {
        try {
          const json = await earningsRes.value.json();
          if (json.success) setEarnings(json.data);
        } catch (_) {}
      }
      if (historyRes.status === 'fulfilled') {
        try {
          const json = await historyRes.value.json();
          if (json.success) setRecentJobs(json.data.slice(0, 5));
        } catch (_) {}
      }
    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      // ALWAYS runs — loading can never get stuck
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

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
        <View style={styles.avatarBox}>
          <Text style={styles.avatarText}>?</Text>
        </View>
        <Text style={{ color: '#1A1A2E', fontSize: 18, fontWeight: '700', marginTop: 20 }}>
          Syncing your profile...
        </Text>
        <Text style={{ color: '#666', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }}>
          We're finalizing your worker account. This usually takes a few seconds.
        </Text>
        
        <ActivityIndicator size="small" color="#1565C0" style={{ marginTop: 24 }} />

        <TouchableOpacity
          style={[styles.retryBtn, { marginTop: 40 }]}
          onPress={loadData}
        >
          <Text style={styles.retryBtnText}>🔄 Sync Now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ marginTop: 20 }}
          onPress={() => navigation.navigate('Onboarding')}
        >
          <Text style={{ color: '#1565C0', fontWeight: '600' }}>Back to Onboarding</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Use apiState.isOnline as source of truth for the toggle (fixes mismatch bug)
  const isOnline = apiState?.isOnline ?? worker.availability_status ?? false;
  const initials = getInitials(worker.name);
  const completionRate = getCompletionRate(recentJobs);

  const handleToggle = async () => {
    if (toggling) return;
    setToggling(true);
    const newStatus = !isOnline;
    apiState?.setIsOnline?.(newStatus); // optimistic update
    try {
      const headers = await getAuthHeaders();
      const res = await fetchWithTimeout(`${API_URL}/api/workers/availability`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ available: newStatus }),
      });
      const json = await res.json();
      if (!json.success) apiState?.setIsOnline?.(!newStatus); // revert on failure
    } catch (_) {
      apiState?.setIsOnline?.(!newStatus); // revert on network error
    } finally {
      setToggling(false);
    }
  };

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
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
        </View>

        {/* Online Toggle */}
        <TouchableOpacity
          style={[styles.toggleBar, isOnline ? styles.toggleOn : styles.toggleOff, toggling && { opacity: 0.7 }]}
          onPress={handleToggle}
          disabled={toggling}
        >
          <View style={[styles.toggleDot, isOnline ? styles.dotOn : styles.dotOff]} />
          <Text style={[styles.toggleText, isOnline ? styles.toggleTextOn : styles.toggleTextOff]}>
            {toggling ? 'Updating...' : isOnline ? t.online : t.offline}
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
            <Text style={styles.ratingValue}>{earnings.total_completed}</Text>
            <Text style={styles.ratingLabel}>{t.jobsDone}</Text>
          </View>
          <View style={styles.ratingDivider} />
          <View style={styles.ratingItem}>
            <Text style={styles.ratingValue}>
              {recentJobs.length > 0 ? completionRate : '100%'}
            </Text>
            <Text style={styles.ratingLabel}>{t.completion}</Text>
          </View>
        </View>

        {/* Earnings Section */}
        <Text style={styles.sectionTitle}>{t.earnings}</Text>
        <View style={styles.earningsGrid}>
          <View style={styles.earningCard}>
            <Text style={styles.earningPeriod}>{t.today}</Text>
            <Text style={styles.earningAmount}>{formatINR(earnings.today)}</Text>
          </View>
          <View style={styles.earningCard}>
            <Text style={styles.earningPeriod}>{t.thisWeek}</Text>
            <Text style={styles.earningAmount}>{formatINR(earnings.week)}</Text>
          </View>
          <View style={[styles.earningCard, styles.earningCardFull]}>
            <Text style={[styles.earningPeriod, { color: '#90CAF9' }]}>{t.thisMonth}</Text>
            <Text style={[styles.earningAmount, styles.earningAmountBig]}>
              {formatINR(earnings.month)}
            </Text>
          </View>
        </View>

        {/* Recent Jobs */}
        <Text style={styles.sectionTitle}>{t.recentJobs}</Text>
        {recentJobs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No completed jobs yet.{'\n'}Go online to start receiving jobs!</Text>
          </View>
        ) : (
          recentJobs.map((job) => (
            <View key={job.id} style={styles.jobRow}>
              <View style={styles.jobLeft}>
                <Text style={styles.jobService}>{job.customers?.name || 'Customer'}</Text>
                <Text style={styles.jobCustomer}>{job.notes || '—'} · {job.pincode}</Text>
                <Text style={styles.jobDate}>
                  {new Date(job.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
              <View style={styles.jobRight}>
                <Text style={styles.jobAmount}>{formatINR(job.amount)}</Text>
                <View style={[styles.statusBadge, job.status === 'completed' ? styles.statusDone : styles.statusCancelled]}>
                  <Text style={[styles.statusText, job.status === 'completed' ? styles.statusTextDone : styles.statusTextCancelled]}>
                    {job.status === 'completed' ? t.completed : t.cancelled}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}

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
  ratingRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 24, justifyContent: 'space-around', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
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
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22 },
  jobRow: { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
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
  retryBtn: { backgroundColor: '#1565C0', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});