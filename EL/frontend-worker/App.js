import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, Alert } from 'react-native';

// Screens
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import JobAlertScreen from './screens/JobAlertScreen';
import ProfileScreen from './screens/ProfileScreen';

// ── Real backend URL (your friend's) ──
const API_URL = 'http://10.124.46.38:3000';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ── All real API functions from your friend's code ──
export const apiToggleStatus = async (isOnline, setIsOnline, setJobAlert) => {
  const nextStatus = !isOnline;
  setIsOnline(nextStatus);
  try {
    await fetch(`${API_URL}/api/workers/20/availability`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ availability_status: nextStatus }),
    });
  } catch (e) {
    console.error('Redis Sync Error', e);
  }
  if (nextStatus) {
    // Simulate incoming job after going online (demo)
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
  // If no real job from backend, use the demo job
  const job = jobAlert || { id: 'demo-1', customer: 'Srikanth', distance: '12 min away', price: '₹500' };
  try {
    await fetch(`${API_URL}/api/jobs/${job.id}/accept`, {
      method: 'POST',
    });
  } catch (e) {
    console.error('Accept Job Error (backend offline - demo mode)', e);
  }
  // Always update UI regardless of backend status
  setActiveJob(job);
  setJobAlert(null);
};

export const apiCompleteJob = async (activeJob, setActiveJob, setIsOnline) => {
  try {
    await fetch(`${API_URL}/api/jobs/${activeJob.id}/complete`, {
      method: 'POST',
    });
    Alert.alert(
      'Job Completed! 🎉',
      'Escrow funds have been successfully released to your wallet.'
    );
    setActiveJob(null);
    setIsOnline(false);
  } catch (e) {
    console.error('Complete Job Error', e);
  }
};

// ── Main tab navigator ──
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
        {props => <DashboardScreen {...props} apiState={apiState} />}
      </Tab.Screen>

      <Tab.Screen
        name="JobAlert"
        options={{
          tabBarLabel: 'New Job',
          tabBarIcon: () => (
            <Text style={{ fontSize: 20 }}>
              {apiState.jobAlert ? '🔔' : '🔕'}
            </Text>
          ),
        }}
      >
        {props => <JobAlertScreen {...props} apiState={apiState} />}
      </Tab.Screen>

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

// ── Root app ──
export default function App() {
  // Shared state — passed to screens so they can call real APIs
  const [isOnline, setIsOnline] = useState(false);
  const [jobAlert, setJobAlert] = useState(null);
  const [activeJob, setActiveJob] = useState(null);

  const apiState = {
    isOnline, setIsOnline,
    jobAlert, setJobAlert,
    activeJob, setActiveJob,
    API_URL,
    toggleStatus: () => apiToggleStatus(isOnline, setIsOnline, setJobAlert),
    acceptJob: () => apiAcceptJob(jobAlert, setActiveJob, setJobAlert),
    completeJob: () => apiCompleteJob(activeJob, setActiveJob, setIsOnline),
  };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main">
          {props => <MainTabs {...props} apiState={apiState} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}