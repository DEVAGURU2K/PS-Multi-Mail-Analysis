import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';

export const PropertyCard = ({ property }: { property: any }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{property.title || 'Untitled Property'}</Text>
      
      <View style={styles.row}>
        <Text style={styles.price}>{property.extracted_data?.rent || 'Price on request'}</Text>
        <Text style={styles.type}>
          {[property.extracted_data?.bhk, property.extracted_data?.unit_type].filter(Boolean).join(' • ')}
        </Text>
      </View>
      
      {property.extracted_data?.address ? (
        <Text style={styles.address}>📍 {property.extracted_data.address}</Text>
      ) : null}

      {property.extracted_data?.size ? (
        <Text style={styles.size}>📐 {property.extracted_data.size}</Text>
      ) : null}

      <TouchableOpacity onPress={() => Linking.openURL(property.link)} style={styles.button}>
        <Text style={styles.buttonText}>View Listing</Text>
      </TouchableOpacity>
      
      <Text style={styles.date}>Found: {new Date(property.createdAt).toLocaleDateString()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginVertical: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, alignItems: 'center' },
  price: { color: '#27ae60', fontWeight: 'bold', fontSize: 16 },
  type: { color: '#7f8c8d', fontSize: 14 },
  address: { marginTop: 8, color: '#555', fontSize: 14 },
  size: { marginTop: 4, color: '#555', fontSize: 14 },
  button: { marginTop: 16, alignSelf: 'flex-start' },
  buttonText: { color: '#2980b9', fontWeight: '600' },
  date: { marginTop: 12, textAlign: 'right', fontSize: 12, color: '#bdc3c7' }
});
