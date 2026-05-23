import React, { useState } from 'react';

import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { loginUser } from '../services/auth';

export default function LoginScreen() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {

    if (!email || !password) {
      Alert.alert(
        'Validation Error',
        'Please enter email and password'
      );
      return;
    }

    const response = await loginUser(
      email,
      password
    );

    if (response.success) {

      Alert.alert(
        'Login Successful'
      );

      router.push('/dashboard' as any);

    } else {

      Alert.alert(
        'Login Failed',
        response.message
      );
    }
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        CRM Login
      </Text>

      <TextInput
        placeholder="Enter Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        placeholderTextColor="#9ca3af"
      />

      <TextInput
        placeholder="Enter Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        placeholderTextColor="#9ca3af"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
      >
        <Text style={styles.buttonText}>
          Login
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },

  title: {
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 30,
    textAlign: 'center',
    color: '#111827',
  },

  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
    fontSize: 16,
    color: '#111827',
  },

  button: {
    backgroundColor: '#2563eb',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});