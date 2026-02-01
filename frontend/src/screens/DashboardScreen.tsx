import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api'; // Adjust for emulator (10.0.2.2 usually) if needed

export default function DashboardScreen() {
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      // In simulator localhost works, on device needs IP
      const res = await axios.get(`${API_URL}/stats`); 
      setStats(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.header}>Daily Overview</Text>
      
      <View style={styles.card}>
        <Text style={styles.label}>New Properties Today</Text>
        <Text style={styles.value}>{stats?.count || 0}</Text>
      </View>

      <Text style={styles.subtext}>Pull to refresh</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { 
      padding: 30, backgroundColor: 'white', borderRadius: 12, alignItems: 'center',
      shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.1, elevation: 3
  },
  label: { fontSize: 18, color: 'gray' },
  value: { fontSize: 48, fontWeight: 'bold', color: '#2f95dc', marginTop: 10 },
  subtext: { marginTop: 20, textAlign: 'center', color: '#999' }
});
