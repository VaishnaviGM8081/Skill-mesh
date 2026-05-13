import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, Alert } from 'react-native';

// Your screens
import HomeScreen from './screens/HomeScreen';
import BookServiceScreen from './screens/BookServiceScreen';
import JobTrackingScreen from './screens/JobTrackingScreen';

// Real backend URL (your friend's)
const API_URL = 'http://10.124.46.38:3000';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ── Real API functions from your friend's code ──

// Calls real geo-matching backend
export const apiRequestLiveMatch = async (search, setMatchedWorker) => {
  try {
    const res = await fetch(`${API_URL}/api/jobs/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: 1,
        trade_category: search.toLowerCase(),
        latitude: 12.9352,  // Koramangala demo coords
        longitude: 77.6245,
      }),
    });
    const json = await res.json();
    if (json.success && json.data.worker) {
      setMatchedWorker({
        name: json.data.worker.name,
        trade: json.data.worker.trade_category,
        badge: json.data.worker.verification_level,
        eta: `${json.data.worker.dist_meters} meters away`,
        price: '₹350 - ₹500',
        rating: 4.8,
        id: json.data.worker.id,
      });
    } else {
      Alert.alert('No workers found nearby!', 'Try a different service or area.');
    }
  } catch (e) {
    console.error('Match API Error', e);
    Alert.alert('Backend offline', 'Running in demo mode.');
  }
};

// Calls real escrow/payment backend
export const apiConfirmEscrowBooking = async (matchedWorker, setMatchedWorker) => {
  try {
    Alert.alert('Initializing Secure Escrow...');
    const paymentReq = await fetch(`${API_URL}/api/gateway/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount_inr: 450 }), // Mock pricing
    });
    const orderData = await paymentReq.json();
    if (orderData.success) {
      Alert.alert(
        'Escrow Funded! 🎉',
        `Order ID: ${orderData.order_id}\nWorker is on the way!`
      );
      setMatchedWorker(null);
    }
  } catch (e) {
    Alert.alert('Escrow connection failed', 'Running in demo mode.');
  }
};

// ── Home Screen wrapper that adds real API ──
function HomeScreenWithAPI({ navigation }) {
  const [matchedWorker, setMatchedWorker] = useState(null);
  const [search, setSearch] = useState('');

  const apiState = {
    matchedWorker,
    setMatchedWorker,
    search,
    setSearch,
    API_URL,
    requestLiveMatch: () => apiRequestLiveMatch(search, setMatchedWorker),
    confirmEscrowBooking: () => apiConfirmEscrowBooking(matchedWorker, setMatchedWorker),
  };

  return <HomeScreen navigation={navigation} apiState={apiState} />;
}

// ── Bottom tabs ──
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0.5,
          borderTopColor: '#eee',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#6A1B9A',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreenWithAPI}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="BookService"
        component={BookServiceScreen}
        options={{
          tabBarLabel: 'Book',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🔍</Text>,
        }}
      />
      <Tab.Screen
        name="JobTracking"
        component={JobTrackingScreen}
        options={{
          tabBarLabel: 'Track Job',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>📍</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

// ── Root ──
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="BookService" component={BookServiceScreen} />
        <Stack.Screen name="JobTracking" component={JobTrackingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}