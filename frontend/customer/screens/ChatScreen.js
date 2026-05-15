import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

export default function ChatScreen({ route, navigation }) {
  const { jobId, workerName } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [userUid, setUserUid] = useState(null);
  const flatListRef = useRef();

  useEffect(() => {
    const setupChat = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id || '0ba38fa3-1ab4-405e-884d-1c43d3721680'; // DEV Fallback
      setUserUid(uid);

      // Fetch existing messages
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true });

      if (data) setMessages(data);
      setLoading(false);

      // Listen for new messages
      const channel = supabase
        .channel(`job-chat-${jobId}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `job_id=eq.${jobId}`
        }, (payload) => {
          setMessages(prev => [...prev, payload.new]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupChat();
  }, [jobId]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');

    const { error } = await supabase
      .from('messages')
      .insert({
        job_id: jobId,
        sender_id: userUid,
        sender_type: 'customer',
        text: text
      });

    if (error) {
      Alert.alert('Error', 'Failed to send message');
      setInputText(text);
    }
  };

  const renderItem = ({ item }) => {
    const isMe = item.sender_type === 'customer';
    return (
      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
        <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
          {item.text}
        </Text>
        <Text style={styles.timeText}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Chat with {workerName}</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={90}
      >
        {loading ? (
          <ActivityIndicator style={{ flex: 1 }} color="#1565C0" />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          />
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', alignItems: 'center', gap: 12 },
  backText: { color: '#1565C0', fontWeight: '600' },
  title: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  listContent: { padding: 16, paddingBottom: 24 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 12, elevation: 1 },
  myMessage: { alignSelf: 'flex-end', backgroundColor: '#1565C0' },
  theirMessage: { alignSelf: 'flex-start', backgroundColor: '#fff' },
  messageText: { fontSize: 15 },
  myMessageText: { color: '#fff' },
  theirMessageText: { color: '#333' },
  timeText: { fontSize: 10, color: 'rgba(0,0,0,0.4)', marginTop: 4, alignSelf: 'flex-end' },
  inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#F5F7FA', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, maxHeight: 100, fontSize: 15 },
  sendBtn: { marginLeft: 12, backgroundColor: '#1565C0', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  sendBtnText: { color: '#fff', fontWeight: '700' }
});
