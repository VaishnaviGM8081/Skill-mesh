/**
 * ActiveJobScreen.js — Worker App
 * Shows the active in-progress job with customer contact, directions, and complete/cancel actions.
 */
import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Linking, ActivityIndicator, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuthHeaders } from '../lib/authFetch';
import { API_URL } from '../apiConfig';

import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';

export default function ActiveJobScreen({ apiState, navigation }) {
  const job = apiState?.activeJob;
  const [completing, setCompleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [photo, setPhoto] = useState(null);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (uri) => {
    try {
      const fileName = `completion_${job.id}_${Date.now()}.jpg`;
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: fileName,
        type: 'image/jpeg',
      });

      const { data, error } = await supabase.storage
        .from('job-photos')
        .upload(`completions/${fileName}`, formData, {
          contentType: 'image/jpeg',
        });

      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('job-photos')
        .getPublicUrl(`completions/${fileName}`);

      return publicUrl;
    } catch (e) {
      console.error('Photo upload failed:', e);
      return null;
    }
  };

  if (!job) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Text style={styles.emptyIcon}>🎉</Text>
        <Text style={styles.emptyTitle}>No active job</Text>
        <Text style={styles.emptySub}>Accept a job from the Alerts tab to see it here.</Text>
      </SafeAreaView>
    );
  }

  const customer = job.customers || {};

  async function updateJobStatus(status, label) {
    if (status === 'completed' && !photo) {
      return Alert.alert('Photo Required', 'Please take a photo of the completed work as proof.');
    }

    const setter = status === 'completed' ? setCompleting : setCancelling;
    setter(true);
    try {
      let completionPhotoUrl = null;
      if (status === 'completed') {
        completionPhotoUrl = await uploadPhoto(photo);
      }

      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/api/jobs/${job.id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ 
          status,
          completion_photo_url: completionPhotoUrl 
        }),
      });
      const json = await res.json();
      if (!json.success) {
        Alert.alert('Error', json.error || `Failed to ${label.toLowerCase()} job.`);
        return;
      }
      // Clear active job from global state
      apiState?.setActiveJob?.(null);
      Alert.alert(
        status === 'completed' ? '✅ Job Completed!' : '❌ Job Cancelled',
        status === 'completed'
          ? `Great work! Payment of ₹${job.amount || '—'} will be released.`
          : 'Job has been cancelled.',
        [{ text: 'OK', onPress: () => {} }]
      );
    } catch (e) {
      Alert.alert('Network Error', 'Could not update job status. Check your connection.');
    } finally {
      setter(false);
    }
  }

  function callCustomer() {
    const phone = customer.phone;
    if (!phone) return Alert.alert('No phone', 'Customer phone not available.');
    Linking.openURL(`tel:${phone}`);
  }

  function getDirections() {
    const pincode = job.pincode;
    if (!pincode) return Alert.alert('No address', 'Customer address not available.');
    const url = `https://www.google.com/maps/search/?api=1&query=${pincode}+Bengaluru`;
    Linking.openURL(url);
  }

  const earnings = job.amount ? `₹${Number(job.amount).toLocaleString('en-IN')}` : '—';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Active Job</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>In Progress</Text>
          </View>
        </View>

        {/* Earnings card */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Job Earnings</Text>
          <Text style={styles.earningsAmount}>{earnings}</Text>
          <Text style={styles.earningsNote}>Released after job completion</Text>
        </View>

        {/* Customer Card */}
        <Text style={styles.sectionTitle}>Customer</Text>
        <View style={styles.card}>
          <View style={styles.customerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(customer.name || 'C').split(' ').map(n => n[0]).join('').slice(0, 2)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>{customer.name || 'Customer'}</Text>
              <Text style={styles.customerPhone}>{customer.phone || 'Phone not available'}</Text>
            </View>
            <TouchableOpacity 
              style={styles.chatBtn} 
              onPress={() => navigation.navigate('Chat', { jobId: job.id, customerName: customer.name })}
            >
              <Text style={{fontSize: 20}}>💬</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contactRow}>
            <TouchableOpacity style={styles.callBtn} onPress={callCustomer}>
              <Text style={styles.callBtnText}>📞  Call Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dirBtn} onPress={getDirections}>
              <Text style={styles.dirBtnText}>🗺  Directions</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Proof of Work */}
        <Text style={styles.sectionTitle}>Proof of Work (Required to Complete)</Text>
        <View style={styles.card}>
          <TouchableOpacity 
            style={[styles.photoBtn, photo && styles.photoBtnActive]} 
            onPress={pickPhoto}
          >
            <Text style={{fontSize: 24}}>📷</Text>
            <Text style={styles.photoBtnText}>
              {photo ? 'Photo Captured' : 'Take Completion Photo'}
            </Text>
          </TouchableOpacity>
          {photo && (
            <Image source={{ uri: photo }} style={styles.photoPreview} />
          )}
        </View>

        {/* Job Details */}
        <Text style={styles.sectionTitle}>Job Details</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={styles.detailText}>Pincode: {job.pincode || '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>🛠</Text>
            <Text style={styles.detailText}>{job.trade_category || job.notes || 'Service job'}</Text>
          </View>
          {job.notes && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📝</Text>
              <Text style={styles.detailText}>{job.notes}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.completeBtn, completing && { opacity: 0.7 }]}
          onPress={() =>
            Alert.alert('Complete Job?', 'Mark this job as completed?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Complete', onPress: () => updateJobStatus('completed', 'Complete') },
            ])
          }
          disabled={completing || cancelling}
        >
          {completing
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.completeBtnText}>✅  Mark as Completed</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cancelBtn, cancelling && { opacity: 0.7 }]}
          onPress={() =>
            Alert.alert('Cancel Job?', 'Are you sure you want to cancel this job?', [
              { text: 'No', style: 'cancel' },
              { text: 'Cancel Job', style: 'destructive', onPress: () => updateJobStatus('cancelled', 'Cancel') },
            ])
          }
          disabled={completing || cancelling}
        >
          {cancelling
            ? <ActivityIndicator color="#C62828" />
            : <Text style={styles.cancelBtnText}>✖  Cancel Job</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { justifyContent: 'center', alignItems: 'center', padding: 40 },
  container: { flex: 1, padding: 20 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  title: { fontSize: 22, fontWeight: '700', color: '#1A1A2E' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2E7D32' },
  liveText: { fontSize: 12, color: '#2E7D32', fontWeight: '600' },
  earningsCard: { backgroundColor: '#1565C0', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24 },
  earningsLabel: { fontSize: 13, color: '#90CAF9', marginBottom: 8 },
  earningsAmount: { fontSize: 42, fontWeight: '800', color: '#fff' },
  earningsNote: { fontSize: 12, color: '#BBDEFB', marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 20, elevation: 2 },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1565C0', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  customerName: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  customerPhone: { fontSize: 13, color: '#666', marginTop: 3 },
  contactRow: { flexDirection: 'row', gap: 12 },
  callBtn: { flex: 1, backgroundColor: '#E8F5E9', padding: 14, borderRadius: 12, alignItems: 'center' },
  callBtnText: { color: '#2E7D32', fontWeight: '600', fontSize: 14 },
  dirBtn: { flex: 1, backgroundColor: '#E3F2FD', padding: 14, borderRadius: 12, alignItems: 'center' },
  dirBtnText: { color: '#1565C0', fontWeight: '600', fontSize: 14 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  detailIcon: { fontSize: 16, marginTop: 1 },
  detailText: { fontSize: 14, color: '#333', flex: 1, lineHeight: 20 },
  completeBtn: { backgroundColor: '#2E7D32', borderRadius: 14, padding: 18, alignItems: 'center', marginBottom: 12 },
  completeBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  cancelBtn: { backgroundColor: '#fff', borderRadius: 14, padding: 18, alignItems: 'center', borderWidth: 1.5, borderColor: '#C62828', marginBottom: 10 },
  cancelBtnText: { color: '#C62828', fontSize: 17, fontWeight: '600' },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1565C0',
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  photoBtnActive: {
    borderColor: '#2E7D32',
    backgroundColor: '#E8F5E9',
    borderStyle: 'solid',
  },
  photoBtnText: {
    color: '#1565C0',
    fontWeight: '700',
    fontSize: 15,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 8,
  },
  chatBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9'
  }
});
