import React, { useEffect, useRef, useState } from 'react';
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

const API_URL = `${BASE_URL}/api/products`;

// ─── Colour tokens (same as customers/invoices) ───────────────────────────────
const C = {
  bg: '#F7F6F2',
  surface: '#FFFFFF',
  surfaceAlt: '#F0EEE8',
  brand: '#1A56DB',
  brandLight: '#EBF2FF',
  danger: '#DC2626',
  dangerLight: '#FEF2F2',
  success: '#16A34A',
  successLight: '#F0FDF4',
  amber: '#D97706',
  amberLight: '#FFFBEB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E3DC',
  borderStrong: '#D1CFCA',
};

// ─── Category icon + colour by name hash ─────────────────────────────────────
const productAccent = (name: string) => {
  const palette = [
    { bg: '#EBF2FF', fg: '#1A56DB', icon: '📦' },
    { bg: '#F0FDF4', fg: '#16A34A', icon: '🛍️' },
    { bg: '#FFFBEB', fg: '#D97706', icon: '⚙️' },
    { bg: '#FEF2F2', fg: '#DC2626', icon: '🔩' },
    { bg: '#EEEDFE', fg: '#3C3489', icon: '💎' },
    { bg: '#E1F5EE', fg: '#085041', icon: '🌿' },
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return palette[h % palette.length];
};

// ─── Field component ──────────────────────────────────────────────────────────
const Field = ({
  label,
  required,
  prefix,
  suffix,
  multiline,
  ...props
}: {
  label: string;
  required?: boolean;
  prefix?: string;
  suffix?: string;
  multiline?: boolean;
} & React.ComponentProps<typeof TextInput>) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>
      {label}
      {required && <Text style={{ color: C.danger }}> *</Text>}
    </Text>
    <View style={[styles.fieldRow, multiline && { alignItems: 'flex-start' }]}>
      {prefix ? <Text style={styles.fieldAffix}>{prefix}</Text> : null}
      <TextInput
        style={[
          styles.fieldInput,
          (prefix || suffix) && { borderRadius: 0, borderLeftWidth: prefix ? 0 : 1, borderRightWidth: suffix ? 0 : 1 },
          multiline && { minHeight: 80, textAlignVertical: 'top', paddingTop: 14 },
        ]}
        placeholderTextColor={C.textTertiary}
        multiline={multiline}
        {...props}
      />
      {suffix ? <Text style={[styles.fieldAffix, styles.fieldSuffix]}>{suffix}</Text> : null}
    </View>
  </View>
);

// ─── Product card ─────────────────────────────────────────────────────────────
const ProductCard = ({
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
  const { bg, fg, icon } = productAccent(item.name || '?');
  const priceWithGst = (Number(item.price) * (1 + Number(item.gst) / 100)).toFixed(2);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 260, delay: Math.min(index * 40, 300), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 260, delay: Math.min(index * 40, 300), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {/* Top: icon + name + actions */}
      <View style={styles.cardTop}>
        <View style={[styles.productIcon, { backgroundColor: bg }]}>
          <Text style={styles.productIconText}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          {item.description ? (
            <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
          ) : null}
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={onEdit} activeOpacity={0.7}>
            <Text style={styles.iconBtnText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, styles.iconBtnDanger]} onPress={onDelete} activeOpacity={0.7}>
            <Text style={styles.iconBtnText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Bottom: price chips */}
      <View style={styles.cardBottom}>
        <View style={styles.priceChip}>
          <Text style={styles.priceChipLabel}>Base price</Text>
          <Text style={styles.priceChipValue}>₹{item.price}</Text>
        </View>
        <View style={[styles.priceChip, { backgroundColor: C.amberLight }]}>
          <Text style={[styles.priceChipLabel, { color: C.amber }]}>GST</Text>
          <Text style={[styles.priceChipValue, { color: C.amber }]}>{item.gst}%</Text>
        </View>
        <View style={[styles.priceChip, { backgroundColor: C.brandLight, flex: 1.2 }]}>
          <Text style={[styles.priceChipLabel, { color: C.brand }]}>With GST</Text>
          <Text style={[styles.priceChipValue, { color: C.brand }]}>₹{priceWithGst}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ProductsScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [gst, setGst] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = products.filter(
    (p: any) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.price?.toString().includes(search) ||
      p.gst?.toString().includes(search)
  );

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
    } catch {
      Alert.alert('Error', 'Could not fetch products');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName(''); setPrice(''); setGst(''); setDescription('');
    setEditingProduct(null);
  };

  const openAddModal = () => { resetForm(); setModalVisible(true); };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price.toString());
    setGst(product.gst.toString());
    setDescription(product.description || '');
    setModalVisible(true);
  };

  const saveProduct = async () => {
    if (!name.trim() || !price.trim() || !gst.trim()) {
      Alert.alert('Required fields', 'Name, price and GST are required.');
      return;
    }
    try {
      setSaving(true);
      const payload = { name, price: Number(price), gst: Number(gst), description };
      if (editingProduct) {
        const res = await fetch(`${API_URL}/${editingProduct._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const updated = await res.json();
        setProducts(products.map((p: any) => (p._id === editingProduct._id ? updated : p)));
      } else {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const newProduct = await res.json();
        if (newProduct._id) setProducts([newProduct, ...products]);
      }
      setModalVisible(false);
      resetForm();
    } catch {
      Alert.alert('Error', 'Could not save product');
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = (id: string) => {
    Alert.alert('Delete product', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            setProducts(products.filter((p: any) => p._id !== id));
          } catch { Alert.alert('Error', 'Could not delete'); }
        }
      }
    ]);
  };

  useEffect(() => { fetchProducts(); }, []);

  // Live preview price with GST
  const previewBase = Number(price) || 0;
  const previewGst = Number(gst) || 0;
  const previewTotal = (previewBase * (1 + previewGst / 100)).toFixed(2);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>Catalogue</Text>
          <Text style={styles.headerTitle}>Products</Text>
        </View>
        <View style={styles.headerRight}>
          {!loading && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{products.length}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchProducts} activeOpacity={0.7}>
            <Text style={{ fontSize: 18 }}>↻</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Search + Add ── */}
      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Search products…"
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
          <Text style={styles.loadingText}>Loading products…</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>{search ? '🔎' : '📦'}</Text>
          <Text style={styles.emptyTitle}>
            {search ? `No results for "${search}"` : 'No products yet'}
          </Text>
          <Text style={styles.emptyBody}>
            {search ? 'Try a different search term.' : 'Tap "+ New" to add your first product.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item: any) => item._id}
          renderItem={({ item, index }) => (
            <ProductCard
              item={item}
              index={index}
              onEdit={() => openEditModal(item)}
              onDelete={() => deleteProduct(item._id)}
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
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {editingProduct ? 'Edit Product' : 'New Product'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={styles.sheetClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Field label="Product name" required value={name} onChangeText={setName} placeholder="e.g. Steel Rods" autoCapitalize="words" />

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Field label="Price" required prefix="₹" value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="0" />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Field label="GST" required suffix="%" value={gst} onChangeText={setGst} keyboardType="numeric" placeholder="18" />
                </View>
              </View>

              {/* Live price preview */}
              {(price || gst) ? (
                <View style={styles.pricePreview}>
                  <View style={styles.pricePreviewItem}>
                    <Text style={styles.pricePreviewLabel}>Base</Text>
                    <Text style={styles.pricePreviewValue}>₹{previewBase}</Text>
                  </View>
                  <Text style={styles.pricePreviewArrow}>→</Text>
                  <View style={styles.pricePreviewItem}>
                    <Text style={[styles.pricePreviewLabel, { color: C.amber }]}>+GST {previewGst}%</Text>
                    <Text style={[styles.pricePreviewValue, { color: C.amber }]}>₹{(previewBase * previewGst / 100).toFixed(2)}</Text>
                  </View>
                  <Text style={styles.pricePreviewArrow}>→</Text>
                  <View style={styles.pricePreviewItem}>
                    <Text style={[styles.pricePreviewLabel, { color: C.brand }]}>Total</Text>
                    <Text style={[styles.pricePreviewValue, { color: C.brand, fontSize: 17 }]}>₹{previewTotal}</Text>
                  </View>
                </View>
              ) : null}

              <Field label="Description" value={description} onChangeText={setDescription} placeholder="Optional notes about this product" multiline />

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={saveProduct}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {editingProduct ? 'Save changes' : 'Add product'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)} activeOpacity={0.7}>
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  headerLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 1.2, color: C.textTertiary, textTransform: 'uppercase', marginBottom: 2 },
  headerTitle: { fontSize: 34, fontWeight: '800', color: C.textPrimary, letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  countBadge: { backgroundColor: C.brandLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  countBadgeText: { fontSize: 13, fontWeight: '700', color: C.brand },
  refreshBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },

  toolbar: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 8, gap: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 14, paddingHorizontal: 12, borderWidth: 1, borderColor: C.border },
  searchIcon: { fontSize: 16, marginRight: 6 },
  searchInput: { flex: 1, paddingVertical: 13, fontSize: 15, color: C.textPrimary },
  clearIcon: { fontSize: 14, color: C.textTertiary, paddingLeft: 8 },
  addBtn: { backgroundColor: C.brand, paddingHorizontal: 18, borderRadius: 14, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  resultHint: { fontSize: 12, color: C.textTertiary, marginHorizontal: 20, marginBottom: 6 },

  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },

  card: { backgroundColor: C.surface, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  cardTop: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  productIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  productIconText: { fontSize: 22 },
  cardName: { fontSize: 16, fontWeight: '700', color: C.textPrimary },
  cardDesc: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
  cardActions: { flexDirection: 'column', gap: 8, flexShrink: 0 },
  iconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  iconBtnDanger: { backgroundColor: C.dangerLight },
  iconBtnText: { fontSize: 15 },
  cardDivider: { height: 1, backgroundColor: C.border },
  cardBottom: { flexDirection: 'row', padding: 12, gap: 8 },
  priceChip: { flex: 1, backgroundColor: C.surfaceAlt, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 },
  priceChipLabel: { fontSize: 10, fontWeight: '600', color: C.textTertiary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 },
  priceChipValue: { fontSize: 14, fontWeight: '800', color: C.textPrimary },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  loadingText: { marginTop: 12, fontSize: 14, color: C.textTertiary },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary, textAlign: 'center', marginBottom: 6 },
  emptyBody: { fontSize: 14, color: C.textSecondary, textAlign: 'center' },

  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, maxHeight: '92%' },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.borderStrong, alignSelf: 'center', marginBottom: 16 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: C.textPrimary },
  sheetClose: { fontSize: 18, color: C.textTertiary, fontWeight: '600' },

  row: { flexDirection: 'row' },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: C.textSecondary, letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
  fieldRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 12, backgroundColor: C.surface, overflow: 'hidden' },
  fieldAffix: { paddingHorizontal: 12, fontSize: 15, color: C.textSecondary, backgroundColor: C.surfaceAlt, paddingVertical: 14, borderRightWidth: 1, borderRightColor: C.border },
  fieldSuffix: { borderRightWidth: 0, borderLeftWidth: 1, borderLeftColor: C.border },
  fieldInput: { flex: 1, padding: 14, fontSize: 15, color: C.textPrimary, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 12 },

  pricePreview: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceAlt, borderRadius: 12, padding: 14, marginBottom: 14, gap: 8 },
  pricePreviewItem: { flex: 1, alignItems: 'center' },
  pricePreviewLabel: { fontSize: 11, fontWeight: '600', color: C.textTertiary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 },
  pricePreviewValue: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  pricePreviewArrow: { fontSize: 16, color: C.textTertiary },

  saveBtn: { backgroundColor: C.brand, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 10 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', padding: 12 },
  cancelBtnText: { color: C.textSecondary, fontSize: 15, fontWeight: '500' },
});
