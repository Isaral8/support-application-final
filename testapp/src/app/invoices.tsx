import React, { useState } from 'react';

import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import * as Print from 'expo-print';

import * as Sharing from 'expo-sharing';
export default function InvoicesScreen() {

  const [customerName, setCustomerName] =
    useState('');

  const [productName, setProductName] =
    useState('');

  const [price, setPrice] =
    useState('');

  const [quantity, setQuantity] =
    useState('');

  const [gst, setGst] =
    useState('');

  const calculateInvoice = () => {

    const subtotal =
      Number(price) * Number(quantity);

    const gstAmount =
      subtotal * (Number(gst) / 100);

    const total =
      subtotal + gstAmount;

    return {
      subtotal,
      gstAmount,
      total,
    };
  };

  const invoice =
    calculateInvoice();

    const generatePDF = async () => {

  const html = `
    <html>
      <body style="font-family: Arial; padding: 20px;">

        <h1>Invoice</h1>

        <h2>${customerName}</h2>

        <p>
          Product:
          ${productName}
        </p>

        <p>
          Price:
          ₹${price}
        </p>

        <p>
          Quantity:
          ${quantity}
        </p>

        <p>
          GST:
          ${gst}%
        </p>

        <hr />

        <h3>
          Total:
          ₹${invoice.total}
        </h3>

      </body>
    </html>
  `;

  const file =
    await Print.printToFileAsync({
      html,
    });

  await Sharing.shareAsync(
    file.uri
  );

  Alert.alert(
    'Success',
    'Invoice PDF Generated'
  );
};

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Create Invoice
      </Text>

      <TextInput
        placeholder="Customer Name"
        value={customerName}
        onChangeText={setCustomerName}
        style={styles.input}
      />

      <TextInput
        placeholder="Product Name"
        value={productName}
        onChangeText={setProductName}
        style={styles.input}
      />

      <TextInput
        placeholder="Price"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        style={styles.input}
      />

      <TextInput
        placeholder="Quantity"
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
        style={styles.input}
      />

      <TextInput
        placeholder="GST %"
        value={gst}
        onChangeText={setGst}
        keyboardType="numeric"
        style={styles.input}
      />

      <View style={styles.invoiceCard}>

        <Text style={styles.invoiceTitle}>
          Invoice Summary
        </Text>

        <Text style={styles.invoiceText}>
          Customer: {customerName}
        </Text>

        <Text style={styles.invoiceText}>
          Product: {productName}
        </Text>

        <Text style={styles.invoiceText}>
          Subtotal: ₹
          {invoice.subtotal || 0}
        </Text>

        <Text style={styles.invoiceText}>
          GST Amount: ₹
          {invoice.gstAmount || 0}
        </Text>

        <Text style={styles.totalText}>
          Total: ₹
          {invoice.total || 0}
        </Text>

      </View>

      <TouchableOpacity
  style={styles.button}
  onPress={generatePDF}
>
        <Text style={styles.buttonText}>
          Generate Invoice
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

  invoiceCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginTop: 20,
    marginBottom: 30,
  },

  invoiceTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 15,
  },

  invoiceText: {
    fontSize: 18,
    marginBottom: 10,
  },

  totalText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2563eb',
    marginTop: 15,
  },

  button: {
    backgroundColor: '#2563eb',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});