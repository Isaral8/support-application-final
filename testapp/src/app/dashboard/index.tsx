import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { router } from 'expo-router';

export default function DashboardScreen() {
  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        CRM Dashboard
      </Text>

      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push('/customers' as any)}
      >
        <Text style={styles.cardText}>
          Customers
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push('/products' as any)}
      >
        <Text style={styles.cardText}>
          Products
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push('/invoices' as any)}
      >
        <Text style={styles.cardText}>
          Invoices
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push('/settings' as any)}
      >
        <Text style={styles.cardText}>
          Settings
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f3f4f6',
  },

  title: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: 60,
    marginBottom: 30,
  },

  card: {
    backgroundColor: '#2563eb',
    padding: 22,
    borderRadius: 16,
    marginBottom: 20,
  },

  cardText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
});