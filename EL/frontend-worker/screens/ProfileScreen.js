import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView
} from 'react-native';

export default function ProfileScreen() {
  const worker = {
    name: 'Raju Kumar',
    phone: '+91 98765 43210',
    trade: 'Plumber',
    experience: '6 years',
    languages: 'Hindi, Kannada, Telugu',
    location: 'Bengaluru, Karnataka',
    rating: 4.8,
    totalJobs: 127,
    memberSince: 'March 2022',
  };

  const verifications = [
    { label: 'Phone OTP', status: 'verified' },
    { label: 'Aadhaar ID', status: 'verified' },
    { label: 'Selfie Check', status: 'verified' },
    { label: 'Video Call', status: 'pending' },
  ];

  const skills = ['Pipe fitting', 'Leak repair', 'Bathroom fittings', 'Water heater', 'Drainage'];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container}>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>RK</Text>
          </View>
          <Text style={styles.name}>{worker.name}</Text>
          <Text style={styles.trade}>{worker.trade} · {worker.experience}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingText}>⭐ {worker.rating}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.jobsText}>{worker.totalJobs} jobs</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.memberText}>Since {worker.memberSince}</Text>
          </View>
        </View>

        {/* Trust Score */}
        <View style={styles.trustCard}>
          <View style={styles.trustLeft}>
            <Text style={styles.trustTitle}>Trust Score</Text>
            <Text style={styles.trustSub}>Based on ratings, ID verification and job history</Text>
          </View>
          <View style={styles.trustBadge}>
            <Text style={styles.trustScore}>92</Text>
            <Text style={styles.trustMax}>/100</Text>
          </View>
        </View>

        {/* Verification Status */}
        <Text style={styles.sectionTitle}>Verification</Text>
        <View style={styles.card}>
          {verifications.map((v, i) => (
            <View key={i} style={[styles.verifyRow, i < verifications.length - 1 && styles.verifyBorder]}>
              <Text style={styles.verifyLabel}>{v.label}</Text>
              <View style={[styles.verifyBadge, v.status === 'verified' ? styles.verifiedBg : styles.pendingBg]}>
                <Text style={[styles.verifyStatus, v.status === 'verified' ? styles.verifiedText : styles.pendingText]}>
                  {v.status === 'verified' ? '✓ Verified' : '⏳ Pending'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Info */}
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.card}>
          {[
            { icon: '📱', label: 'Phone', value: worker.phone },
            { icon: '📍', label: 'Location', value: worker.location },
            { icon: '🗣️', label: 'Languages', value: worker.languages },
          ].map((item, i) => (
            <View key={i} style={[styles.infoRow, i < 2 && styles.verifyBorder]}>
              <Text style={styles.infoIcon}>{item.icon}</Text>
              <View>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Skills */}
        <Text style={styles.sectionTitle}>Skills</Text>
        <View style={styles.skillsWrap}>
          {skills.map((s, i) => (
            <View key={i} style={styles.skillTag}>
              <Text style={styles.skillText}>{s}</Text>
            </View>
          ))}
        </View>

        {/* Edit Button */}
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>✏️  Edit Profile</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  container: { flex: 1, padding: 20 },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#1565C0',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  name: { fontSize: 24, fontWeight: '700', color: '#1A1A2E' },
  trade: { fontSize: 14, color: '#666', marginTop: 4 },
  ratingRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, marginTop: 8,
  },
  ratingText: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  dot: { color: '#ccc' },
  jobsText: { fontSize: 13, color: '#666' },
  memberText: { fontSize: 13, color: '#666' },
  trustCard: {
    backgroundColor: '#1565C0',
    borderRadius: 14, padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  trustLeft: { flex: 1, paddingRight: 12 },
  trustTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  trustSub: { fontSize: 12, color: '#90CAF9', marginTop: 4, lineHeight: 18 },
  trustBadge: {
    flexDirection: 'row', alignItems: 'flex-end',
  },
  trustScore: { fontSize: 42, fontWeight: '700', color: '#fff' },
  trustMax: { fontSize: 16, color: '#90CAF9', marginBottom: 6 },
  sectionTitle: {
    fontSize: 16, fontWeight: '700',
    color: '#1A1A2E', marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 14,
    padding: 4, marginBottom: 24,
    elevation: 2,
  },
  verifyRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 14,
  },
  verifyBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  verifyLabel: { fontSize: 14, color: '#333' },
  verifyBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  verifiedBg: { backgroundColor: '#E8F5E9' },
  pendingBg: { backgroundColor: '#FFF8E1' },
  verifyStatus: { fontSize: 12, fontWeight: '600' },
  verifiedText: { color: '#2E7D32' },
  pendingText: { color: '#F57F17' },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 14, padding: 14,
  },
  infoIcon: { fontSize: 20 },
  infoLabel: { fontSize: 12, color: '#888' },
  infoValue: { fontSize: 14, color: '#1A1A2E', fontWeight: '500', marginTop: 2 },
  skillsWrap: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 10, marginBottom: 24,
  },
  skillTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
  },
  skillText: { color: '#1565C0', fontWeight: '500', fontSize: 13 },
  editButton: {
    backgroundColor: '#fff', borderRadius: 14,
    padding: 16, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#1565C0',
  },
  editButtonText: { color: '#1565C0', fontSize: 16, fontWeight: '600' },
});