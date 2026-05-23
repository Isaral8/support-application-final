import React, { useState } from 'react';

import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function CustomersScreen() {

  const [customerName, setCustomerName] = useState('');

  const [customers, setCustomers] = useState([
    {
      id: '1',
      name: 'Rajesh Kumar',
    },

    {
      id: '2',
      name: 'Manasa Traders',
    },
  ]);

  const addCustomer = () => {

    if (!customerName) {
      return;
    }

    const newCustomer = {
      id: Date.now().toString(),
      name: customerName,
    };

    setCustomers([
      ...customers,
      newCustomer,
    ]);

    setCustomerName('');
  };

  const deleteCustomer = (id: string) => {

    const filteredCustomers =
      customers.filter(
        customer => customer.id !== id
      );

    setCustomers(filteredCustomers);
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Customers
      </Text>

      <TextInput
        placeholder="Enter Customer Name"
        value={customerName}
        onChangeText={setCustomerName}
        style={styles.input}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={addCustomer}
      >
        <Text style={styles.buttonText}>
          Add Customer
        </Text>
      </TouchableOpacity>

      <FlatList
        data={customers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.customerCard}>

            <Text style={styles.customerName}>
              {item.name}
            </Text>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() =>
                deleteCustomer(item.id)
              }
            >
              <Text style={styles.deleteText}>
                Delete
              </Text>
            </TouchableOpacity>

          </View>
        )}
      />

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
    marginTop: 50,
    marginBottom: 20,
  },

  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    fontSize: 16,
  },

  addButton: {
    backgroundColor: '#2563eb',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 25,
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },

  customerCard: {
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 14,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  customerName: {
    fontSize: 18,
    fontWeight: '600',
  },

  deleteButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },

  deleteText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});