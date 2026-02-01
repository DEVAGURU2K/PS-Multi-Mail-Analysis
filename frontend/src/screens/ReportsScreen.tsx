import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Card, Text, Button, Chip } from 'react-native-paper';
import api from '../services/api';
import { DailyReport } from '../types';

const ReportsScreen: React.FC = () => {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await api.getReports();
      setReports(response.reports || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const generateReport = async () => {
    try {
      await api.generateReport();
      Alert.alert('Success', 'Report generated successfully');
      loadReports();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to generate report');
    }
  };

  const renderReport = ({ item }: { item: DailyReport }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium">
            {new Date(item.date).toLocaleDateString()}
          </Text>
          <Chip
            icon="file-document"
            style={[
              styles.statusChip,
              item.status === 'sent' ? styles.sentChip : styles.pendingChip,
            ]}
          >
            {item.status}
          </Chip>
        </View>
        <Text variant="bodyLarge" style={styles.count}>
          {item.totalNewListings} new listings
        </Text>
        <Text variant="bodySmall" style={styles.date}>
          Generated: {new Date(item.generatedAt).toLocaleString()}
        </Text>
        {item.sentAt && (
          <Text variant="bodySmall" style={styles.date}>
            Sent: {new Date(item.sentAt).toLocaleString()}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.actions}>
        <Button mode="contained" onPress={generateReport} style={styles.generateButton}>
          Generate Report
        </Button>
      </View>
      <FlatList
        data={reports}
        renderItem={renderReport}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No reports available</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  actions: {
    padding: 16,
  },
  generateButton: {
    marginBottom: 8,
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusChip: {
    marginLeft: 8,
  },
  sentChip: {
    backgroundColor: '#4caf50',
  },
  pendingChip: {
    backgroundColor: '#ff9800',
  },
  count: {
    marginTop: 8,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  date: {
    marginTop: 4,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    color: '#999',
  },
});

export default ReportsScreen;
