import React, { useState } from 'react';

import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ProductsScreen() {

  const [productName, setProductName] =
    useState('');

  const [price, setPrice] =
    useState('');

  const [gst, setGst] =
    useState('');

  const [products, setProducts] =
    useState([
      {
        id: '1',
        name: 'CRM Software',
        price: '25000',
        gst: '18',
      },

      {
        id: '2',
        name: 'TallyPrime',
        price: '18000',
        gst: '18',
      },
    ]);

  const addProduct = () => {

    if (
      !productName ||
      !price ||
      !gst
    ) {
      return;
    }

    const newProduct = {
      id: Date.now().toString(),
      name: productName,
      price,
      gst,
    };

    setProducts([
      ...products,
      newProduct,
    ]);

    setProductName('');
    setPrice('');
    setGst('');
  };

  const deleteProduct = (id: string) => {

    const filteredProducts =
      products.filter(
        product => product.id !== id
      );

    setProducts(filteredProducts);
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Products
      </Text>

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
        placeholder="GST %"
        value={gst}
        onChangeText={setGst}
        keyboardType="numeric"
        style={styles.input}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={addProduct}
      >
        <Text style={styles.buttonText}>
          Add Product
        </Text>
      </TouchableOpacity>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (

          <View style={styles.productCard}>

            <View>

              <Text style={styles.productName}>
                {item.name}
              </Text>

              <Text style={styles.productDetails}>
                ₹{item.price}
              </Text>

              <Text style={styles.productDetails}>
                GST: {item.gst}%
              </Text>

            </View>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() =>
                deleteProduct(item.id)
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

  productCard: {
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 14,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  productName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },

  productDetails: {
    fontSize: 15,
    color: '#6b7280',
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