import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setMailboxes } from '../store/slices/propertySlice';

const API_URL = 'http://localhost:3000/api/mailboxes';

export default function AccountScreen() {
  const { token, logout } = useAuth();
  const mailboxes = useSelector((state: RootState) => state.properties.mailboxes || []);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const fetchMailboxes = async () => {
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      dispatch(setMailboxes(res.data));
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMailboxes();
  }, []);

  const addMailbox = async () => {
    if (!email || !password) return;
    try {
      await axios.post(API_URL, { email, password }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmail(''); setPassword('');
      setIsAdding(false);
      fetchMailboxes();
    } catch (e) {
      Alert.alert('Error', 'Failed to add account');
    }
  };

  const removeMailbox = (id: string) => {
    Alert.alert('Confirm', 'Remove this account?', [
      { text: 'Cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await axios.delete(`${API_URL}/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          fetchMailboxes();
        } catch (e) {
          Alert.alert('Error', 'Failed to remove account');
        }
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Linked Accounts</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      {isAdding ? (
        <View style={styles.addCard}>
          <TextInput style={styles.input} placeholder="Gmail Address" value={email} onChangeText={setEmail} />
          <TextInput style={styles.input} placeholder="App Password" value={password} onChangeText={setPassword} secureTextEntry />
          <View style={styles.row}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAdding(false)}>
              <Text>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={addMailbox}>
              <Text style={styles.btnText}>Link Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.fab} onPress={() => setIsAdding(true)}>
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.btnText}>Add Gmail Account</Text>
        </TouchableOpacity>
      )}

      {loading ? <ActivityIndicator style={{marginTop: 20}} /> : (
        <FlatList 
          data={mailboxes}
          keyExtractor={(item: any) => item.id || item._id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View>
                <Text style={styles.email}>{item.email}</Text>
                <Text style={styles.status}>{item.isActive ? 'Active' : 'Stopped'}</Text>
              </View>
              <TouchableOpacity onPress={() => removeMailbox(item.id || item._id)}>
                <Ionicons name="trash-outline" size={20} color="red" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold' },
  logout: { color: 'red', fontWeight: 'bold' },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' },
  email: { fontSize: 16, fontWeight: '500' },
  status: { fontSize: 12, color: 'green' },
  fab: { backgroundColor: '#2f95dc', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  addCard: { backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  input: { borderBottomWidth: 1, borderColor: '#eee', padding: 10, marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'flex-end' },
  cancelBtn: { padding: 10, marginRight: 10 },
  addBtn: { backgroundColor: '#2f95dc', padding: 10, borderRadius: 5 },
  btnText: { color: 'white', fontWeight: 'bold' }
});
