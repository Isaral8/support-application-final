import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logoutUser, API_URL } from '../services/auth';

// ─── Colour tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#F7F6F2',
  surface: '#FFFFFF',
  surfaceAlt: '#F0EEE8',
  brand: '#1A56DB',
  brandLight: '#EBF2FF',
  danger: '#DC2626',
  dangerLight: '#FEF2F2',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E3DC',
  borderStrong: '#D1CFCA',
};

// ─── Avatar colour by name ────────────────────────────────────────────────────
const avatarColor = (name: string) => {
  const palette = [
    ['#EEEDFE', '#3C3489'],
    ['#E1F5EE', '#085041'],
    ['#FAECE7', '#712B13'],
    ['#EBF2FF', '#1A56DB'],
    ['#FAEEDA', '#633806'],
    ['#FBEAF0', '#72243E'],
  ];
  if (!name) return { bg: C.brandLight, fg: C.brand };
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  const [bg, fg] = palette[h % palette.length];
  return { bg, fg };
};

const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

// ─── Section wrapper ──────────────────────────────────────────────────────────
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

// ─── Field ────────────────────────────────────────────────────────────────────
const Field = ({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof TextInput>) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput style={styles.fieldInput} placeholderTextColor={C.textTertiary} {...props} />
  </View>
);

// ─── Info row ─────────────────────────────────────────────────────────────────
const InfoRow = ({ label, value, last }: { label: string; value: string; last?: boolean }) => (
  <>
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
    {!last && <View style={styles.infoDiv} />}
  </>
);

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProfile({ name: data.name || '', email: data.email || '' });
      }
    } catch {
      const name = (await AsyncStorage.getItem('userName')) || '';
      const email = (await AsyncStorage.getItem('userEmail')) || '';
      setProfile({ name, email });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile.name.trim() || !profile.email.trim()) {
      Alert.alert('Required fields', 'Name and email are required.');
      return;
    }
    setSavingProfile(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profile),
      });
      if (response.ok) {
        await AsyncStorage.setItem('userName', profile.name);
        await AsyncStorage.setItem('userEmail', profile.email);
        Alert.alert('Saved', 'Profile updated successfully.');
      } else {
        const data = await response.json();
        Alert.alert('Error', data.message || 'Failed to update profile.');
      }
    } catch {
      await AsyncStorage.setItem('userName', profile.name);
      await AsyncStorage.setItem('userEmail', profile.email);
      Alert.alert('Saved locally', 'Profile saved on device.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Required fields', 'Please fill all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Too short', 'Password must be at least 6 characters.');
      return;
    }
    setChangingPassword(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (response.ok) {
        Alert.alert('Done', 'Password changed successfully.');
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      } else {
        const data = await response.json();
        Alert.alert('Error', data.message || 'Failed to change password.');
      }
    } catch {
      Alert.alert('Error', 'Cannot connect to server.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out', style: 'destructive', onPress: async () => {
          await logoutUser();
          router.replace('/login' as any);
        },
      },
    ]);
  };

  const { bg, fg } = avatarColor(profile.name);

  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <ActivityIndicator size="large" color={C.brand} />
        <Text style={styles.loadingText}>Loading settings…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLabel}>Account</Text>
            <Text style={styles.headerTitle}>Settings</Text>
          </View>
        </View>

        {/* ── Profile hero ── */}
        <View style={styles.profileHero}>
          <View style={[styles.heroAvatar, { backgroundColor: bg }]}>
            <Text style={[styles.heroAvatarText, { color: fg }]}>{initials(profile.name)}</Text>
          </View>
          <Text style={styles.heroName}>{profile.name || 'Your Name'}</Text>
          <Text style={styles.heroEmail}>{profile.email || 'your@email.com'}</Text>
        </View>

        {/* ── Profile section ── */}
        <Section title="Profile information">
          <Field
            label="Full name"
            value={profile.name}
            onChangeText={(t) => setProfile({ ...profile, name: t })}
            placeholder="e.g. Priya Sharma"
            autoCapitalize="words"
          />
          <Field
            label="Email address"
            value={profile.email}
            onChangeText={(t) => setProfile({ ...profile, email: t })}
            placeholder="priya@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[styles.primaryBtn, savingProfile && styles.primaryBtnDisabled]}
            onPress={handleSaveProfile}
            disabled={savingProfile}
            activeOpacity={0.85}
          >
            {savingProfile
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.primaryBtnText}>Save profile</Text>}
          </TouchableOpacity>
        </Section>

        {/* ── Password section ── */}
        <Section title="Change password">
          <Field label="Current password" value={currentPassword} onChangeText={setCurrentPassword} placeholder="••••••••" secureTextEntry />
          <Field label="New password" value={newPassword} onChangeText={setNewPassword} placeholder="••••••••" secureTextEntry />
          <Field label="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="••••••••" secureTextEntry />
          <TouchableOpacity
            style={[styles.primaryBtn, changingPassword && styles.primaryBtnDisabled]}
            onPress={handleChangePassword}
            disabled={changingPassword}
            activeOpacity={0.85}
          >
            {changingPassword
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.primaryBtnText}>Change password</Text>}
          </TouchableOpacity>
        </Section>

        {/* ── Preferences section ── */}
        <Section title="Preferences">
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Push notifications</Text>
              <Text style={styles.switchSub}>Receive app notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: C.border, true: C.brandLight }}
              thumbColor={notificationsEnabled ? C.brand : C.textTertiary}
            />
          </View>
        </Section>

        {/* ── About section ── */}
        <Section title="About">
          <InfoRow label="App name" value="CRM App" />
          <InfoRow label="Version" value="1.0.0" />
          <InfoRow label="SDK" value="Expo 54" last />
        </Section>

        {/* ── Logout ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={styles.logoutBtnText}>🚪  Log out</Text>
        </TouchableOpacity>

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  loadingRoot: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: C.textTertiary },
  scroll: { paddingBottom: 24 },

  header: {
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 1.2, color: C.textTertiary, textTransform: 'uppercase', marginBottom: 2 },
  headerTitle: { fontSize: 34, fontWeight: '800', color: C.textPrimary, letterSpacing: -0.5 },

  profileHero: {
    backgroundColor: C.surface, alignItems: 'center',
    paddingVertical: 28, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 20,
  },
  heroAvatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  heroAvatarText: { fontSize: 30, fontWeight: '800' },
  heroName: { fontSize: 20, fontWeight: '700', color: C.textPrimary },
  heroEmail: { fontSize: 13, color: C.textTertiary, marginTop: 3 },

  section: {
    backgroundColor: C.surface, marginHorizontal: 16, marginBottom: 14,
    borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.border,
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: C.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 },

  fieldWrap: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: C.textSecondary, letterSpacing: 0.4, marginBottom: 6, textTransform: 'uppercase' },
  fieldInput: { backgroundColor: C.bg, borderRadius: 12, padding: 14, fontSize: 15, color: C.textPrimary, borderWidth: 1, borderColor: C.border },

  primaryBtn: { backgroundColor: C.brand, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 6 },
  primaryBtnDisabled: { opacity: 0.55 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  switchLabel: { fontSize: 15, fontWeight: '600', color: C.textPrimary },
  switchSub: { fontSize: 12, color: C.textTertiary, marginTop: 2 },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11 },
  infoLabel: { fontSize: 14, color: C.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
  infoDiv: { height: 1, backgroundColor: C.border },

  logoutBtn: {
    marginHorizontal: 16, marginTop: 4, backgroundColor: C.dangerLight,
    borderRadius: 14, padding: 17, alignItems: 'center',
    borderWidth: 1, borderColor: '#FECACA',
  },
  logoutBtnText: { color: C.danger, fontSize: 16, fontWeight: '700' },
});
