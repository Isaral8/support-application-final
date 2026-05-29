import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

const C = {
  brand: '#1A56DB',
  bg: '#FFFFFF',
  inactive: '#9CA3AF',
  border: '#F1F5F9',
};

const TabIcon = ({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) => (
  <View style={[styles.tabItem, focused && styles.tabItemActive]}>
    <Text style={styles.tabEmoji}>{emoji}</Text>
    <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
  </View>
);

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}>

      <Tabs.Screen
        name="dashboard/index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" label="Home" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="customers"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👥" label="Customers" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="invoices"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🧾" label="Invoices" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="products"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📦" label="Products" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📊" label="Reports" focused={focused} />
          ),
        }}
      />

      {/* Hidden screens - no tab */}
      <Tabs.Screen
        name="settings"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="login"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="index"
        options={{ href: null }}
      />

    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.border,
    height: 72,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 60,
  },
  tabItemActive: {
    backgroundColor: '#EBF2FF',
  },
  tabEmoji: {
    fontSize: 22,
    marginBottom: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: C.inactive,
  },
  tabLabelActive: {
    color: C.brand,
  },
});