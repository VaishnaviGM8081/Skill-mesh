import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
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

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const headers = await getAuthHeaders();
      let json;

      // Try by workerId first; fall back to /me if not stored yet
      const workerId = await SecureStore.getItemAsync('workerId');
      if (workerId) {
        const res = await fetch(`${API_URL}/api/workers/${workerId}/profile`, { headers });
        json = await res.json().catch(() => ({}));
      }

      // Fallback to /me if workerId missing or request failed
      if (!json?.success) {
        const res2 = await fetch(`${API_URL}/api/workers/me`, { headers });
        const json2 = await res2.json().catch(() => ({}));
        if (json2.success && json2.data) {
          // Store for future use
          await SecureStore.setItemAsync('workerId', String(json2.data.id));
          // Wrap into same shape as getProfile response
          json = {
            success: true,
            data: {
              ...json2.data,
              stats: { total_jobs: 0, avg_rating: json2.data.average_rating || null },
            }
          };
        } else {
          throw new Error(json2.error || 'Failed to load profile');
        }
      }

      if (!json.success) throw new Error(json.error || 'Failed to load profile');
      setProfile(json.data);
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

  async function handleSignOut() {
    await supabase.auth.signOut();
    await clearAuthStorage();
    // Route to RoleSelection (works in both DEV and production modes)
    navigation.reset({ index: 0, routes: [{ name: 'RoleSelection' }] });
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

        <Text style={styles.sectionTitle}>Verification</Text>
        <View style={styles.card}>
          <View style={[styles.verifyRow, styles.verifyBorder]}>
            <Text style={styles.verifyLabel}>Phone (Supabase)</Text>
            <View style={[styles.verifyBadge, styles.verifiedBg]}>
              <Text style={[styles.verifyStatus, styles.verifiedText]}>✓ Signed in</Text>
            </View>
          </View>
          <View style={styles.verifyRow}>
            <Text style={styles.verifyLabel}>Skill videos</Text>
            <View style={[styles.verifyBadge, styles.pendingBg]}>
              <Text style={[styles.verifyStatus, styles.pendingText]}>
                {skills.filter((s) => s.video_url).length}/{Math.max(skills.length, 1)} uploaded
              </Text>
            </View>
          </View>
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
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>
                {(() => {
                  const loc = profile.location;
                  if (!loc) return '—';
                  // Parse GeoJSON Point and show readable coordinates
                  try {
                    const parsed = typeof loc === 'string' ? JSON.parse(loc) : loc;
                    if (parsed?.coordinates) {
                      const [lng, lat] = parsed.coordinates;
                      return `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
                    }
                  } catch (_) {}
                  return String(loc);
                })()}
              </Text>
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
});
