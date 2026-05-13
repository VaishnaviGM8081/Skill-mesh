import React, { useCallback, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, Alert, View, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from './apiConfig';
import { LanguageProvider } from './LanguageContext';
import { getAuthHeaders } from './lib/authFetch';

import PhoneAuthScreen from './screens/PhoneAuthScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import DashboardScreen from './screens/DashboardScreen';
import JobAlertScreen from './screens/JobAlertScreen';
import ProfileScreen from './screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export const apiToggleStatus = async (isOnline, setIsOnline, setJobAlert) => {
  const nextStatus = !isOnline;
  setIsOnline(nextStatus);
  try {
    const workerId = await SecureStore.getItemAsync('workerId');
    const headers = await getAuthHeaders();
    await fetch(`${API_URL}/api/workers/${workerId}/availability`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ availability_status: nextStatus }),
    });
  } catch (e) {
    console.error('Availability sync error', e);
  }
  if (nextStatus) {
    setTimeout(() => {
      setJobAlert({
        id: '1',
        customer: 'Srikanth',
        distance: '12 min away',
        price: '₹500',
      });
    }, 3000);
  } else {
    setJobAlert(null);
  }
};

export const apiAcceptJob = async (jobAlert, setActiveJob, setJobAlert) => {
  const job = jobAlert || { id: 'demo-1', customer: 'Srikanth', distance: '12 min away', price: '₹500' };
  try {
    const headers = await getAuthHeaders();
    await fetch(`${API_URL}/api/jobs/${job.id}/accept`, {
      method: 'POST',
      headers,
    });
  } catch (e) {
    console.error('Accept Job Error', e);
  }
  setActiveJob(job);
  setJobAlert(null);
};

export const apiCompleteJob = async (activeJob, setActiveJob, setIsOnline) => {
  try {
    const headers = await getAuthHeaders();
    await fetch(`${API_URL}/api/jobs/${activeJob.id}/complete`, {
      method: 'POST',
      headers,
    });
    Alert.alert('Job Completed! 🎉', 'Escrow funds have been successfully released to your wallet.');
    setActiveJob(null);
    setIsOnline(false);
  } catch (e) {
    console.error('Complete Job Error', e);
  }
};

function MainTabs({ apiState }) {
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
        tabBarActiveTintColor: '#1565C0',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text>,
        }}
      >
        {(props) => <DashboardScreen {...props} apiState={apiState} />}
      </Tab.Screen>

      <Tab.Screen
        name="JobAlert"
        options={{
          tabBarLabel: 'New Job',
          tabBarIcon: () => (
            <Text style={{ fontSize: 20 }}>{apiState.jobAlert ? '🔔' : '🔕'}</Text>
          ),
        }}
      >
        {(props) => <JobAlertScreen {...props} apiState={apiState} />}
      </Tab.Screen>

      <Tab.Screen
        name="Profile"
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text>,
        }}
      >
        {(props) => <ProfileScreen {...props} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [initialRoute, setInitialRoute] = useState('PhoneAuth');

  const refreshRouteFromStorage = useCallback(async () => {
    const token = await SecureStore.getItemAsync('accessToken');
    const workerId = await SecureStore.getItemAsync('workerId');
    if (!token) setInitialRoute('PhoneAuth');
    else if (!workerId) setInitialRoute('Onboarding');
    else setInitialRoute('Main');
  }, []);

  useEffect(() => {
    (async () => {
      await refreshRouteFromStorage();
      setBooting(false);
    })();
  }, [refreshRouteFromStorage]);

  const [isOnline, setIsOnline] = useState(false);
  const [jobAlert, setJobAlert] = useState(null);
  const [activeJob, setActiveJob] = useState(null);

  const apiState = {
    isOnline,
    setIsOnline,
    jobAlert,
    setJobAlert,
    activeJob,
    setActiveJob,
    API_URL,
    toggleStatus: () => apiToggleStatus(isOnline, setIsOnline, setJobAlert),
    acceptJob: () => apiAcceptJob(jobAlert, setActiveJob, setJobAlert),
    completeJob: () => apiCompleteJob(activeJob, setActiveJob, setIsOnline),
  };

  if (booting) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4FF' }}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={{ marginTop: 12, color: '#666' }}>Starting SkillMesh…</Text>
      </View>
    );
  }

  return (
    <LanguageProvider>
      <NavigationContainer>
        <Stack.Navigator
          key={initialRoute}
          initialRouteName={initialRoute}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Main">{(props) => <MainTabs {...props} apiState={apiState} />}</Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </LanguageProvider>
  );
}
