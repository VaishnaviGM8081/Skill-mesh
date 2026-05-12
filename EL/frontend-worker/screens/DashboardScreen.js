import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView
} from 'react-native';

export default function DashboardScreen({ navigation, apiState }) {
  const [isOnline, setIsOnline] = useState(true);

  const worker = {
    name: 'Raju Kumar',
    trade: 'Plumber',
    rating: 4.8,
    totalJobs: 127,
    trustLevel: 'Verified ✓',
  };

  const stats = {
    todayEarnings: '₹1,250',
    weekEarnings: '₹6,800',
    monthEarnings: '₹24,500',
    completionRate: '96%',
  };

  const recentJobs = [
    {
      id: 1,
      service: 'Plumbing',
      customer: 'Priya Nair',
      location: 'HSR Layout',
      amount: '₹550',
      status: 'Completed',
      date: 'Today, 10:30 AM',
    },
    {
      id: 2,
      service: 'Plumbing',
      customer: 'Amit Verma',
      location: 'Indiranagar',
      amount: '₹400',
      status: 'Completed',
      date: 'Today, 8:00 AM',
    },
    {
      id: 3,
      service: 'Plumbing',
      customer: 'Sneha Reddy',
      location: 'Whitefield',
      amount: '₹300',
      status: 'Cancelled',
      date: 'Yesterday',
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning 👋</Text>
            <Text style={styles.workerName}>{worker.name}</Text>
            <Text style={styles.trade}>{worker.trade} · {worker.trustLevel}</Text>
          </View>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>RK</Text>
          </View>
        </View>

        {/* Online Toggle */}
        <TouchableOpacity
          style={[styles.toggleBar, isOnline ? styles.toggleOn : styles.toggleOff]}
          onPress={() => apiState?.toggleStatus ? apiState.toggleStatus() : setIsOnline(!isOnline)}

        >
          <View style={[styles.toggleDot, isOnline ? styles.dotOn : styles.dotOff]} />
          <Text style={[styles.toggleText, isOnline ? styles.toggleTextOn : styles.toggleTextOff]}>
            {isOnline ? '● You are Online — receiving jobs' : '○ You are Offline — not receiving jobs'}
          </Text>
        </TouchableOpacity>

        {/* Rating Row */}
        <View style={styles.ratingRow}>
          <View style={styles.ratingItem}>
            <Text style={styles.ratingValue}>⭐ {worker.rating}</Text>
            <Text style={styles.ratingLabel}>Rating</Text>
          </View>
          <View style={styles.ratingDivider} />
          <View style={styles.ratingItem}>
            <Text style={styles.ratingValue}>{worker.totalJobs}</Text>
            <Text style={styles.ratingLabel}>Jobs done</Text>
          </View>
          <View style={styles.ratingDivider} />
          <View style={styles.ratingItem}>
            <Text style={styles.ratingValue}>{stats.completionRate}</Text>
            <Text style={styles.ratingLabel}>Completion</Text>
          </View>
        </View>

        {/* Earnings Section */}
        <Text style={styles.sectionTitle}>Earnings</Text>
        <View style={styles.earningsGrid}>
          <View style={styles.earningCard}>
            <Text style={styles.earningPeriod}>Today</Text>
            <Text style={styles.earningAmount}>{stats.todayEarnings}</Text>
          </View>
          <View style={styles.earningCard}>
            <Text style={styles.earningPeriod}>This week</Text>
            <Text style={styles.earningAmount}>{stats.weekEarnings}</Text>
          </View>
          <View style={[styles.earningCard, styles.earningCardFull]}>
            <Text style={styles.earningPeriod}>This month</Text>
            <Text style={[styles.earningAmount, styles.earningAmountBig]}>
              {stats.monthEarnings}
            </Text>
          </View>
        </View>

        {/* Recent Jobs */}
        <Text style={styles.sectionTitle}>Recent Jobs</Text>
        {recentJobs.map((job) => (
          <View key={job.id} style={styles.jobRow}>
            <View style={styles.jobLeft}>
              <Text style={styles.jobService}>{job.service}</Text>
              <Text style={styles.jobCustomer}>{job.customer} · {job.location}</Text>
              <Text style={styles.jobDate}>{job.date}</Text>
            </View>
            <View style={styles.jobRight}>
              <Text style={styles.jobAmount}>{job.amount}</Text>
              <View style={[
                styles.statusBadge,
                job.status === 'Completed' ? styles.statusDone : styles.statusCancelled
              ]}>
                <Text style={[
                  styles.statusText,
                  job.status === 'Completed' ? styles.statusTextDone : styles.statusTextCancelled
                ]}>
                  {job.status}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {/* Bottom padding */}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  greeting: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  workerName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  trade: {
    fontSize: 13,
    color: '#4CAF50',
    marginTop: 2,
    fontWeight: '500',
  },
  avatarBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1565C0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  toggleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  toggleOn: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  toggleOff: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  toggleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotOn: { backgroundColor: '#2E7D32' },
  dotOff: { backgroundColor: '#9E9E9E' },
  toggleText: { fontSize: 14, fontWeight: '500' },
  toggleTextOn: { color: '#2E7D32' },
  toggleTextOff: { color: '#9E9E9E' },
  ratingRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    justifyContent: 'space-around',
    elevation: 2,
  },
  ratingItem: { alignItems: 'center' },
  ratingValue: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  ratingLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  ratingDivider: { width: 1, backgroundColor: '#F0F0F0' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  earningsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  earningCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    minWidth: '40%',
    elevation: 2,
  },
  earningCardFull: {
    width: '100%',
    flex: 0,
    backgroundColor: '#1565C0',
  },
  earningPeriod: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
  },
  earningAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  earningAmountBig: {
    fontSize: 28,
    color: '#fff',
  },
  jobRow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 1,
  },
  jobLeft: { flex: 1 },
  jobService: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  jobCustomer: { fontSize: 13, color: '#666', marginTop: 2 },
  jobDate: { fontSize: 11, color: '#aaa', marginTop: 4 },
  jobRight: { alignItems: 'flex-end', gap: 6 },
  jobAmount: { fontSize: 15, fontWeight: '700', color: '#2E7D32' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusDone: { backgroundColor: '#E8F5E9' },
  statusCancelled: { backgroundColor: '#FFEBEE' },
  statusText: { fontSize: 11, fontWeight: '600' },
  statusTextDone: { color: '#2E7D32' },
  statusTextCancelled: { color: '#C62828' },
});