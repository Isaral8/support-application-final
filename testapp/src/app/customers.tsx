import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_URL as BASE_URL } from '../services/auth';

const API_URL = `${BASE_URL}/api/customers`;

// ─── Colour tokens ───────────────────────────────────────────────────────────
const C = {
  bg: '#F7F6F2',
  surface: '#FFFFFF',
  surfaceAlt: '#F0EEE8',
  brand: '#1A56DB',
  brandLight: '#EBF2FF',
  brandDark: '#1240A8',
  danger: '#DC2626',
  dangerLight: '#FEF2F2',
  success: '#16A34A',
  successLight: '#F0FDF4',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E3DC',
  borderStrong: '#D1CFCA',
  shadow: 'rgba(0,0,0,0.06)',
};

// ─── Avatar initials helper ──────────────────────────────────────────────────
const avatarColor = (name: string) => {
  const palette = [
    ['#EEEDFE', '#3C3489'],
    ['#E1F5EE', '#085041'],
    ['#FAECE7', '#712B13'],
    ['#E6F1FB', '#0C447C'],
    ['#FAEEDA', '#633806'],
    ['#FBEAF0', '#72243E'],
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  const [bg, fg] = palette[h % palette.length];
  return { bg, fg };
};

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

// ─── Animated card ────────────────────────────────────────────────────────────
const CustomerCard = ({
  item,
  onEdit,
  onDelete,
  index,
}: {
  item: any;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const { bg, fg } = avatarColor(item.name || '?');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 260,
        delay: Math.min(index * 40, 300),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 260,
        delay: Math.min(index * 40, 300),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.card,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {/* Left accent strip */}
      <View style={[styles.cardAccent, { backgroundColor: bg }]} />

      <View style={styles.cardInner}>
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: bg }]}>
          <Text style={[styles.avatarText, { color: fg }]}>
            {initials(item.name || '?')}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.cardContent}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardSub} numberOfLines={1}>{item.email}</Text>
          <Text style={styles.cardSub}>{item.phone}</Text>
          {item.address ? (
            <Text style={styles.cardMeta} numberOfLines={1}>📍 {item.address}</Text>
          ) : null}
          {item.gstin ? (
            <View style={styles.gstinPill}>
              <Text style={styles.gstinText}>GST {item.gstin}</Text>
            </View>
          ) : null}
        </View>

        {/* Actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={onEdit} activeOpacity={0.7}>
            <Text style={styles.iconBtnText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, styles.iconBtnDanger]}
            onPress={onDelete}
            activeOpacity={0.7}
          >
            <Text style={styles.iconBtnText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

// ─── Field component ─────────────────────────────────────────────────────────
const Field = ({
  label,
  required,
  ...props
}: { label: string; required?: boolean } & React.ComponentProps<typeof TextInput>) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>
      {label}
      {required && <Text style={{ color: C.danger }}> *</Text>}
    </Text>
    <TextInput style={styles.fieldInput} placeholderTextColor={C.textTertiary} {...props} />
  </View>
);

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function CustomersScreen() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = customers.filter(
    (c: any) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.gstin?.toLowerCase().includes(search.toLowerCase())
  );

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const data = await res.json();
      if (Array.isArray(data)) setCustomers(data);
    } catch {
      Alert.alert('Network Error', 'Cannot reach server.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setGstin('');
    setEditingCustomer(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (customer: any) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setEmail(customer.email);
    setPhone(customer.phone);
    setAddress(customer.address || '');
    setGstin(customer.gstin || '');
    setModalVisible(true);
  };

  const saveCustomer = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      Alert.alert('Required fields', 'Name, email and phone are required.');
      return;
    }
    try {
      setSaving(true);
      if (editingCustomer) {
        const res = await fetch(`${API_URL}/${editingCustomer._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, address, gstin }),
        });
        const updated = await res.json();
        setCustomers(customers.map((c: any) => (c._id === editingCustomer._id ? updated : c)));
      } else {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, address, gstin }),
        });
        const newCustomer = await res.json();
        if (newCustomer._id) setCustomers([newCustomer, ...customers]);
      }
      setModalVisible(false);
      resetForm();
    } catch {
      Alert.alert('Network Error', 'Cannot reach server.');
    } finally {
      setSaving(false);
    }
  };

  const deleteCustomer = (id: string) => {
    Alert.alert('Delete customer', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            setCustomers(customers.filter((c: any) => c._id !== id));
          } catch {
            Alert.alert('Error', 'Could not delete.');
          }
        },
      },
    ]);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>Directory</Text>
          <Text style={styles.headerTitle}>Customers</Text>
        </View>
        <View style={styles.headerRight}>
          {!loading && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{customers.length}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchCustomers} activeOpacity={0.7}>
            <Text style={{ fontSize: 18 }}>↻</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Search + Add ── */}
      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Search name, email, phone…"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            placeholderTextColor={C.textTertiary}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal} activeOpacity={0.85}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {search.length > 0 && (
        <Text style={styles.resultHint}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{search}"
        </Text>
      )}

      {/* ── List ── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.brand} />
          <Text style={styles.loadingText}>Loading customers…</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>{search ? '🔎' : '👥'}</Text>
          <Text style={styles.emptyTitle}>
            {search ? `No results for "${search}"` : 'No customers yet'}
          </Text>
          <Text style={styles.emptyBody}>
            {search ? 'Try a different search term.' : 'Tap "+ New" to add your first customer.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item: any) => item._id}
          renderItem={({ item, index }) => (
            <CustomerCard
              item={item}
              index={index}
              onEdit={() => openEditModal(item)}
              onDelete={() => deleteCustomer(item._id)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* ── Add / Edit Modal ── */}
      <Modal visible={modalVisible} animationType="slide" transparent presentationStyle="overFullScreen">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBg}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalVisible(false)} />
          <View style={styles.sheet}>
            {/* Sheet handle */}
            <View style={styles.sheetHandle} />

            {/* Sheet header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {editingCustomer ? 'Edit Customer' : 'New Customer'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={styles.sheetClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Field label="Full name" required value={name} onChangeText={setName} placeholder="e.g. Priya Sharma" autoCapitalize="words" />
              <Field label="Email" required value={email} onChangeText={setEmail} placeholder="priya@company.com" keyboardType="email-address" autoCapitalize="none" />
              <Field label="Phone" required value={phone} onChangeText={setPhone} placeholder="+91 98765 43210" keyboardType="phone-pad" />
              <Field label="Address" value={address} onChangeText={setAddress} placeholder="City, State" />
              <Field label="GSTIN" value={gstin} onChangeText={setGstin} placeholder="22AAAAA0000A1Z5" autoCapitalize="characters" />

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={saveCustomer}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {editingCustomer ? 'Save changes' : 'Add customer'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <View style={{ height: 32 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 1.2, color: C.textTertiary, textTransform: 'uppercase', marginBottom: 2 },
  headerTitle: { fontSize: 34, fontWeight: '800', color: C.textPrimary, letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  countBadge: { backgroundColor: C.brandLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  countBadgeText: { fontSize: 13, fontWeight: '700', color: C.brand },
  refreshBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },

  // Toolbar
  toolbar: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 8, gap: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 12, borderWidth: 1, borderColor: C.border },
  searchIcon: { fontSize: 16, marginRight: 6 },
  searchInput: { flex: 1, paddingVertical: 13, fontSize: 15, color: C.textPrimary },
  clearIcon: { fontSize: 14, color: C.textTertiary, paddingLeft: 8 },
  addBtn: { backgroundColor: C.brand, paddingHorizontal: 18, borderRadius: 14, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  resultHint: { fontSize: 12, color: C.textTertiary, marginHorizontal: 20, marginBottom: 6 },

  // List
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },

  // Card
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardAccent: { width: 4 },
  cardInner: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 16, fontWeight: '700' },
  cardContent: { flex: 1, gap: 1 },
  cardName: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginBottom: 2 },
  cardSub: { fontSize: 13, color: C.textSecondary },
  cardMeta: { fontSize: 12, color: C.textTertiary, marginTop: 3 },
  gstinPill: { marginTop: 5, alignSelf: 'flex-start', backgroundColor: C.surfaceAlt, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  gstinText: { fontSize: 11, fontWeight: '600', color: C.textSecondary, letterSpacing: 0.3 },
  cardActions: { flexDirection: 'column', gap: 8, flexShrink: 0 },
  iconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  iconBtnDanger: { backgroundColor: C.dangerLight },
  iconBtnText: { fontSize: 15 },

  // Empty / loading
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  loadingText: { marginTop: 12, fontSize: 14, color: C.textTertiary },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary, textAlign: 'center', marginBottom: 6 },
  emptyBody: { fontSize: 14, color: C.textSecondary, textAlign: 'center' },

  // Modal / sheet
  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, maxHeight: '92%' },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.borderStrong, alignSelf: 'center', marginBottom: 16 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: C.textPrimary },
  sheetClose: { fontSize: 18, color: C.textTertiary, fontWeight: '600' },

  // Form fields
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: C.textSecondary, letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
  fieldInput: { backgroundColor: C.bg, borderRadius: 12, padding: 14, fontSize: 15, color: C.textPrimary, borderWidth: 1, borderColor: C.border },

  // Buttons
  saveBtn: { backgroundColor: C.brand, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 10 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', padding: 12 },
  cancelBtnText: { color: C.textSecondary, fontSize: 15, fontWeight: '500' },
});
