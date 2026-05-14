import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export default function RoleSelectionScreen({ navigation }) {
  // TEMP DEV AUTH MODE
  const TEST_CUSTOMER_UID = "22222222-2222-2222-2222-222222222222";

  const handleCustomer = async () => {
    await SecureStore.setItemAsync('accessToken', TEST_CUSTOMER_UID);
    navigation.replace('Main');
  };

  const handleReset = async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('customerId');
    Alert.alert('Reset', 'App state cleared. Please restart app to see role selection.');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.logo}>⚡</Text>
        <Text style={styles.title}>SkillMesh</Text>
        <Text style={styles.subtitle}>Choose your role to continue</Text>

        <TouchableOpacity style={[styles.roleCard, styles.disabledCard]} disabled>
          <Text style={styles.roleIcon}>👷</Text>
          <View>
            <Text style={styles.roleTitle}>Continue as Worker</Text>
            <Text style={styles.roleSub}>(Please use the Worker App)</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.roleCard} onPress={handleCustomer}>
          <Text style={styles.roleIcon}>🛍️</Text>
          <View>
            <Text style={styles.roleTitle}>Continue as Customer</Text>
            <Text style={styles.roleSub}>Book services in seconds</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={{ marginTop: 40 }} onPress={handleReset}>
          <Text style={{ color: '#6A1B9A', fontWeight: '600' }}>[DEV] Reset App Data</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3E5F5' },
  container: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  logo: { fontSize: 64, marginBottom: 12 },
  title: { fontSize: 32, fontWeight: '800', color: '#6A1B9A', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 40 },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    width: '100%',
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  disabledCard: { opacity: 0.6, backgroundColor: '#f5f5f5' },
  roleIcon: { fontSize: 32, marginRight: 16 },
  roleTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  roleSub: { fontSize: 13, color: '#666', marginTop: 2 },
});
