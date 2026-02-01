import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Linking, Alert } from 'react-native';
import { Text, Card, Chip, Button } from 'react-native-paper';
import { useRoute } from '@react-navigation/native';
import api from '../services/api';
import { PropertyListing } from '../types';

const PropertyDetailScreen: React.FC = () => {
  const route = useRoute();
  const { propertyId } = route.params as { propertyId: string };
  const [property, setProperty] = useState<PropertyListing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProperty();
  }, [propertyId]);

  const loadProperty = async () => {
    try {
      setLoading(true);
      const data = await api.getPropertyById(propertyId);
      setProperty(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  const openSourceUrl = () => {
    if (property?.sourceUrl) {
      Linking.openURL(property.sourceUrl);
    }
  };

  if (loading || !property) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            {property.address.full}
          </Text>

          <View style={styles.chips}>
            {property.bhk && (
              <Chip icon="bed" style={styles.chip}>
                {property.bhk} BHK
              </Chip>
            )}
            {property.unitType && (
              <Chip icon="home" style={styles.chip}>
                {property.unitType}
              </Chip>
            )}
            {property.status && (
              <Chip style={styles.chip}>{property.status}</Chip>
            )}
          </View>

          {property.rent && (
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Rent
              </Text>
              <Text variant="headlineMedium" style={styles.rent}>
                ₹{property.rent.value.toLocaleString()}/{property.rent.period}
              </Text>
            </View>
          )}

          {property.size && (
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Size
              </Text>
              <Text variant="bodyLarge">
                {property.size.value} {property.size.unit}
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Address
            </Text>
            <Text variant="bodyLarge">{property.address.full}</Text>
            {property.address.city && (
              <Text variant="bodyMedium">City: {property.address.city}</Text>
            )}
            {property.address.state && (
              <Text variant="bodyMedium">State: {property.address.state}</Text>
            )}
            {property.address.pincode && (
              <Text variant="bodyMedium">Pincode: {property.address.pincode}</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Details
            </Text>
            <Text variant="bodySmall">
              Extracted: {new Date(property.extractedAt).toLocaleString()}
            </Text>
            <Text variant="bodySmall">
              Created: {new Date(property.createdAt).toLocaleString()}
            </Text>
            {property.isDuplicate && (
              <Text variant="bodySmall" style={styles.duplicate}>
                This is a duplicate listing
              </Text>
            )}
          </View>

          <Button
            mode="contained"
            onPress={openSourceUrl}
            style={styles.button}
            icon="open-in-new"
          >
            View Original Listing
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  title: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#6200ee',
  },
  rent: {
    fontWeight: 'bold',
    color: '#6200ee',
  },
  duplicate: {
    color: '#f44336',
    marginTop: 8,
  },
  button: {
    marginTop: 16,
  },
});

export default PropertyDetailScreen;
