import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView, TextInput,
  Alert
} from 'react-native';

const CATEGORIES = [
  { id: '1', name: 'Plumber', icon: '🔧' },
  { id: '2', name: 'Electrician', icon: '⚡' },
  { id: '3', name: 'Carpenter', icon: '🪚' },
  { id: '4', name: 'Cleaning', icon: '🧹' },
  { id: '5', name: 'Painter', icon: '🎨' },
];

const URGENCY_LEVELS = ['Normal', 'Urgent', 'Emergency'];

export default function BookServiceScreen({ navigation }) {
  const [serviceCategory, setServiceCategory] = useState(CATEGORIES[0].name);
  const [jobDescription, setJobDescription] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [urgency, setUrgency] = useState('Normal');
  const [additionalRequirements, setAdditionalRequirements] = useState('');

  const handleSubmit = () => {
    Alert.alert(
      "Form State",
      JSON.stringify({
        serviceCategory,
        jobDescription,
        location,
        budget,
        urgency,
        additionalRequirements
      }, null, 2)
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={styles.title}>Post a Job</Text>
          <Text style={styles.subtitle}>Find the right worker for your needs</Text>
        </View>

        {/* 1. Service Category */}
        <Text style={styles.sectionLabel}>Service Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryCard,
                serviceCategory === cat.name && styles.categoryCardSelected
              ]}
              onPress={() => setServiceCategory(cat.name)}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={[
                styles.categoryText,
                serviceCategory === cat.name && styles.categoryTextSelected
              ]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 2. Job Description */}
        <Text style={styles.sectionLabel}>Job Description</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe the issue or task in detail..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          value={jobDescription}
          onChangeText={setJobDescription}
        />

        {/* 3. Location / Pincode */}
        <Text style={styles.sectionLabel}>Location / Pincode</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Koramangala, 560034"
          placeholderTextColor="#999"
          value={location}
          onChangeText={setLocation}
        />

        {/* 4. Budget */}
        <Text style={styles.sectionLabel}>Estimated Budget (₹)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 500"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={budget}
          onChangeText={setBudget}
        />

        {/* 5. Urgency Level */}
        <Text style={styles.sectionLabel}>Urgency Level</Text>
        <View style={styles.urgencyContainer}>
          {URGENCY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.urgencyButton,
                urgency === level && styles.urgencyButtonSelected
              ]}
              onPress={() => setUrgency(level)}
            >
              <Text style={[
                styles.urgencyText,
                urgency === level && styles.urgencyTextSelected
              ]}>
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Additional Requirements */}
        <Text style={styles.sectionLabel}>Additional Requirements</Text>
        <Text style={styles.helperText}>Any specific tools, materials, or conditions required?</Text>
        <TextInput
          style={styles.textArea}
          placeholder="e.g. need transport support, generator required..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          value={additionalRequirements}
          onChangeText={setAdditionalRequirements}
        />

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Review & Post Job</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#718096',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 10,
    marginTop: 16,
  },
  helperText: {
    fontSize: 13,
    color: '#718096',
    marginBottom: 8,
    marginTop: -6,
  },
  categoryScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  categoryCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    width: 100,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryCardSelected: {
    borderColor: '#4299E1',
    backgroundColor: '#EBF8FF',
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A5568',
  },
  categoryTextSelected: {
    color: '#2B6CB0',
  },
  textArea: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1A202C',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    textAlignVertical: 'top',
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1A202C',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  urgencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  urgencyButton: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  urgencyButtonSelected: {
    backgroundColor: '#4299E1',
    borderColor: '#4299E1',
  },
  urgencyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
  },
  urgencyTextSelected: {
    color: '#FFF',
  },
  submitButton: {
    backgroundColor: '#2B6CB0',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 30,
    shadowColor: '#2B6CB0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});