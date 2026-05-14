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
import ActiveJobScreen from './screens/ActiveJobScreen';
import RoleSelectionScreen from './screens/RoleSelectionScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export const apiToggleStatus = async (isOnline, setIsOnline, setJobAlert) => {
  const nextStatus = !isOnline;
  setIsOnline(nextStatus);
  try {
    const headers = await getAuthHeaders();
    await fetch(`${API_URL}/api/workers/profile`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ availability_status: nextStatus }),
    });
  } catch (e) {
    console.error('Availability sync error', e);
  }
};

export const apiAcceptJob = async (jobAlert, setActiveJob, setJobAlert) => {
  if (!jobAlert) return;
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/jobs/${jobAlert.id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'in_progress' })
    });
    const data = await res.json();
    if (data.success) {
      setActiveJob(data.data);
      setJobAlert(null);
    }
  } catch (e) {
    console.error('Accept Job Error', e);
  }
};

export const apiCompleteJob = async (activeJob, setActiveJob, setIsOnline) => {
  if (!activeJob) return;
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/jobs/${activeJob.id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'completed' })
    });
    const data = await res.json();
    if (data.success) {
      Alert.alert('Job Completed! 🎉', 'Job has been successfully marked as completed.');
      setActiveJob(null);
      setIsOnline(false);
    }
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
        name="ActiveJob"
        options={{
          tabBarLabel: 'My Job',
          tabBarIcon: () => (
            <View>
              <Text style={{ fontSize: 20 }}>🔧</Text>
              {apiState.activeJob && (
                <View style={{ position: 'absolute', top: -2, right: -4, width: 10, height: 10, borderRadius: 5, backgroundColor: '#2E7D32', borderWidth: 1.5, borderColor: '#fff' }} />
              )}
            </View>
          ),
        }}
      >
        {(props) => <ActiveJobScreen {...props} apiState={apiState} />}
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
    // TEMP DEV AUTH MODE
    const DEV_MODE = false;
    const TEST_WORKER_UID = "11111111-1111-1111-1111-111111111111";

    const token = await SecureStore.getItemAsync('accessToken');

    if (!token) setInitialRoute('PhoneAuth');
    else {
      const workerId = await SecureStore.getItemAsync('workerId');
      if (!workerId) setInitialRoute('Onboarding');
      else setInitialRoute('Main');
    }
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

  useEffect(() => {
    let interval;
    if (isOnline && !activeJob && !jobAlert) {
      interval = setInterval(async () => {
        try {
          const headers = await getAuthHeaders();
          const res = await fetch(`${API_URL}/api/jobs/worker`, { headers });
          const json = await res.json();
          if (json.success && json.data.length > 0) {
            setJobAlert(json.data[0]); // Show first pending job
          }
        } catch (e) {
          console.error('Job polling error', e);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isOnline, activeJob, jobAlert]);

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
          <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
          <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Main">{(props) => <MainTabs {...props} apiState={apiState} />}</Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </LanguageProvider>
  );
}
