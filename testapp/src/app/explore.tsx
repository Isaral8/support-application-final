import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_URL as BASE_URL } from '../services/auth';

const STATS_URL = `${BASE_URL}/api/stats`;
const INVOICES_URL = `${BASE_URL}/api/invoices`;

const C = {
  bg: '#F7F6F2',
  surface: '#FFFFFF',
  surfaceAlt: '#F0EEE8',
  brand: '#1A56DB',
  brandLight: '#EBF2FF',
  success: '#16A34A',
  successLight: '#F0FDF4',
  amber: '#D97706',
  amberLight: '#FFFBEB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E3DC',
};

const DATE_FILTERS = ['Today', 'Week', 'Month', 'All'];

const filterInvoices = (invoices: any[], filter: string) => {
  const now = new Date();
  return invoices.filter((inv) => {
    const date = new Date(inv.createdAt);
    if (filter === 'Today') return date.toDateString() === now.toDateString();
    if (filter === 'Week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return date >= weekAgo;
    }
    if (filter === 'Month') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    return true;
  });
};

// ── Bar Chart (pure RN) ──────────────────────────────────────────────────────
const BarChart = ({ data }: { data: { date: string; total: number }[] }) => {
  if (data.length === 0) return <Text style={styles.emptyText}>No data for this period</Text>;
  const maxVal = Math.max(...data.map((d) => d.total), 1);
  return (
    <View style={styles.barChart}>
      {data.map((item, index) => {
        const barH = Math.max((item.total / maxVal) * 110, 8);
        const isMax = item.total === maxVal;
        return (
          <View key={index} style={styles.barCol}>
            <Text style={styles.barValue}>
              {item.total >= 1000 ? `₹${(item.total / 1000).toFixed(1)}k` : `₹${item.total.toFixed(0)}`}
            </Text>
            <View style={styles.barTrack}>
              <View style={[styles.bar, { height: barH, backgroundColor: isMax ? C.brand : C.brandLight }]} />
            </View>
            <Text style={styles.barLabel}>{item.date}</Text>
          </View>
        );
      })}
    </View>
  );
};

// ── Pie Chart (pure RN using View widths) ────────────────────────────────────
const PieChart = ({ data }: { data: { label: string; value: number; color: string; lightColor: string }[] }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <Text style={styles.emptyText}>No data for this period</Text>;
  return (
    <View>
      {/* Horizontal bar as pie representation */}
      <View style={styles.pieBar}>
        {data.map((d, i) => {
          const pct = (d.value / total) * 100;
          return (
            <View
              key={i}
              style={{
                width: `${pct}%`,
                height: 28,
                backgroundColor: d.color,
                borderRadius: i === 0 ? 8 : 0,
                borderTopRightRadius: i === data.length - 1 ? 8 : 0,
                borderBottomRightRadius: i === data.length - 1 ? 8 : 0,
              }}
            />
          );
        })}
      </View>
      {/* Legend */}
      <View style={styles.pieLegend}>
        {data.map((d, i) => (
          <View key={i} style={[styles.legendItem, { backgroundColor: d.lightColor }]}>
            <View style={[styles.legendDot, { backgroundColor: d.color }]} />
            <View>
              <Text style={styles.legendLabel}>{d.label}</Text>
              <Text style={[styles.legendValue, { color: d.color }]}>
                ₹{d.value.toFixed(0)} ({((d.value / total) * 100).toFixed(0)}%)
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

// ── Line Chart (pure RN using View heights) ──────────────────────────────────
const LineChart = ({ data }: { data: { date: string; total: number }[] }) => {
  if (data.length === 0) return <Text style={styles.emptyText}>No data for this period</Text>;
  const maxVal = Math.max(...data.map((d) => d.total), 1);
  return (
    <View>
      <View style={styles.lineChart}>
        {data.map((item, index) => {
          const heightPct = Math.max((item.total / maxVal) * 100, 5);
          return (
            <View key={index} style={styles.lineCol}>
              <Text style={styles.lineValue}>
                {item.total >= 1000 ? `₹${(item.total / 1000).toFixed(1)}k` : `₹${item.total.toFixed(0)}`}
              </Text>
              <View style={styles.lineTrack}>
                <View style={styles.lineDotContainer}>
                  <View style={[styles.lineFill, { height: `${heightPct}%` }]} />
                  <View style={styles.lineDot} />
                </View>
              </View>
              <Text style={styles.lineLabel}>{item.date}</Text>
            </View>
          );
        })}
      </View>
      {/* Connecting line base */}
      <View style={styles.lineBase} />
    </View>
  );
};

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function ReportsScreen() {
  const [stats, setStats] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  const fetchData = async () => {
    try {
      const [statsRes, invoicesRes] = await Promise.all([fetch(STATS_URL), fetch(INVOICES_URL)]);
      setStats(await statsRes.json());
      const inv = await invoicesRes.json();
      if (Array.isArray(inv)) setInvoices(inv);
    } catch { } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = filterInvoices(invoices, activeFilter);

  const revenueByDate = filtered.reduce((acc: any, inv: any) => {
    const date = new Date(inv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    acc[date] = (acc[date] || 0) + inv.total;
    return acc;
  }, {});
  const revenueData = Object.entries(revenueByDate).map(([date, total]) => ({ date, total: total as number }));

  const customerTotals = filtered.reduce((acc: any, inv: any) => {
    acc[inv.customerName] = (acc[inv.customerName] || 0) + inv.total;
    return acc;
  }, {});
  const topCustomers = Object.entries(customerTotals)
    .map(([name, total]) => ({ name, total: total as number }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  const maxCustomer = Math.max(...topCustomers.map((c) => c.total), 1);

  const totalRevenue = filtered.reduce((s, inv) => s + (inv.total || 0), 0);
  const totalGst = filtered.reduce((s, inv) => s + (inv.gstAmount || 0), 0);
  const totalSubtotal = filtered.reduce((s, inv) => s + (inv.subtotal || 0), 0);

  const pieData = [
    { label: 'Subtotal', value: totalSubtotal, color: C.brand, lightColor: C.brandLight },
    { label: 'GST', value: totalGst, color: C.amber, lightColor: C.amberLight },
  ];

  const rankColors = [
    { bg: '#FFFBEB', fg: '#D97706' },
    { bg: '#F0EEE8', fg: '#6B7280' },
    { bg: '#FEF2F2', fg: '#DC2626' },
    { bg: C.surfaceAlt, fg: C.textTertiary },
    { bg: C.surfaceAlt, fg: C.textTertiary },
  ];

  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" color={C.brand} />
        <Text style={styles.loadingText}>Loading reports…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>Analytics</Text>
          <Text style={styles.headerTitle}>Reports</Text>
        </View>

        {/* Date Filter */}
        <View style={styles.filterRow}>
          {DATE_FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, activeFilter === f && styles.filterBtnActive]}
              onPress={() => setActiveFilter(f)}>
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stat Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: C.brandLight }]}>
            <Text style={styles.statEmoji}>👥</Text>
            <Text style={[styles.statValue, { color: C.brand }]}>{stats?.totalCustomers ?? 0}</Text>
            <Text style={[styles.statLabel, { color: C.brand }]}>Customers</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: C.successLight }]}>
            <Text style={styles.statEmoji}>🧾</Text>
            <Text style={[styles.statValue, { color: C.success }]}>{filtered.length}</Text>
            <Text style={[styles.statLabel, { color: C.success }]}>Invoices</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: C.amberLight }]}>
            <Text style={styles.statEmoji}>💰</Text>
            <Text style={[styles.statValue, { color: C.amber }]}>₹{(totalRevenue / 1000).toFixed(1)}k</Text>
            <Text style={[styles.statLabel, { color: C.amber }]}>Revenue</Text>
          </View>
        </View>

        {/* Bar Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Revenue Trend</Text>
          <BarChart data={revenueData} />
        </View>

        {/* Line Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📈 Revenue Over Time</Text>
          <LineChart data={revenueData} />
        </View>

        {/* Pie Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🥧 Revenue Breakdown</Text>
          <PieChart data={pieData} />
        </View>

        {/* Top Customers */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👥 Top Customers</Text>
          {topCustomers.length === 0 ? (
            <Text style={styles.emptyText}>No data for this period</Text>
          ) : topCustomers.map((customer, index) => {
            const pct = (customer.total / maxCustomer) * 100;
            const { bg, fg } = rankColors[index] || rankColors[4];
            return (
              <View key={index} style={styles.customerRow}>
                <View style={[styles.rankBadge, { backgroundColor: bg }]}>
                  <Text style={[styles.rankText, { color: fg }]}>#{index + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.customerTopRow}>
                    <Text style={styles.customerName} numberOfLines={1}>{customer.name}</Text>
                    <Text style={styles.customerAmount}>₹{customer.total.toFixed(0)}</Text>
                  </View>
                  <View style={styles.progressBg}>
                    <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: index === 0 ? C.brand : C.brandLight }]} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Invoice Table */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🧾 Recent Invoices</Text>
          {filtered.length === 0 ? (
            <Text style={styles.emptyText}>No invoices for this period</Text>
          ) : (
            <>
              <View style={styles.tableHead}>
                <Text style={[styles.tableHeadCell, { flex: 2 }]}>Customer</Text>
                <Text style={[styles.tableHeadCell, { flex: 1, textAlign: 'center' }]}>GST</Text>
                <Text style={[styles.tableHeadCell, { flex: 1.2, textAlign: 'right' }]}>Total</Text>
              </View>
              {filtered.slice(0, 5).map((inv: any, index: number) => (
                <View key={index} style={[styles.tableRow, index % 2 !== 0 && { backgroundColor: C.bg }]}>
                  <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>{inv.customerName}</Text>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={styles.gstPillText}>{inv.gst}%</Text>
                  </View>
                  <Text style={[styles.tableCell, { flex: 1.2, textAlign: 'right', color: C.success, fontWeight: '700' }]}>
                    ₹{inv.total?.toFixed(0)}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* GST Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏛️ GST Summary</Text>
          <View style={styles.gstGrid}>
            <View style={[styles.gstBox, { backgroundColor: C.successLight }]}>
              <Text style={styles.gstBoxEmoji}>🏛️</Text>
              <Text style={[styles.gstBoxValue, { color: C.success }]}>₹{totalGst.toFixed(0)}</Text>
              <Text style={styles.gstBoxLabel}>GST collected</Text>
            </View>
            <View style={[styles.gstBox, { backgroundColor: C.brandLight }]}>
              <Text style={styles.gstBoxEmoji}>📋</Text>
              <Text style={[styles.gstBoxValue, { color: C.brand }]}>₹{totalSubtotal.toFixed(0)}</Text>
              <Text style={styles.gstBoxLabel}>Subtotal</Text>
            </View>
            <View style={[styles.gstBox, { backgroundColor: C.amberLight, flex: 2 }]}>
              <Text style={styles.gstBoxEmoji}>💰</Text>
              <Text style={[styles.gstBoxValue, { color: C.amber, fontSize: 22 }]}>₹{totalRevenue.toFixed(0)}</Text>
              <Text style={styles.gstBoxLabel}>Gross revenue</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  loadingRoot: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: C.textTertiary },
  scroll: { paddingBottom: 24 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 16 },
  headerLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 1.2, color: C.textTertiary, textTransform: 'uppercase', marginBottom: 2 },
  headerTitle: { fontSize: 34, fontWeight: '800', color: C.textPrimary, letterSpacing: -0.5 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  filterBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border },
  filterBtnActive: { backgroundColor: C.brand, borderColor: C.brand },
  filterText: { fontSize: 13, fontWeight: '600', color: C.textSecondary },
  filterTextActive: { color: '#fff' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center' },
  statEmoji: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.75 },
  card: { backgroundColor: C.surface, marginHorizontal: 16, marginBottom: 14, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary, marginBottom: 16 },
  emptyText: { color: C.textTertiary, textAlign: 'center', paddingVertical: 20, fontSize: 14 },
  // Bar chart
  barChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 155, paddingTop: 8 },
  barCol: { alignItems: 'center', flex: 1, gap: 4 },
  barValue: { fontSize: 9, color: C.textTertiary, textAlign: 'center' },
  barTrack: { justifyContent: 'flex-end', height: 110 },
  bar: { width: 26, borderRadius: 6, minHeight: 6 },
  barLabel: { fontSize: 9, color: C.textSecondary, textAlign: 'center' },
  // Line chart
  lineChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 130 },
  lineCol: { alignItems: 'center', flex: 1 },
  lineValue: { fontSize: 9, color: C.textTertiary, marginBottom: 4, textAlign: 'center' },
  lineTrack: { height: 100, justifyContent: 'flex-end', alignItems: 'center' },
  lineDotContainer: { alignItems: 'center', justifyContent: 'flex-end' },
  lineFill: { width: 3, backgroundColor: C.brand, borderRadius: 2 },
  lineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.brand, borderWidth: 2, borderColor: C.surface },
  lineLabel: { fontSize: 9, color: C.textSecondary, marginTop: 4, textAlign: 'center' },
  lineBase: { height: 1, backgroundColor: C.border, marginTop: 4 },
  // Pie chart
  pieBar: { flexDirection: 'row', height: 28, borderRadius: 8, overflow: 'hidden', marginBottom: 16 },
  pieLegend: { flexDirection: 'row', gap: 10 },
  legendItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { fontSize: 12, color: C.textSecondary, fontWeight: '600' },
  legendValue: { fontSize: 14, fontWeight: '800' },
  // Customers
  customerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
  rankBadge: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  rankText: { fontSize: 12, fontWeight: '800' },
  customerTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  customerName: { fontSize: 14, fontWeight: '600', color: C.textPrimary, flex: 1 },
  customerAmount: { fontSize: 14, fontWeight: '700', color: C.success, marginLeft: 8 },
  progressBg: { height: 5, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 3 },
  // Table
  tableHead: { flexDirection: 'row', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 2 },
  tableHeadCell: { fontSize: 11, fontWeight: '700', color: C.textTertiary, textTransform: 'uppercase', letterSpacing: 0.4 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, borderRadius: 8 },
  tableCell: { fontSize: 14, color: C.textPrimary },
  gstPillText: { fontSize: 12, fontWeight: '600', color: C.amber, backgroundColor: C.amberLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden' },
  // GST
  gstGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gstBox: { flex: 1, minWidth: '45%', borderRadius: 12, padding: 16, alignItems: 'center', gap: 4 },
  gstBoxEmoji: { fontSize: 22, marginBottom: 4 },
  gstBoxValue: { fontSize: 18, fontWeight: '800' },
  gstBoxLabel: { fontSize: 11, color: C.textTertiary, textAlign: 'center', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
});