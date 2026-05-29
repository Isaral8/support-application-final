import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { API_URL as BASE_URL } from '../services/auth';

const API_URL = `${BASE_URL}/api/invoices`;
const CUSTOMERS_URL = `${BASE_URL}/api/customers`;
const PRODUCTS_URL = `${BASE_URL}/api/products`;

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
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E3DC',
  borderStrong: '#D1CFCA',
  amber: '#D97706',
  amberLight: '#FFFBEB',
};

// ─── Picker Modal ─────────────────────────────────────────────────────────────
const PickerModal = ({ visible, title, items, onSelect, onClose, searchKey }: {
  visible: boolean; title: string; items: any[];
  onSelect: (item: any) => void; onClose: () => void; searchKey: string;
}) => {
  const [search, setSearch] = useState('');
  const filtered = items.filter((item) =>
    item[searchKey]?.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerBox}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.pickerClose}>
              <Text style={styles.pickerCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.pickerSearch}>
            <TextInput
              placeholder={`Search ${title.toLowerCase()}...`}
              value={search} onChangeText={setSearch}
              style={styles.pickerSearchInput}
              placeholderTextColor={C.textTertiary} autoFocus
            />
          </View>
          {filtered.length === 0 ? (
            <Text style={styles.pickerEmpty}>No results found</Text>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.pickerItem} onPress={() => { onSelect(item); setSearch(''); onClose(); }}>
                  <Text style={styles.pickerItemName}>{item[searchKey]}</Text>
                  {item.email && <Text style={styles.pickerItemSub}>{item.email}</Text>}
                  {item.price && <Text style={styles.pickerItemSub}>₹{item.price} • GST {item.gst}%</Text>}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

// ─── Field ────────────────────────────────────────────────────────────────────
const Field = ({ label, required, prefix, suffix, ...props }: {
  label: string; required?: boolean; prefix?: string; suffix?: string;
} & React.ComponentProps<typeof TextInput>) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>
      {label}{required && <Text style={{ color: C.danger }}> *</Text>}
    </Text>
    <View style={styles.fieldRow}>
      {prefix ? <Text style={styles.fieldAffix}>{prefix}</Text> : null}
      <TextInput
        style={[styles.fieldInput, (prefix || suffix) && { flex: 1, borderRadius: 0, borderLeftWidth: prefix ? 0 : 1, borderRightWidth: suffix ? 0 : 1 }]}
        placeholderTextColor={C.textTertiary} {...props}
      />
      {suffix ? <Text style={[styles.fieldAffix, styles.fieldSuffix]}>{suffix}</Text> : null}
    </View>
  </View>
);

// ─── Selector Button ──────────────────────────────────────────────────────────
const SelectorBtn = ({ label, value, placeholder, onPress }: {
  label: string; value: string; placeholder: string; onPress: () => void;
}) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label} <Text style={{ color: C.danger }}>*</Text></Text>
    <TouchableOpacity style={styles.selectorBtn} onPress={onPress} activeOpacity={0.8}>
      <Text style={[styles.selectorText, !value && { color: C.textTertiary }]}>{value || placeholder}</Text>
      <Text style={styles.selectorArrow}>▼</Text>
    </TouchableOpacity>
  </View>
);

// ─── Summary row ──────────────────────────────────────────────────────────────
const SummaryRow = ({ label, value, large }: { label: string; value: string; large?: boolean }) => (
  <View style={styles.summaryRow}>
    <Text style={[styles.summaryLabel, large && styles.summaryLabelLarge]}>{label}</Text>
    <Text style={[styles.summaryValue, large && styles.summaryValueLarge]}>{value}</Text>
  </View>
);

// ─── Invoice list card ────────────────────────────────────────────────────────
const InvoiceCard = ({ item, onDelete, onShare, onEdit, index }: {
  item: any; onDelete: () => void; onShare: () => void;
  onEdit: () => void; index: number;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 260, delay: Math.min(index * 40, 300), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 260, delay: Math.min(index * 40, 300), useNativeDriver: true }),
    ]).start();
  }, []);

  const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <Animated.View style={[styles.invCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.invCardTop}>
        <View style={styles.invIcon}><Text style={styles.invIconText}>🧾</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.invCustomer} numberOfLines={1}>{item.customerName}</Text>
          <Text style={styles.invDate}>{date}</Text>
        </View>
        <View style={styles.invTotalBadge}>
          <Text style={styles.invTotalBadgeText}>₹{item.total?.toFixed(2)}</Text>
        </View>
      </View>
      <View style={styles.invDivider} />
      <View style={styles.invDetails}>
        <View style={styles.invDetailItem}>
          <Text style={styles.invDetailLabel}>Product</Text>
          <Text style={styles.invDetailValue} numberOfLines={1}>{item.productName}</Text>
        </View>
        <View style={styles.invDetailItem}>
          <Text style={styles.invDetailLabel}>Qty × Price</Text>
          <Text style={styles.invDetailValue}>{item.quantity} × ₹{item.price}</Text>
        </View>
        <View style={styles.invDetailItem}>
          <Text style={styles.invDetailLabel}>GST</Text>
          <Text style={styles.invDetailValue}>{item.gst}%</Text>
        </View>
      </View>
      <View style={styles.invActions}>
        <TouchableOpacity style={styles.invShareBtn} onPress={onShare} activeOpacity={0.8}>
          <Text style={styles.invShareBtnText}>📤  Share PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.invEditBtn} onPress={onEdit} activeOpacity={0.8}>
          <Text style={styles.invEditBtnText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.invDeleteBtn} onPress={onDelete} activeOpacity={0.8}>
          <Text style={styles.invDeleteBtnText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function InvoicesScreen() {
  const [tab, setTab] = useState<'create' | 'list'>('create');

  // Form fields
  const [customerName, setCustomerName] = useState('');
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [gst, setGst] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);

  // Search
  const [search, setSearch] = useState('');

  // Data
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Picker modals
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);

  const subtotal = Number(price) * Number(quantity);
  const gstAmount = subtotal * (Number(gst) / 100);
  const total = subtotal + gstAmount;
  const isFormReady = customerName && productName && price && quantity && gst;

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) =>
    inv.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    inv.productName?.toLowerCase().includes(search.toLowerCase()) ||
    inv.total?.toString().includes(search)
  );

  const fetchAll = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([fetch(CUSTOMERS_URL), fetch(PRODUCTS_URL)]);
      const custData = await custRes.json();
      const prodData = await prodRes.json();
      if (Array.isArray(custData)) setCustomers(custData);
      if (Array.isArray(prodData)) setProducts(prodData);
    } catch { }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      const data = await res.json();
      if (Array.isArray(data)) setInvoices(data);
    } catch {
      Alert.alert('Error', 'Could not fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { if (tab === 'list') fetchInvoices(); }, [tab]);

  const onSelectCustomer = (customer: any) => setCustomerName(customer.name);
  const onSelectProduct = (product: any) => {
    setProductName(product.name);
    setPrice(product.price.toString());
    setGst(product.gst.toString());
  };

  // Open edit modal
  const openEdit = (invoice: any) => {
    setEditingInvoice(invoice);
    setCustomerName(invoice.customerName);
    setProductName(invoice.productName);
    setPrice(invoice.price.toString());
    setQuantity(invoice.quantity.toString());
    setGst(invoice.gst.toString());
    setTab('create');
  };

  // Reset form
  const resetForm = () => {
    setEditingInvoice(null);
    setCustomerName(''); setProductName('');
    setPrice(''); setQuantity(''); setGst('');
  };

  const buildHtml = (data: any) => `
    <html><body style="font-family: Arial; padding: 40px; color: #111;">
      <div><h1 style="color:#1A56DB; margin:0; font-size:32px;">INVOICE</h1>
      <p style="color:#9CA3AF; margin:4px 0 0;">${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
      <hr style="border:none; border-top:2px solid #E5E3DC; margin:24px 0;"/>
      <h2 style="margin:0 0 4px;">${data.customerName}</h2>
      <table width="100%" style="border-collapse:collapse; margin-top:24px;">
        <tr style="background:#F7F6F2;">
          <th style="padding:12px 16px; text-align:left; border:1px solid #E5E3DC; font-size:13px; color:#6B7280;">Product</th>
          <th style="padding:12px 16px; text-align:right; border:1px solid #E5E3DC; font-size:13px; color:#6B7280;">Price</th>
          <th style="padding:12px 16px; text-align:right; border:1px solid #E5E3DC; font-size:13px; color:#6B7280;">Qty</th>
          <th style="padding:12px 16px; text-align:right; border:1px solid #E5E3DC; font-size:13px; color:#6B7280;">Subtotal</th>
        </tr>
        <tr>
          <td style="padding:14px 16px; border:1px solid #E5E3DC;">${data.productName}</td>
          <td style="padding:14px 16px; text-align:right; border:1px solid #E5E3DC;">₹${data.price}</td>
          <td style="padding:14px 16px; text-align:right; border:1px solid #E5E3DC;">${data.quantity}</td>
          <td style="padding:14px 16px; text-align:right; border:1px solid #E5E3DC;">₹${data.subtotal}</td>
        </tr>
      </table>
      <div style="margin-top:24px; text-align:right;">
        <p style="margin:6px 0; color:#6B7280;">Subtotal: ₹${data.subtotal}</p>
        <p style="margin:6px 0; color:#6B7280;">GST (${data.gst}%): ₹${data.gstAmount.toFixed(2)}</p>
        <h2 style="color:#1A56DB; margin:16px 0 0; font-size:28px;">Total: ₹${data.total.toFixed(2)}</h2>
      </div>
      <hr style="border:none; border-top:2px solid #E5E3DC; margin:32px 0 16px;"/>
      <p style="color:#9CA3AF; font-size:12px; margin:0;">Generated on ${new Date().toLocaleDateString()}</p>
    </body></html>
  `;

  const shareInvoicePdf = async (item: any) => {
    try {
      const file = await Print.printToFileAsync({ html: buildHtml(item) });
      await Sharing.shareAsync(file.uri);
    } catch { Alert.alert('Error', 'Could not generate PDF'); }
  };

  const saveInvoice = async () => {
    if (!isFormReady) { Alert.alert('Required', 'Please fill all fields.'); return; }
    try {
      setSaving(true);
      const payload = {
        customerName, productName,
        price: Number(price), quantity: Number(quantity), gst: Number(gst),
        subtotal, gstAmount, total,
      };

      if (editingInvoice) {
        // ✏️ Update existing invoice
        const res = await fetch(`${API_URL}/${editingInvoice._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const updated = await res.json();
        setInvoices(invoices.map((i: any) => i._id === editingInvoice._id ? updated : i));
        resetForm();
        Alert.alert('Done', 'Invoice updated!');
        setTab('list');
      } else {
        // ➕ Create new invoice
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const saved = await res.json();
        if (!saved._id) { Alert.alert('Error', 'Could not save invoice'); return; }
        const file = await Print.printToFileAsync({ html: buildHtml(payload) });
        await Sharing.shareAsync(file.uri);
        resetForm();
        Alert.alert('Done', 'Invoice saved and PDF shared!');
      }
    } catch { Alert.alert('Error', 'Something went wrong'); }
    finally { setSaving(false); }
  };

  const deleteInvoice = (id: string) => {
    Alert.alert('Delete invoice', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            setInvoices(invoices.filter((i: any) => i._id !== id));
          } catch { Alert.alert('Error', 'Could not delete'); }
        }
      }
    ]);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>Finance</Text>
          <Text style={styles.headerTitle}>
            {editingInvoice ? '✏️ Edit Invoice' : 'Invoices'}
          </Text>
        </View>
        {tab === 'list' && !loading && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{filteredInvoices.length}</Text>
          </View>
        )}
      </View>

      {/* Tab switcher */}
      <View style={styles.tabBar}>
        {(['create', 'list'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => { setTab(t); if (t === 'create' && !editingInvoice) resetForm(); }}
            activeOpacity={0.8}>
            <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
              {t === 'create' ? (editingInvoice ? '✏️  Edit' : '✏️  Create') : '📋  All Invoices'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Create / Edit tab */}
      {tab === 'create' ? (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.createScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {editingInvoice && (
              <TouchableOpacity style={styles.cancelEditBtn} onPress={resetForm}>
                <Text style={styles.cancelEditText}>✕ Cancel Edit</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.sectionLabel}>Customer</Text>
            <SelectorBtn label="Select Customer" value={customerName} placeholder="Tap to choose a customer..." onPress={() => setShowCustomerPicker(true)} />
            <Field label="Or type customer name" value={customerName} onChangeText={setCustomerName} placeholder="Type manually..." autoCapitalize="words" />

            <Text style={styles.sectionLabel}>Product</Text>
            <SelectorBtn label="Select Product" value={productName} placeholder="Tap to choose a product..." onPress={() => setShowProductPicker(true)} />
            <Field label="Or type product name" value={productName} onChangeText={setProductName} placeholder="Type manually..." autoCapitalize="words" />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Field label="Price" required prefix="₹" value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="0" />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Field label="Quantity" required value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholder="1" />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <Field label="GST" required suffix="%" value={gst} onChangeText={setGst} keyboardType="numeric" placeholder="18" />
              </View>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>Invoice Summary</Text>
                {isFormReady && <View style={styles.readyPill}><Text style={styles.readyPillText}>Ready ✅</Text></View>}
              </View>
              <SummaryRow label="Customer" value={customerName || '—'} />
              <SummaryRow label="Product" value={productName || '—'} />
              <SummaryRow label="Subtotal" value={`₹${subtotal || 0}`} />
              <SummaryRow label={`GST (${gst || 0}%)`} value={`₹${gstAmount.toFixed(2)}`} />
              <View style={styles.summaryDivider} />
              <SummaryRow label="Total" value={`₹${total.toFixed(2)}`} large />
            </View>

            <TouchableOpacity
              style={[styles.generateBtn, (!isFormReady || saving) && styles.generateBtnDisabled]}
              onPress={saveInvoice} disabled={!isFormReady || saving} activeOpacity={0.85}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : (
                <Text style={styles.generateBtnText}>
                  {editingInvoice ? '💾  Update Invoice' : '💾  Save & Generate PDF'}
                </Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>

      ) : (
        <View style={{ flex: 1 }}>
          {/* 🔍 Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="🔍 Search by customer, product..."
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
              placeholderTextColor={C.textTertiary}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
                <Text style={styles.clearText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {search.length > 0 && (
            <Text style={styles.resultCount}>
              {filteredInvoices.length} result{filteredInvoices.length !== 1 ? 's' : ''} found
            </Text>
          )}

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={C.brand} />
              <Text style={styles.loadingText}>Loading invoices…</Text>
            </View>
          ) : filteredInvoices.length === 0 ? (
            <View style={styles.centered}>
              <Text style={styles.emptyIcon}>{search ? '🔍' : '🧾'}</Text>
              <Text style={styles.emptyTitle}>{search ? `No results for "${search}"` : 'No invoices yet'}</Text>
              <Text style={styles.emptyBody}>{search ? 'Try a different search term' : 'Switch to Create to make your first invoice.'}</Text>
            </View>
          ) : (
            <FlatList
              data={filteredInvoices}
              keyExtractor={(item: any) => item._id}
              renderItem={({ item, index }) => (
                <InvoiceCard
                  item={item} index={index}
                  onDelete={() => deleteInvoice(item._id)}
                  onShare={() => shareInvoicePdf(item)}
                  onEdit={() => openEdit(item)}
                />
              )}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}

      <PickerModal visible={showCustomerPicker} title="Select Customer" items={customers} searchKey="name" onSelect={onSelectCustomer} onClose={() => setShowCustomerPicker(false)} />
      <PickerModal visible={showProductPicker} title="Select Product" items={products} searchKey="name" onSelect={onSelectProduct} onClose={() => setShowProductPicker(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  headerLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 1.2, color: C.textTertiary, textTransform: 'uppercase', marginBottom: 2 },
  headerTitle: { fontSize: 34, fontWeight: '800', color: C.textPrimary, letterSpacing: -0.5 },
  countBadge: { backgroundColor: C.brandLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  countBadgeText: { fontSize: 13, fontWeight: '700', color: C.brand },
  tabBar: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: C.surfaceAlt, borderRadius: 14, padding: 4, gap: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabBtnActive: { backgroundColor: C.brand },
  tabBtnText: { fontSize: 14, fontWeight: '600', color: C.textSecondary },
  tabBtnTextActive: { color: '#fff' },
  createScroll: { paddingHorizontal: 20, paddingTop: 4 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.textTertiary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginTop: 8 },
  row: { flexDirection: 'row' },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: C.textSecondary, letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
  fieldRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 12, backgroundColor: C.surface, overflow: 'hidden' },
  fieldAffix: { paddingHorizontal: 12, fontSize: 15, color: C.textSecondary, backgroundColor: C.surfaceAlt, paddingVertical: 14, borderRightWidth: 1, borderRightColor: C.border },
  fieldSuffix: { borderRightWidth: 0, borderLeftWidth: 1, borderLeftColor: C.border },
  fieldInput: { flex: 1, padding: 14, fontSize: 15, color: C.textPrimary, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 12 },
  selectorBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.surface, borderWidth: 1, borderColor: C.brand, borderRadius: 12, padding: 14 },
  selectorText: { fontSize: 15, color: C.textPrimary, fontWeight: '600', flex: 1 },
  selectorArrow: { fontSize: 12, color: C.brand, marginLeft: 8 },
  cancelEditBtn: { backgroundColor: C.dangerLight, borderRadius: 12, padding: 12, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: C.danger },
  cancelEditText: { color: C.danger, fontWeight: '700', fontSize: 14 },
  summaryCard: { backgroundColor: C.surface, borderRadius: 16, padding: 20, marginTop: 8, marginBottom: 20, borderWidth: 1, borderColor: C.border },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary },
  readyPill: { backgroundColor: C.successLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  readyPillText: { fontSize: 12, fontWeight: '700', color: C.success },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 14, color: C.textSecondary },
  summaryValue: { fontSize: 14, fontWeight: '600', color: C.textPrimary },
  summaryLabelLarge: { fontSize: 17, fontWeight: '700', color: C.textPrimary },
  summaryValueLarge: { fontSize: 20, fontWeight: '800', color: C.brand },
  summaryDivider: { height: 1, backgroundColor: C.border, marginVertical: 12 },
  generateBtn: { backgroundColor: C.brand, borderRadius: 14, padding: 18, alignItems: 'center' },
  generateBtnDisabled: { opacity: 0.45 },
  generateBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 12, marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, padding: 14, fontSize: 15, color: C.textPrimary },
  clearBtn: { padding: 8 },
  clearText: { fontSize: 16, color: C.textTertiary },
  resultCount: { fontSize: 13, color: C.textTertiary, marginLeft: 20, marginBottom: 8 },
  list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 100 },
  invCard: { backgroundColor: C.surface, borderRadius: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  invCardTop: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  invIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.brandLight, alignItems: 'center', justifyContent: 'center' },
  invIconText: { fontSize: 22 },
  invCustomer: { fontSize: 16, fontWeight: '700', color: C.textPrimary },
  invDate: { fontSize: 12, color: C.textTertiary, marginTop: 2 },
  invTotalBadge: { backgroundColor: C.brandLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  invTotalBadgeText: { fontSize: 14, fontWeight: '800', color: C.brand },
  invDivider: { height: 1, backgroundColor: C.border },
  invDetails: { flexDirection: 'row', padding: 16, gap: 8 },
  invDetailItem: { flex: 1 },
  invDetailLabel: { fontSize: 11, fontWeight: '600', color: C.textTertiary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  invDetailValue: { fontSize: 13, fontWeight: '600', color: C.textPrimary },
  invActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.border, padding: 12, gap: 10 },
  invShareBtn: { flex: 1, backgroundColor: C.brandLight, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  invShareBtnText: { fontSize: 14, fontWeight: '700', color: C.brand },
  invEditBtn: { width: 42, height: 42, borderRadius: 10, backgroundColor: C.successLight, alignItems: 'center', justifyContent: 'center' },
  invEditBtnText: { fontSize: 18 },
  invDeleteBtn: { width: 42, height: 42, borderRadius: 10, backgroundColor: C.dangerLight, alignItems: 'center', justifyContent: 'center' },
  invDeleteBtnText: { fontSize: 18 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  loadingText: { marginTop: 12, fontSize: 14, color: C.textTertiary },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary, textAlign: 'center', marginBottom: 6 },
  emptyBody: { fontSize: 14, color: C.textSecondary, textAlign: 'center' },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerBox: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '75%', paddingBottom: 30 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  pickerTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary },
  pickerClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  pickerCloseText: { fontSize: 14, color: C.textSecondary, fontWeight: '700' },
  pickerSearch: { padding: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  pickerSearchInput: { backgroundColor: C.bg, borderRadius: 12, padding: 12, fontSize: 15, color: C.textPrimary },
  pickerEmpty: { textAlign: 'center', padding: 30, color: C.textTertiary, fontSize: 14 },
  pickerItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  pickerItemName: { fontSize: 16, fontWeight: '600', color: C.textPrimary },
  pickerItemSub: { fontSize: 13, color: C.textTertiary, marginTop: 3 },
});