import React, { useCallback, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, Alert, View, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from './apiConfig';
import { getAuthHeaders } from './lib/authFetch';

import CustomerPhoneAuthScreen from './screens/CustomerPhoneAuthScreen';
import HomeScreen from './screens/HomeScreen';
import BookServiceScreen from './screens/BookServiceScreen';
import JobTrackingScreen from './screens/JobTrackingScreen';
import RoleSelectionScreen from './screens/RoleSelectionScreen';
import CustomerOnboardingScreen from './screens/CustomerOnboardingScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export const apiRequestLiveMatch = async (search, setMatchedWorker) => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/jobs/request`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        trade_category: search.toLowerCase(),
        latitude: 12.9352,
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
      Alert.alert('No workers found nearby!', json.error || 'Try a different service or area.');
    }
  } catch (e) {
    console.error('Match API Error', e);
    Alert.alert('Backend offline', 'Could not reach SkillMesh API.');
  }
};

export const apiConfirmEscrowBooking = async (matchedWorker, setMatchedWorker) => {
  try {
    Alert.alert('Initializing Secure Escrow...');
    const headers = await getAuthHeaders();
    const paymentReq = await fetch(`${API_URL}/api/gateway/create-order`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ amount_inr: 450 }),
    });
    const orderData = await paymentReq.json();
    if (orderData.success) {
      Alert.alert('Escrow Funded! 🎉', `Order ID: ${orderData.order?.id || 'n/a'}\nWorker is on the way!`);
      setMatchedWorker(null);
    }
  } catch (e) {
    Alert.alert('Escrow connection failed', 'Running in demo mode.');
  }
};

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

export default function App() {
  const [booting, setBooting] = useState(true);
  const [initialRoute, setInitialRoute] = useState('PhoneAuth');

  const refreshRouteFromStorage = useCallback(async () => {
    // TEMPORARILY BYPASSED AUTHENTICATION FOR TESTING
    setInitialRoute('Main');
  }, []);

  useEffect(() => {
    (async () => {
      await refreshRouteFromStorage();
      setBooting(false);
    })();
  }, [refreshRouteFromStorage]);

  if (booting) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3E5F5' }}>
        <ActivityIndicator size="large" color="#6A1B9A" />
        <Text style={{ marginTop: 12, color: '#555' }}>Loading…</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator key={initialRoute} initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        <Stack.Screen name="PhoneAuth" component={CustomerPhoneAuthScreen} />
        <Stack.Screen name="Onboarding" component={CustomerOnboardingScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="BookService" component={BookServiceScreen} />
        <Stack.Screen name="JobTracking" component={JobTrackingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
