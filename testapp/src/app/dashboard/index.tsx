import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { API_URL as BASE_URL } from '../../services/auth';

const STATS_URL = `${BASE_URL}/api/stats`;

// ─── Colour tokens ────────────────────────────────────────────────────────────
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
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  const [bg, fg] = palette[h % palette.length];
  return { bg, fg };
};

const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({
  emoji,
  value,
  label,
  bg,
  fg,
}: {
  emoji: string;
  value: string;
  label: string;
  bg: string;
  fg: string;
}) => (
  <View style={[styles.statCard, { backgroundColor: bg }]}>
    <Text style={styles.statEmoji}>{emoji}</Text>
    <Text style={[styles.statValue, { color: fg }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: fg }]}>{label}</Text>
  </View>
);

// ─── Section header ───────────────────────────────────────────────────────────
const SectionHeader = ({ title, route }: { title: string; route: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <TouchableOpacity onPress={() => router.push(route as any)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <Text style={styles.seeAll}>See all →</Text>
    </TouchableOpacity>
  </View>
);

// ─── Quick access items ───────────────────────────────────────────────────────
const navItems = [
  { icon: '👥', label: 'Customers', route: '/customers', bg: '#EBF2FF', fg: '#1A56DB' },
  { icon: '🧾', label: 'Invoices', route: '/invoices', bg: '#F0FDF4', fg: '#16A34A' },
  { icon: '📦', label: 'Products', route: '/products', bg: '#FFFBEB', fg: '#D97706' },
  { icon: '📊', label: 'Reports', route: '/explore', bg: '#EEEDFE', fg: '#3C3489' },
];

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch(STATS_URL);
      const data = await res.json();
      setStats(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchStats(); };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.brand} />}
        contentContainerStyle={styles.scroll}
      >

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={styles.headerTitle}>Dashboard</Text>
          </View>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/settings' as any)} activeOpacity={0.7}>
            <Text style={{ fontSize: 20 }}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* ── Stat cards ── */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={C.brand} />
          </View>
        ) : (
          <View style={styles.statsRow}>
            <StatCard
              emoji="👥"
              value={String(stats?.totalCustomers ?? 0)}
              label="Customers"
              bg={C.brandLight}
              fg={C.brand}
            />
            <StatCard
              emoji="🧾"
              value={String(stats?.totalInvoices ?? 0)}
              label="Invoices"
              bg={C.successLight}
              fg={C.success}
            />
            <StatCard
              emoji="💰"
              value={`₹${((stats?.totalRevenue ?? 0) / 1000).toFixed(1)}k`}
              label="Revenue"
              bg={C.amberLight}
              fg={C.amber}
            />
          </View>
        )}

        {/* ── Quick access ── */}
        <View style={styles.quickGrid}>
          {navItems.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={[styles.quickCard, { backgroundColor: item.bg }]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.quickIcon}>{item.icon}</Text>
              <Text style={[styles.quickLabel, { color: item.fg }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Recent customers ── */}
        <View style={styles.section}>
          <SectionHeader title="Recent Customers" route="/customers" />
          {!stats?.recentCustomers?.length ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No customers yet — add one!</Text>
            </View>
          ) : (
            stats.recentCustomers.map((c: any) => {
              const { bg, fg } = avatarColor(c.name || '?');
              return (
                <View key={c._id} style={styles.listCard}>
                  <View style={[styles.avatar, { backgroundColor: bg }]}>
                    <Text style={[styles.avatarText, { color: fg }]}>{initials(c.name || '?')}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listName}>{c.name}</Text>
                    <Text style={styles.listSub}>{c.email}</Text>
                  </View>
                  <Text style={styles.listMeta}>{c.phone}</Text>
                </View>
              );
            })
          )}
        </View>

        {/* ── Recent invoices ── */}
        <View style={styles.section}>
          <SectionHeader title="Recent Invoices" route="/invoices" />
          {!stats?.recentInvoices?.length ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No invoices yet — create one!</Text>
            </View>
          ) : (
            stats.recentInvoices.map((inv: any) => (
              <View key={inv._id} style={styles.invoiceCard}>
                <View style={styles.invIconBox}>
                  <Text style={{ fontSize: 20 }}>🧾</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listName}>{inv.customerName}</Text>
                  <Text style={styles.listSub}>{inv.productName}</Text>
                </View>
                <View style={styles.invAmountBadge}>
                  <Text style={styles.invAmountText}>₹{inv.total?.toFixed(0)}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 40 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  greeting: { fontSize: 13, color: C.textTertiary, marginBottom: 2, fontWeight: '500' },
  headerTitle: { fontSize: 32, fontWeight: '800', color: C.textPrimary, letterSpacing: -0.5 },
  settingsBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.surfaceAlt, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border },

  loadingBox: { paddingVertical: 36, alignItems: 'center' },

  statsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4, gap: 10 },
  statCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', gap: 4 },
  statEmoji: { fontSize: 24, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.75 },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  quickCard: { width: '47.5%', borderRadius: 16, padding: 20, alignItems: 'center', gap: 8 },
  quickIcon: { fontSize: 30 },
  quickLabel: { fontSize: 14, fontWeight: '700' },

  section: { marginHorizontal: 16, marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: C.textPrimary },
  seeAll: { fontSize: 13, color: C.brand, fontWeight: '600' },

  listCard: {
    backgroundColor: C.surface, borderRadius: 14, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: C.border,
  },
  avatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarText: { fontSize: 16, fontWeight: '700' },
  listName: { fontSize: 15, fontWeight: '600', color: C.textPrimary },
  listSub: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  listMeta: { fontSize: 12, color: C.textTertiary },

  invoiceCard: {
    backgroundColor: C.surface, borderRadius: 14, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: C.border,
  },
  invIconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: C.successLight, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  invAmountBadge: { backgroundColor: C.successLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  invAmountText: { fontSize: 14, fontWeight: '700', color: C.success },

  emptyBox: { paddingVertical: 16, alignItems: 'center' },
  emptyText: { fontSize: 14, color: C.textTertiary },
});
