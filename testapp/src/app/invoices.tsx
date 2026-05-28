import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
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

// ─── Colour tokens ────────────────────────────────────────────────────────────
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

// ─── Field ────────────────────────────────────────────────────────────────────
const Field = ({
  label,
  required,
  prefix,
  suffix,
  ...props
}: {
  label: string;
  required?: boolean;
  prefix?: string;
  suffix?: string;
} & React.ComponentProps<typeof TextInput>) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>
      {label}
      {required && <Text style={{ color: C.danger }}> *</Text>}
    </Text>
    <View style={styles.fieldRow}>
      {prefix ? <Text style={styles.fieldAffix}>{prefix}</Text> : null}
      <TextInput
        style={[styles.fieldInput, (prefix || suffix) && { flex: 1, borderRadius: 0, borderLeftWidth: prefix ? 0 : 1, borderRightWidth: suffix ? 0 : 1 }]}
        placeholderTextColor={C.textTertiary}
        {...props}
      />
      {suffix ? <Text style={[styles.fieldAffix, styles.fieldSuffix]}>{suffix}</Text> : null}
    </View>
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
const InvoiceCard = ({
  item,
  onDelete,
  onShare,
  index,
}: {
  item: any;
  onDelete: () => void;
  onShare: () => void;
  index: number;
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
      {/* Top row */}
      <View style={styles.invCardTop}>
        <View style={styles.invIcon}>
          <Text style={styles.invIconText}>🧾</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.invCustomer} numberOfLines={1}>{item.customerName}</Text>
          <Text style={styles.invDate}>{date}</Text>
        </View>
        <View style={styles.invTotalBadge}>
          <Text style={styles.invTotalBadgeText}>₹{item.total?.toFixed(2)}</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.invDivider} />

      {/* Details row */}
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

      {/* Actions */}
      <View style={styles.invActions}>
        <TouchableOpacity style={styles.invShareBtn} onPress={onShare} activeOpacity={0.8}>
          <Text style={styles.invShareBtnText}>📤  Share PDF</Text>
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
  const [customerName, setCustomerName] = useState('');
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [gst, setGst] = useState('');
  const [saving, setSaving] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const subtotal = Number(price) * Number(quantity);
  const gstAmount = subtotal * (Number(gst) / 100);
  const total = subtotal + gstAmount;

  const isFormReady = customerName && productName && price && quantity && gst;

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

  useEffect(() => {
    if (tab === 'list') fetchInvoices();
  }, [tab]);

  const buildHtml = (data: {
    customerName: string; productName: string;
    price: number; quantity: number; gst: number;
    subtotal: number; gstAmount: number; total: number;
  }) => `
    <html><body style="font-family: Arial; padding: 40px; color: #111;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div><h1 style="color:#1A56DB; margin:0; font-size:32px;">INVOICE</h1>
        <p style="color:#9CA3AF; margin:4px 0 0;">${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
      </div>
      <hr style="border:none; border-top:2px solid #E5E3DC; margin:24px 0;"/>
      <h2 style="margin:0 0 4px;">${data.customerName}</h2>
      <table width="100%" style="border-collapse:collapse; margin-top:24px;">
        <tr style="background:#F7F6F2;">
          <th style="padding:12px 16px; text-align:left; border:1px solid #E5E3DC; font-size:13px; text-transform:uppercase; letter-spacing:0.5px; color:#6B7280;">Product</th>
          <th style="padding:12px 16px; text-align:right; border:1px solid #E5E3DC; font-size:13px; text-transform:uppercase; letter-spacing:0.5px; color:#6B7280;">Price</th>
          <th style="padding:12px 16px; text-align:right; border:1px solid #E5E3DC; font-size:13px; text-transform:uppercase; letter-spacing:0.5px; color:#6B7280;">Qty</th>
          <th style="padding:12px 16px; text-align:right; border:1px solid #E5E3DC; font-size:13px; text-transform:uppercase; letter-spacing:0.5px; color:#6B7280;">Subtotal</th>
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
      const html = buildHtml(item);
      const file = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(file.uri);
    } catch {
      Alert.alert('Error', 'Could not generate PDF');
    }
  };

  const generateAndSave = async () => {
    if (!isFormReady) {
      Alert.alert('Required fields', 'Please fill in all fields.');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        customerName, productName,
        price: Number(price), quantity: Number(quantity), gst: Number(gst),
        subtotal, gstAmount, total,
      };
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const saved = await res.json();
      if (!saved._id) { Alert.alert('Error', 'Could not save invoice'); return; }

      const html = buildHtml(payload);
      const file = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(file.uri);

      setCustomerName(''); setProductName(''); setPrice(''); setQuantity(''); setGst('');
      Alert.alert('Done', 'Invoice saved and PDF shared!');
    } catch {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setSaving(false);
    }
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

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>Finance</Text>
          <Text style={styles.headerTitle}>Invoices</Text>
        </View>
        {tab === 'list' && !loading && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{invoices.length}</Text>
          </View>
        )}
      </View>

      {/* ── Tab switcher ── */}
      <View style={styles.tabBar}>
        {(['create', 'list'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
              {t === 'create' ? '✏️  Create' : '📋  All Invoices'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Create tab ── */}
      {tab === 'create' ? (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.createScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            <Text style={styles.sectionLabel}>Customer</Text>
            <Field label="Customer name" required value={customerName} onChangeText={setCustomerName} placeholder="e.g. Priya Sharma" autoCapitalize="words" />

            <Text style={styles.sectionLabel}>Product</Text>
            <Field label="Product name" required value={productName} onChangeText={setProductName} placeholder="e.g. Steel Rods" autoCapitalize="words" />

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

            {/* Live summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>Invoice Summary</Text>
                {isFormReady && (
                  <View style={styles.readyPill}>
                    <Text style={styles.readyPillText}>Ready</Text>
                  </View>
                )}
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
              onPress={generateAndSave}
              disabled={!isFormReady || saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.generateBtnText}>💾  Save & Generate PDF</Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>

      ) : (
        /* ── List tab ── */
        loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={C.brand} />
            <Text style={styles.loadingText}>Loading invoices…</Text>
          </View>
        ) : invoices.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyIcon}>🧾</Text>
            <Text style={styles.emptyTitle}>No invoices yet</Text>
            <Text style={styles.emptyBody}>Switch to Create to make your first invoice.</Text>
          </View>
        ) : (
          <FlatList
            data={invoices}
            keyExtractor={(item: any) => item._id}
            renderItem={({ item, index }) => (
              <InvoiceCard
                item={item}
                index={index}
                onDelete={() => deleteInvoice(item._id)}
                onShare={() => shareInvoicePdf(item)}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
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
  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.textTertiary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginTop: 4 },

  row: { flexDirection: 'row' },

  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: C.textSecondary, letterSpacing: 0.5, marginBottom: 6, textTransform: 'uppercase' },
  fieldRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 12, backgroundColor: C.surface, overflow: 'hidden' },
  fieldAffix: { paddingHorizontal: 12, fontSize: 15, color: C.textSecondary, backgroundColor: C.surfaceAlt, paddingVertical: 14, borderRightWidth: 1, borderRightColor: C.border },
  fieldSuffix: { borderRightWidth: 0, borderLeftWidth: 1, borderLeftColor: C.border },
  fieldInput: { flex: 1, padding: 14, fontSize: 15, color: C.textPrimary, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 12 },

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
  invDeleteBtn: { width: 42, height: 42, borderRadius: 10, backgroundColor: C.dangerLight, alignItems: 'center', justifyContent: 'center' },
  invDeleteBtnText: { fontSize: 18 },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  loadingText: { marginTop: 12, fontSize: 14, color: C.textTertiary },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary, textAlign: 'center', marginBottom: 6 },
  emptyBody: { fontSize: 14, color: C.textSecondary, textAlign: 'center' },
});
