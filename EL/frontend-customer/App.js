import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
// IMPORTANT: Replace this with your actual computer's local Wi-Fi IP address when testing on a physical phone
const API_URL = 'http://10.124.46.38:3000';

export default function App() {
  const [search, setSearch] = useState('');
  const [matchedWorker, setMatchedWorker] = useState(null);

  const requestLiveMatch = async () => {
    try {
       const res = await fetch(`${API_URL}/api/jobs/request`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ 
            customer_id: 1, 
            trade_category: search.toLowerCase(),
            latitude: 12.9352, // Hardcoded to Koramangala for Demo
            longitude: 77.6245
         })
       });
       const json = await res.json();
       if (json.success && json.data.worker) {
         setMatchedWorker({ 
           name: json.data.worker.name, 
           trade: json.data.worker.trade_category, 
           badge: json.data.worker.verification_level, 
           eta: `${json.data.worker.dist_meters} meters away`, 
           price: '₹350 - ₹500' // Pulled from Pricing later
         });
       } else {
         alert("No workers found exactly nearby!");
       }
    } catch (e) {
       console.error("Match API Error", e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, Srikanth!</Text>
          <Text style={styles.subtitle}>Find verified tradespeople near you</Text>
        </View>

        {!matchedWorker ? (
          <>
            <View style={styles.searchBox}>
              <TextInput 
                style={styles.input} 
                placeholder="What do you need? (e.g. 'plumber in Koramangala')" 
                placeholderTextColor="#94a3b8"
                value={search}
                onChangeText={setSearch}
              />
              <TouchableOpacity style={styles.button} onPress={requestLiveMatch}>
                <Text style={styles.buttonText}>Find Live Match</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.categories}>
              <Text style={styles.sectionTitle}>Common Services</Text>
              <View style={styles.grid}>
                {['Plumbing', 'Electrical', 'Carpentry', 'Painting'].map(c => (
                  <TouchableOpacity key={c} style={styles.card} onPress={() => setSearch(c)}>
                    <Text style={styles.cardText}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        ) : (
          <View style={styles.matchContainer}>
            <Text style={styles.sectionTitle}>Match Found!</Text>
            <View style={styles.matchCard}>
              <View style={styles.matchHeader}>
                <Text style={styles.workerName}>{matchedWorker.name}</Text>
                <View style={styles.badge}><Text style={styles.badgeText}>{matchedWorker.badge}</Text></View>
              </View>
              <Text style={styles.workerTrade}>{matchedWorker.trade} • ⭐ 4.8 (120 jobs)</Text>
              
              <View style={styles.matchDetails}>
                <Text style={styles.detailText}>🚦 {matchedWorker.eta}</Text>
                <Text style={styles.detailText}>💰 Est: {matchedWorker.price}</Text>
              </View>
              
              <TouchableOpacity style={styles.bookButton} onPress={async () => {
                 try {
                   alert("Initializing Secure Escrow...");
                   const paymentReq = await fetch(`${API_URL}/api/gateway/create-order`, {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ amount_inr: 450 }) // Mock pricing
                   });
                   const orderData = await paymentReq.json();

                   if(orderData.success) {
                     alert(`Escrow Funded Successfully! Order ID: ${orderData.order.id}`);
                     setMatchedWorker(null); // Return to home on success
                   }
                 } catch(e) {
                   alert("Escrow connection failed!");
                 }
              }}>
                <Text style={styles.buttonText}>Confirm Escrow Booking</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{marginTop: 15}} onPress={() => setMatchedWorker(null)}>
                <Text style={{color: '#94a3b8', textAlign: 'center'}}>Cancel</Text>
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
  header: { marginBottom: 30, marginTop: 40 },
  greeting: { fontSize: 28, fontWeight: 'bold', color: '#f8fafc' },
  subtitle: { fontSize: 16, color: '#94a3b8', marginTop: 5 },
  searchBox: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 30 },
  input: { backgroundColor: '#0f172a', color: '#fff', borderRadius: 8, padding: 15, marginBottom: 15, fontSize: 16 },
  button: { backgroundColor: '#8b5cf6', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  categories: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, color: '#f8fafc', fontWeight: 'bold', marginBottom: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { backgroundColor: '#1e293b', width: (width - 50) / 2, padding: 20, borderRadius: 12, marginBottom: 10, alignItems: 'center' },
  cardText: { color: '#e2e8f0', fontWeight: '500' },
  matchContainer: { marginTop: 10 },
  matchCard: { backgroundColor: '#1e293b', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
  matchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  workerName: { fontSize: 22, color: '#fff', fontWeight: 'bold' },
  badge: { backgroundColor: 'rgba(139, 92, 246, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#a78bfa', fontWeight: 'bold', fontSize: 12 },
  workerTrade: { color: '#94a3b8', marginTop: 5, fontSize: 14 },
  matchDetails: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginBottom: 20, backgroundColor: '#0f172a', padding: 15, borderRadius: 10 },
  detailText: { color: '#fff', fontWeight: '500' },
  bookButton: { backgroundColor: '#10b981', padding: 15, borderRadius: 8, alignItems: 'center' }
});
