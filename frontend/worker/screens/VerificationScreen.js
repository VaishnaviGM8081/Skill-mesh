import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { getAuthHeaders } from '../lib/authFetch';
import { API_URL } from '../apiConfig';
import * as SecureStore from 'expo-secure-store';

export default function VerificationScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [idPhoto, setIdPhoto] = useState(null);
  const [certPhoto, setCertPhoto] = useState(null);

  const pickImage = async (setter) => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setter(result.assets[0].uri);
    }
  };

  const uploadToStorage = async (uri, type) => {
    const workerId = await SecureStore.getItemAsync('workerId');
    const fileName = `${type}_${workerId}_${Date.now()}.jpg`;
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: fileName,
      type: 'image/jpeg',
    });

    const { data, error } = await supabase.storage
      .from('worker-kyc')
      .upload(`${workerId}/${fileName}`, formData, {
        contentType: 'image/jpeg',
      });

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('worker-kyc')
      .getPublicUrl(`${workerId}/${fileName}`);

    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!idPhoto || !certPhoto) {
      return Alert.alert('Missing Documents', 'Please upload both your ID and Certificate.');
    }

    setLoading(true);
    try {
      const workerId = await SecureStore.getItemAsync('workerId');
      
      const idUrl = await uploadToStorage(idPhoto, 'id');
      const certUrl = await uploadToStorage(certPhoto, 'cert');

      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/api/workers/${workerId}/kyc`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          id_card_url: idUrl,
          certificate_url: certUrl
        }),
      });

      const json = await res.json();
      if (json.success) {
        Alert.alert('Success!', 'Documents submitted for review. Admin will verify soon.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        throw new Error(json.error);
      }
    } catch (e) {
      Alert.alert('Upload Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Worker Verification</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>🛡️ To get the "Verified" badge, please upload clear photos of your Government ID and Trade Certificate.</Text>
        </View>

        <Text style={styles.label}>1. Government ID (Aadhaar / Voter ID)</Text>
        <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage(setIdPhoto)}>
          {idPhoto ? (
            <Image source={{ uri: idPhoto }} style={styles.preview} />
          ) : (
            <Text style={styles.uploadText}>📷 Take Photo of ID</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>2. Trade Certificate (Optional but Recommended)</Text>
        <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage(setCertPhoto)}>
          {certPhoto ? (
            <Image source={{ uri: certPhoto }} style={styles.preview} />
          ) : (
            <Text style={styles.uploadText}>📷 Take Photo of Certificate</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit for Verification</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  backText: { color: '#1565C0', fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700', color: '#1A1A2E' },
  infoBox: { backgroundColor: '#E3F2FD', padding: 16, borderRadius: 12, marginBottom: 24 },
  infoText: { color: '#1565C0', lineHeight: 20, fontSize: 14 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 12 },
  uploadBox: {
    backgroundColor: '#fff',
    height: 180,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden'
  },
  uploadText: { color: '#999', fontWeight: '600' },
  preview: { width: '100%', height: '100%' },
  submitBtn: {
    backgroundColor: '#1565C0',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
