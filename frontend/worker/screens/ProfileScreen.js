import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../apiConfig';
import { getAuthHeaders, clearAuthStorage } from '../lib/authFetch';
import { supabase } from '../lib/supabase';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [workerPincode, setWorkerPincode] = useState('');
  const [certificate, setCertificate] = useState(null);
  const [certificateModalVisible, setCertificateModalVisible] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const headers = await getAuthHeaders();
      let json;

      let workerId = await SecureStore.getItemAsync('workerId');
      
      if (workerId) {
        const res = await fetch(`${API_URL}/api/workers/${workerId}/profile`, { headers });
        json = await res.json().catch(() => ({}));
      }

      // If failed, try /me (Auto-Sync)
      if (!json?.success || !json?.data) {
        const resMe = await fetch(`${API_URL}/api/workers/me`, { headers });
        const jsonMe = await resMe.json().catch(() => ({}));
        
        if (jsonMe.success && jsonMe.data) {
          await SecureStore.setItemAsync('workerId', String(jsonMe.data.id));
          json = {
            success: true,
            data: {
              ...jsonMe.data,
              stats: { total_jobs: 0, avg_rating: jsonMe.data.average_rating || null },
            }
          };
        } else {
          throw new Error('Profile not found. Please complete onboarding.');
        }
      }

      if (!json.success) throw new Error('Failed to load profile');
      setProfile(json.data);

      if (json.data?.pincode) {
        setWorkerPincode(String(json.data.pincode));
      }

      if (json.data?.id) {
        try {
          const certRes = await fetch(`${API_URL}/api/workers/${json.data.id}/certificate/latest`, { headers });
          const certJson = await certRes.json().catch(() => ({}));
          if (certJson.success) {
            setCertificate(certJson.certificate);
          }
        } catch (err) {
          console.warn('Failed to load certificate', err);
        }
      }
    } catch (e) {
      setError(e.message || 'Error');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );
  async function savePincode() {
    try {
      const headers = await getAuthHeaders();

      const workerId = await SecureStore.getItemAsync('workerId');

      const res = await fetch(
        `${API_URL}/api/workers/${workerId}/pincode`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: JSON.stringify({
            pincode: workerPincode,
          }),
        }
      );

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Failed');
      }

      Alert.alert('Success', 'Pincode updated');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }

  async function handleSignOut() {
    try {

      // Supabase logout
      await supabase.auth.signOut();

      // Clear secure storage
      await clearAuthStorage();

      // Remove cached worker data
      await SecureStore.deleteItemAsync('workerId');

      // Reset local profile state
      setProfile(null);

      // Navigate to onboarding/login flow
      navigation.reset({
        index: 0,
        routes: [{ name: 'RoleSelection' }],
      });

    } catch (e) {
      Alert.alert('Error', 'Failed to sign out');
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={{ marginTop: 12, color: '#666' }}>Loading profile…</Text>
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Text style={{ color: '#C62828', textAlign: 'center', paddingHorizontal: 24 }}>{error || 'No profile'}</Text>
        <TouchableOpacity style={[styles.editButton, { marginTop: 16 }]} onPress={load}>
          <Text style={styles.editButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Use real DB columns first, fall back to stats sub-object
  const avgRating = profile.average_rating != null
    ? Number(profile.average_rating)
    : (profile.stats?.avg_rating != null ? Number(profile.stats.avg_rating) : null);

  const totalJobs = profile.completed_jobs ?? profile.stats?.total_jobs ?? 0;
  const totalRatings = profile.total_ratings ?? 0;
  const cancellations = profile.cancellations ?? 0;
  const completionRate = totalJobs > 0
    ? Math.round(((totalJobs - cancellations) / totalJobs) * 100)
    : 100;

  const certificateId = certificate?.certificate_id || 'Not issued yet';
  const certificateHash = certificate?.blockchain_hash || '—';
  const certificateIssued = certificate?.issue_date || '—';
  const certificateTrustScore = certificate?.trust_score ?? profile.trust_score ?? '—';

  const skills = Array.isArray(profile.worker_skills)
    ? profile.worker_skills
    : Array.isArray(profile.skills) ? profile.skills : [];
  const created = profile.created_at ? new Date(profile.created_at) : null;
  const memberSince = created
    ? created.toLocaleString(undefined, { month: 'long', year: 'numeric' })
    : '—';

  const initials = (profile.name || 'W')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.trade}>
            {profile.trade_category} · {profile.verification_level || 'unverified'}
          </Text>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingText}>⭐ {avgRating != null ? avgRating.toFixed(1) : '—'}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.jobsText}>{totalJobs} jobs done</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.memberText}>Since {memberSince}</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statPillValue}>{completionRate}%</Text>
              <Text style={styles.statPillLabel}>Completion</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statPillValue}>{totalRatings}</Text>
              <Text style={styles.statPillLabel}>Reviews</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statPillValue}>{profile.years_experience}y</Text>
              <Text style={styles.statPillLabel}>Experience</Text>
            </View>
          </View>
        </View>

        <View style={styles.trustCard}>
          <View style={styles.trustLeft}>
            <Text style={styles.trustTitle}>Trust Score</Text>
            <Text style={styles.trustSub}>Based on ratings, job completion and platform behaviour</Text>
          </View>
          <View style={styles.trustBadge}>
            <Text style={styles.trustScore}>{profile.trust_score ?? '—'}</Text>
            <Text style={styles.trustMax}>/100</Text>
          </View>
        </View>

        <View style={styles.certificateSection}>
          <Text style={styles.certificateTitle}>🏆 Blockchain Trust Certificate</Text>
          <View style={styles.certificateCard}>
            <View style={styles.certificateHeader}>
              <Text style={styles.certificateId}>{certificateId}</Text>
              <View style={[styles.certificateBadge, styles.verifiedBg]}>
                <Text style={[styles.verifyStatus, styles.verifiedText]}>Verified</Text>
              </View>
            </View>
            <Text style={styles.certificateLabel}>Trust Score</Text>
            <Text style={styles.certificateValue}>{certificateTrustScore}</Text>
            <Text style={styles.certificateLabel}>Issued</Text>
            <Text style={styles.certificateValue}>{certificateIssued}</Text>
            <Text style={styles.certificateLabel}>Hash</Text>
            <Text style={styles.certificateHash}>{certificateHash.slice(0, 10)}....</Text>
            <TouchableOpacity style={styles.verifyButton} onPress={() => setCertificateModalVisible(true)}>
              <Text style={styles.verifyButtonText}>Verify Certificate</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Verification</Text>
        <View style={styles.card}>
          <View style={[styles.verifyRow, styles.verifyBorder]}>
            <Text style={styles.verifyLabel}>Status</Text>
            <View style={[styles.verifyBadge, profile.is_verified ? styles.verifiedBg : styles.pendingBg]}>
              <Text style={[styles.verifyStatus, profile.is_verified ? styles.verifiedText : styles.pendingText]}>
                {profile.is_verified ? '✓ Verified' : 'Pending Verification'}
              </Text>
            </View>
          </View>
          {!profile.is_verified && (
            <TouchableOpacity 
              style={styles.getVerifiedBtn} 
              onPress={() => navigation.navigate('Verification')}
            >
              <Text style={styles.getVerifiedBtnText}>🛡️ Get Verified Now</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.card}>
          <View style={[styles.infoRow, styles.verifyBorder]}>
            <Text style={styles.infoIcon}>📱</Text>
            <View>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{profile.phone}</Text>
            </View>
          </View>
          <View style={[styles.infoRow, styles.verifyBorder]}>
            <Text style={styles.infoIcon}>📍</Text>

            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Pincode</Text>

              <TextInput
                value={workerPincode}
                onChangeText={setWorkerPincode}
                keyboardType="numeric"
                maxLength={6}
                placeholder="Enter pincode"
                style={{
                  fontSize: 16,
                  color: '#1A1A2E',
                  fontWeight: '600',
                  marginTop: 4,
                }}
              />

              <TouchableOpacity
                onPress={savePincode}
                style={{
                  marginTop: 10,
                  backgroundColor: '#1565C0',
                  paddingVertical: 8,
                  borderRadius: 10,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: '#fff',
                    fontWeight: '700',
                  }}
                >
                  Save Pincode
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🛠️</Text>
            <View>
              <Text style={styles.infoLabel}>Availability</Text>
              <Text style={styles.infoValue}>{profile.availability_status ? 'Online' : 'Offline'}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Skills</Text>
        <View style={styles.skillsWrap}>
          {skills.length === 0 ? (
            <Text style={{ color: '#888' }}>No skills yet</Text>
          ) : (
            skills.map((s) => (
              <View key={`${s.skill_name}`} style={styles.skillTag}>
                <Text style={styles.skillText}>{s.skill_name}</Text>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity style={styles.editButton} onPress={handleSignOut}>
          <Text style={styles.editButtonText}>Sign out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={certificateModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCertificateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.certPaper}>
            {/* Elegant Double Border */}
            <View style={styles.certInnerBorder}>
              {/* Header Seal */}
              <View style={styles.certSealContainer}>
                <Text style={styles.certSeal}>🏅</Text>
              </View>
              
              <Text style={styles.certTitle}>SKILLMESH VERIFIED TRUST</Text>
              <Text style={styles.certSubtitle}>CERTIFICATE OF EXCELLENCE</Text>
              
              <View style={styles.certDivider} />
              
              <Text style={styles.certPrompt}>This is to certify that</Text>
              <Text style={styles.certWorkerName}>{certificate ? certificate.worker_name : '—'}</Text>
              
              <Text style={styles.certPrompt}>has successfully met the trust validation standards as a verified</Text>
              <Text style={styles.certTrade}>{certificate ? (certificate.trade_category || '').toUpperCase() : '—'}</Text>
              
              <Text style={styles.certPrompt}>maintaining a validated Trust Score of</Text>
              <View style={styles.certScoreContainer}>
                <Text style={styles.certScoreValue}>{certificate ? certificate.trust_score : '—'}</Text>
                <Text style={styles.certScoreMax}>/100</Text>
              </View>
              
              <View style={styles.certDivider} />
              
              {certificate ? (
                <View style={styles.certMetaGrid}>
                  <View style={styles.certMetaRow}>
                    <Text style={styles.certMetaLabel}>Certificate ID:</Text>
                    <Text style={styles.certMetaValue}>{certificate.certificate_id}</Text>
                  </View>
                  <View style={styles.certMetaRow}>
                    <Text style={styles.certMetaLabel}>Issued Date:</Text>
                    <Text style={styles.certMetaValue}>{certificate.issue_date}</Text>
                  </View>
                  <View style={styles.certMetaRowCol}>
                    <Text style={styles.certMetaLabel}>Blockchain Hash:</Text>
                    <Text style={styles.certMetaValueMono} numberOfLines={1} ellipsizeMode="middle">
                      {certificate.blockchain_hash}
                    </Text>
                  </View>
                  <View style={styles.certMetaRowCol}>
                    <Text style={styles.certMetaLabel}>Transaction Hash:</Text>
                    <Text style={styles.certMetaValueMono} numberOfLines={1} ellipsizeMode="middle">
                      {certificate.transaction_hash}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.certPrompt}>Certificate details loading...</Text>
              )}
              
              <Text style={styles.certFooter}>SECURED BY SKILLMESH CRYPTOGRAPHIC LEDGER</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.certCloseBtn} onPress={() => setCertificateModalVisible(false)}>
            <Text style={styles.certCloseBtnText}>Close Certificate</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  container: { flex: 1, padding: 20 },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1565C0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  name: { fontSize: 24, fontWeight: '700', color: '#1A1A2E' },
  trade: { fontSize: 14, color: '#666', marginTop: 4 },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  ratingText: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  dot: { color: '#ccc' },
  jobsText: { fontSize: 13, color: '#666' },
  memberText: { fontSize: 13, color: '#666' },
  trustCard: {
    backgroundColor: '#1565C0',
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  trustLeft: { flex: 1, paddingRight: 12 },
  trustTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  trustSub: { fontSize: 12, color: '#90CAF9', marginTop: 4, lineHeight: 18 },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  trustScore: { fontSize: 32, fontWeight: '800', color: '#fff' },
  trustMax: { fontSize: 14, color: '#90CAF9', marginBottom: 4, fontWeight: '500' },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  certificateSection: {
    marginBottom: 24,
  },
  certificateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  certificateCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8F5E9',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  certificateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  certificateId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1565C0',
  },
  certificateBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  certificateLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
  },
  certificateValue: {
    fontSize: 16,
    color: '#1A1A2E',
    fontWeight: '600',
    marginTop: 2,
  },
  certificateHash: {
    fontSize: 12,
    color: '#444',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  verifyButton: {
    marginTop: 18,
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  certPaper: {
    width: '100%',
    backgroundColor: '#FCFAF2',
    borderRadius: 16,
    padding: 12,
    borderWidth: 3,
    borderColor: '#D4AF37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  certInnerBorder: {
    borderWidth: 1.5,
    borderColor: '#C5A059',
    borderStyle: 'solid',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  certSealContainer: {
    marginBottom: 10,
    backgroundColor: '#fff',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    elevation: 2,
  },
  certSeal: {
    fontSize: 28,
  },
  certTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: 2,
    textAlign: 'center',
  },
  certSubtitle: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8C7853',
    letterSpacing: 3,
    marginTop: 4,
    textAlign: 'center',
  },
  certDivider: {
    width: '80%',
    height: 1,
    backgroundColor: '#E5D3B3',
    marginVertical: 14,
  },
  certPrompt: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
  },
  certWorkerName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A2E',
    marginVertical: 6,
    textAlign: 'center',
  },
  certTrade: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 1.5,
    marginVertical: 6,
    textAlign: 'center',
  },
  certScoreContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 8,
  },
  certScoreValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  certScoreMax: {
    fontSize: 14,
    color: '#8C7853',
    marginBottom: 4,
    marginLeft: 2,
    fontWeight: '600',
  },
  certMetaGrid: {
    width: '100%',
    backgroundColor: '#F7F4EB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5D3B3',
  },
  certMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  certMetaRowCol: {
    flexDirection: 'column',
    marginBottom: 8,
  },
  certMetaLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8C7853',
  },
  certMetaValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2C2C2C',
  },
  certMetaValueMono: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#444',
    marginTop: 2,
    backgroundColor: '#EFECE2',
    padding: 4,
    borderRadius: 4,
  },
  certFooter: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8C7853',
    letterSpacing: 1.5,
    marginTop: 14,
    textAlign: 'center',
  },
  certCloseBtn: {
    marginTop: 20,
    backgroundColor: '#D4AF37',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  certCloseBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statPill: {
    flex: 1,
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statPillValue: { fontSize: 16, fontWeight: '700', color: '#1565C0' },
  statPillLabel: { fontSize: 11, color: '#666', marginTop: 2 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
    elevation: 2,
  },
  verifyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
  },
  infoIcon: { fontSize: 20 },
  infoLabel: { fontSize: 12, color: '#888' },
  infoValue: { fontSize: 14, color: '#1A1A2E', fontWeight: '500', marginTop: 2 },
  skillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  skillTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  skillText: { color: '#1565C0', fontWeight: '500', fontSize: 13 },
  editButton: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#1565C0',
  },
  editButtonText: { color: '#1565C0', fontSize: 16, fontWeight: '600' },
  getVerifiedBtn: {
    backgroundColor: '#1565C0',
    margin: 14,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  getVerifiedBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
