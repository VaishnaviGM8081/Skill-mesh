import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const services = [
  { id: 1, name: 'Plumber', icon: '🔧', workers: 24, avgPrice: '₹400–600' },
  { id: 2, name: 'Electrician', icon: '⚡', workers: 18, avgPrice: '₹350–550' },
  { id: 3, name: 'Carpenter', icon: '🪚', workers: 12, avgPrice: '₹500–800' },
  { id: 4, name: 'Painter', icon: '🖌️', workers: 9, avgPrice: '₹600–1200' },
  { id: 5, name: 'Driver', icon: '🚗', workers: 31, avgPrice: '₹300–500' },
  { id: 6, name: 'Cleaner', icon: '🧹', workers: 20, avgPrice: '₹250–400' },
  { id: 7, name: 'Mechanic', icon: '🔩', workers: 15, avgPrice: '₹400–700' },
  { id: 8, name: 'Delivery', icon: '📦', workers: 28, avgPrice: '₹200–350' },
];

export default function HomeScreen({ navigation, apiState }) {
  const [search, setSearch] = useState('');

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
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>PS</Text>
          </View>
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
          <TouchableOpacity
            style={styles.liveMatchBtn}
            onPress={apiState.requestLiveMatch}
          >
            <Text style={styles.liveMatchText}>🤖 Find Live Match (AI)</Text>
          </TouchableOpacity>
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
