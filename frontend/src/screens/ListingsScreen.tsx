import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { PropertyCard } from '../components/PropertyCard';
import { useAuth } from '../context/AuthContext';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setProperties, setLoading as setPropLoading } from '../store/slices/propertySlice';

const API_URL = 'http://localhost:3000/api';

export default function ListingsScreen() {
  const properties = useSelector((state: RootState) => state.properties.items);
  const loading = useSelector((state: RootState) => state.properties.loading);
  const { token } = useAuth();
  const dispatch = useDispatch();

  const fetchProperties = async () => {
    dispatch(setPropLoading(true));
    try {
      const res = await axios.get(`${API_URL}/properties`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      dispatch(setProperties(res.data));
    } catch (err) {
      console.log(err);
    } finally {
      dispatch(setPropLoading(false));
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={properties}
        keyExtractor={(item: any) => item._id}
        renderItem={({ item }) => <PropertyCard property={item} />}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={styles.empty}>No properties found</Text>}
        onRefresh={fetchProperties}
        refreshing={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', marginTop: 50, color: 'gray' }
});
