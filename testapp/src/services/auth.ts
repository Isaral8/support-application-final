import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Your PC's IP address - backend runs on port 5000
export const API_URL = 'https://brewery-dad-roundup.ngrok-free.dev';

export const loginUser = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (response.ok && data.token) {
      await AsyncStorage.setItem('token', data.token);
      return { success: true };
    } else {
      return { success: false, message: data.message || 'Login failed' };
    }
  } catch (error) {
    return { success: false, message: 'Cannot connect to server' };
  }
};

export const registerUser = async (name: string, email: string, password: string) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await response.json();
    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, message: data.message || 'Registration failed' };
    }
  } catch (error) {
    return { success: false, message: 'Cannot connect to server' };
  }
};

export const getToken = async () => {
  return await AsyncStorage.getItem('token');
};

export const logoutUser = async () => {
  await AsyncStorage.removeItem('token');
};
