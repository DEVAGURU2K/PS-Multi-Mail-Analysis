import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Text, Searchbar, Chip, FAB } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { PropertyListing } from '../types';

const PropertiesScreen: React.FC = () => {
  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ page: 1, limit: 20 });
  const navigation = useNavigation();

  useEffect(() => {
    loadProperties();
  }, [filters]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const response = await api.getProperties(filters);
      setProperties(response.properties || []);
    } catch (error: any) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadProperties();
  };

  const renderProperty = ({ item }: { item: PropertyListing }) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('PropertyDetail' as never, { propertyId: item._id } as never)}
    >
      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>
          {item.address.full}
        </Text>
        {item.bhk && (
          <Chip style={styles.chip} icon="bed">
            {item.bhk} BHK
          </Chip>
        )}
        {item.rent && (
          <Text variant="bodyLarge" style={styles.rent}>
            ₹{item.rent.value.toLocaleString()}/{item.rent.period}
          </Text>
        )}
        {item.size && (
          <Text variant="bodyMedium" style={styles.size}>
            {item.size.value} {item.size.unit}
          </Text>
        )}
        <Text variant="bodySmall" style={styles.status}>
          Status: {item.status}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search properties..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />
      <FlatList
        data={properties}
        renderItem={renderProperty}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchbar: {
    margin: 16,
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  chip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  rent: {
    marginTop: 8,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  size: {
    marginTop: 4,
    color: '#666',
  },
  status: {
    marginTop: 8,
    color: '#999',
  },
});

export default PropertiesScreen;
