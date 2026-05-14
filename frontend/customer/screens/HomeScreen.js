import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

const services = [
  { id: 1, name: 'Plumber', icon: '🔧', workers: 24, avgPrice: '₹400–600' },
  { id: 2, name: 'Electrician', icon: '⚡', workers: 18, avgPrice: '₹350–550' },
  { id: 3, name: 'Carpenter', icon: '🪚', workers: 12, avgPrice: '₹500–800' },
  { id: 4, name: 'Painter', icon: '🖌️', workers: 9, avgPrice: '₹600–1200' },
  { id: 5, name: 'Cleaner', icon: '🧹', workers: 20, avgPrice: '₹250–400' },
  { id: 6, name: 'Mechanic', icon: '🔩', workers: 15, avgPrice: '₹400–700' },

];

export default function HomeScreen({ navigation, apiState }) {
  const [search, setSearch] = useState('');
  const [profileVisible, setProfileVisible] = useState(false);
  const [user, setUser] = useState(null);
  useEffect(() => {
    loadUser();
  }, []);
  const loadUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      setUser(session.user);
    }
  };

  const handleSignOut = async () => {
    try {

      await supabase.auth.signOut();

      setProfileVisible(false);
      setUser(null);

      Alert.alert('Signed out successfully');

      navigation.reset({
        index: 0,
        routes: [{ name: 'PhoneAuth' }],
      });

    } catch (err) {

      console.log(err);

      Alert.alert('Logout failed');
    }
  };

  const filtered = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.location}>📍 Pattanagere, Bengaluru</Text>
            <Text style={styles.title}>What do you need?</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarBox}
            onPress={() => setProfileVisible(true)}
          >
            <Text style={styles.avatarText}>
              {user?.email
                ? user.email[0].toUpperCase()
                : 'G'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search plumber, electrician..."
            placeholderTextColor="#aaa"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Urgent Banner */}
        <TouchableOpacity
          style={styles.urgentBanner}
          onPress={() => navigation.navigate('BookService', { urgent: true })}
        >
          <Text style={styles.urgentIcon}>🚨</Text>
          <View style={styles.urgentText}>
            <Text style={styles.urgentTitle}>Need help right now?</Text>
            <Text style={styles.urgentSub}>Get a worker in 30 minutes</Text>
          </View>
          <Text style={styles.urgentArrow}>→</Text>
        </TouchableOpacity>

        {/* Services Grid */}
        <Text style={styles.sectionTitle}>All Services</Text>
        <View style={styles.grid}>
          {filtered.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceCard}
              onPress={() => navigation.navigate('BookService', { service })}
            >
              <Text style={styles.serviceIcon}>{service.icon}</Text>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceWorkers}>{service.workers} nearby</Text>
              <Text style={styles.servicePrice}>{service.avgPrice}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Real backend match button */}
        {apiState?.requestLiveMatch && (
          <>
            <TouchableOpacity
              style={styles.liveMatchBtn}
              onPress={apiState.requestLiveMatch}
            >
              <Text style={styles.liveMatchText}>
                🤖 Find Live Match (AI)
              </Text>
            </TouchableOpacity>

            {/* Matched Worker Card */}
            {apiState?.matchedWorker && (
              <View
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  padding: 18,
                  marginBottom: 24,
                  elevation: 3,
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: '700',
                    marginBottom: 14,
                    color: '#1A1A2E',
                  }}
                >
                  🎯 Worker Matched
                </Text>

                <Text style={{ fontSize: 15, marginBottom: 8 }}>
                  👤 {apiState.matchedWorker.name}
                </Text>

                <Text style={{ fontSize: 15, marginBottom: 8 }}>
                  🛠 {apiState.matchedWorker.trade}
                </Text>

                <Text style={{ fontSize: 15, marginBottom: 8 }}>
                  ⭐ {apiState.matchedWorker.rating}
                </Text>

                <Text style={{ fontSize: 15, marginBottom: 14 }}>
                  📍 {apiState.matchedWorker.eta}
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('BookService')
                  }
                  style={{
                    backgroundColor: '#6A1B9A',
                    padding: 14,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: '#fff',
                      fontWeight: '700',
                      fontSize: 15,
                    }}
                  >
                    Continue Booking →
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}



        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Your Recent Jobs</Text>
        <View style={styles.recentCard}>
          <View style={styles.recentRow}>
            <Text style={styles.recentIcon}>🔧</Text>
            <View style={styles.recentInfo}>
              <Text style={styles.recentTitle}>Plumbing — Pipe leak fixed</Text>
              <Text style={styles.recentSub}>Raju Kumar · 3 days ago</Text>
            </View>
            <View style={styles.recentRating}>
              <Text style={styles.ratingText}>⭐ 5.0</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
        <Modal
          visible={profileVisible}
          transparent
          animationType="slide"
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.4)',
              justifyContent: 'flex-end',
            }}
          >
            <View
              style={{
                backgroundColor: '#fff',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '700',
                  marginBottom: 20,
                }}
              >
                My Account
              </Text>

              <Text
                style={{
                  fontSize: 15,
                  marginBottom: 8,
                }}
              >
                Logged in as:
              </Text>

              <Text
                style={{
                  fontSize: 16,
                  color: '#555',
                  marginBottom: 24,
                }}
              >
                {user?.email || 'Guest User'}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  setProfileVisible(false);
                  navigation.navigate('PhoneAuth');
                }}
                style={{
                  backgroundColor: '#1565C0',
                  padding: 16,
                  borderRadius: 14,
                  marginBottom: 14,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: '#fff',
                    fontWeight: '700',
                    fontSize: 15,
                  }}
                >
                  Sign In
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSignOut}
                style={{
                  backgroundColor: '#D32F2F',
                  padding: 16,
                  borderRadius: 14,
                  marginBottom: 14,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: '#fff',
                    fontWeight: '700',
                    fontSize: 15,
                  }}
                >
                  Sign Out
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setProfileVisible(false)}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    color: '#666',
                    marginTop: 8,
                  }}
                >
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  container: { flex: 1, padding: 20 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 20, marginTop: 10,
  },
  location: { fontSize: 13, color: '#666', marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '700', color: '#1A1A2E' },
  avatarBox: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#6A1B9A',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 16, elevation: 2, gap: 10,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: '#333' },
  urgentBanner: {
    backgroundColor: '#B71C1C', borderRadius: 14,
    padding: 16, flexDirection: 'row',
    alignItems: 'center', marginBottom: 24, gap: 12,
  },
  urgentIcon: { fontSize: 24 },
  urgentText: { flex: 1 },
  urgentTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  urgentSub: { fontSize: 12, color: '#FFCDD2', marginTop: 2 },
  urgentArrow: { fontSize: 20, color: '#fff' },
  sectionTitle: {
    fontSize: 16, fontWeight: '700',
    color: '#1A1A2E', marginBottom: 14,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 12, marginBottom: 24,
  },
  serviceCard: {
    backgroundColor: '#fff', borderRadius: 14,
    padding: 16, width: '47%',
    elevation: 2, alignItems: 'flex-start',
  },
  serviceIcon: { fontSize: 32, marginBottom: 8 },
  serviceName: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  serviceWorkers: { fontSize: 12, color: '#4CAF50', marginTop: 4 },
  servicePrice: { fontSize: 12, color: '#888', marginTop: 2 },
  recentCard: {
    backgroundColor: '#fff', borderRadius: 14,
    padding: 16, elevation: 2,
  },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recentIcon: { fontSize: 24 },
  recentInfo: { flex: 1 },
  recentTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  recentSub: { fontSize: 12, color: '#888', marginTop: 2 },
  recentRating: {
    backgroundColor: '#FFF8E1', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 20,
  },
  ratingText: { fontSize: 12, fontWeight: '600', color: '#F57F17' },
  liveMatchBtn: {
    backgroundColor: '#6A1B9A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },

  liveMatchText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
}); 
