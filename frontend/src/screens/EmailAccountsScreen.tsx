import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Card, Text, Button, FAB, Chip } from 'react-native-paper';
import api from '../services/api';
import { EmailAccount } from '../types';

const EmailAccountsScreen: React.FC = () => {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await api.getEmailAccounts();
      setAccounts(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load email accounts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAccounts();
  };

  const toggleAccountStatus = async (account: EmailAccount) => {
    try {
      await api.updateEmailAccount(account._id, { isActive: !account.isActive });
      loadAccounts();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update account');
    }
  };

  const renderAccount = ({ item }: { item: EmailAccount }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium">{item.email}</Text>
          <Chip
            icon={item.isActive ? 'check-circle' : 'cancel'}
            style={[
              styles.statusChip,
              item.isActive ? styles.activeChip : styles.inactiveChip,
            ]}
          >
            {item.isActive ? 'Active' : 'Inactive'}
          </Chip>
        </View>
        <Text variant="bodyMedium" style={styles.provider}>
          Provider: {item.provider}
        </Text>
        <Text variant="bodySmall" style={styles.folders}>
          Folders: {item.folders.join(', ')}
        </Text>
        {item.lastChecked && (
          <Text variant="bodySmall" style={styles.lastChecked}>
            Last checked: {new Date(item.lastChecked).toLocaleString()}
          </Text>
        )}
        <Button
          mode={item.isActive ? 'outlined' : 'contained'}
          onPress={() => toggleAccountStatus(item)}
          style={styles.toggleButton}
        >
          {item.isActive ? 'Deactivate' : 'Activate'}
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={accounts}
        renderItem={renderAccount}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No email accounts added yet</Text>
        }
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => Alert.alert('Info', 'Add email account feature coming soon')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  activeChip: {
    backgroundColor: '#4caf50',
  },
  inactiveChip: {
    backgroundColor: '#f44336',
  },
  provider: {
    marginTop: 4,
    color: '#666',
  },
  folders: {
    marginTop: 4,
    color: '#999',
  },
  lastChecked: {
    marginTop: 4,
    color: '#999',
  },
  toggleButton: {
    marginTop: 12,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default EmailAccountsScreen;
