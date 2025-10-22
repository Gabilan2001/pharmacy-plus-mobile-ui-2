import { colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, Clock, MapPin, Package, Truck, DollarSign, Phone, User } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useEffect, useState } from 'react';
import { Order } from '@/types';

export default function DeliveryDashboard() {
  const { currentUser, apiRequest } = useAuth();
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDeliveries = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await apiRequest('GET', '/orders/mydeliveries');
      setOrders(data);
    } catch (e) {
      console.error('Failed to load deliveries for dashboard', e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [apiRequest, currentUser]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const myOrders = orders;
  const activeOrders = myOrders.filter(o => o.status === 'on_the_way');
  const completedOrders = myOrders.filter(o => o.status === 'delivered');

  const stats = [
    {
      title: 'Active Deliveries',
      value: activeOrders.length.toString(),
      icon: Package,
      color: '#FFB84D',
      bgColor: '#FFF4E6',
    },
    {
      title: 'Completed',
      value: completedOrders.length.toString(),
      icon: CheckCircle,
      color: colors.primary,
      bgColor: '#E6F7F1',
    },
    {
      title: 'Total Deliveries',
      value: myOrders.length.toString(),
      icon: Clock,
      color: '#4ECDC4',
      bgColor: '#E6F9F7',
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{currentUser?.name}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Delivery Dashboard</Text>

        {loading && (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 20 }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        <View style={styles.statsGrid}>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <View key={index} style={styles.statCard}>
                <View style={[styles.iconContainer, { backgroundColor: stat.bgColor }]}>
                  <Icon size={28} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
              </View>
            );
          })}
        </View>

        {activeOrders.length > 0 && (
          <View style={styles.activeSection}>
            <Text style={styles.sectionTitle}>Active Deliveries ({activeOrders.length})</Text>
            <Text style={styles.sectionSubtitle}>
              These deliveries are currently on the way
            </Text>

            {activeOrders.map((order) => (
              <View key={order.id} style={styles.activeCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Truck size={18} color={colors.primary} />
                    <Text style={styles.activeOrderId}>#{String(order.id).slice(-6).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.activeAmount}>Rs.{order.totalAmount.toFixed(2)}</Text>
                </View>
                <Text style={styles.activePharmacy}>
                  {typeof (order as any).pharmacyId === 'object' ? (order as any).pharmacyId.name : 'Pharmacy'}
                </Text>
                <View style={styles.activeRow}>
                  <MapPin size={14} color={colors.textSecondary} />
                  <Text style={styles.activeAddress} numberOfLines={2}>
                    {order.deliveryAddress}
                  </Text>
                </View>
                <View style={[styles.activeRow, { marginTop: 6 }]}>
                  <User size={14} color={colors.textSecondary} />
                  <Text style={styles.activeAddress} numberOfLines={1}>
                    {typeof (order as any).customerId === 'object' ? (order as any).customerId.name : 'Customer'}
                  </Text>
                </View>
                <View style={[styles.activeRow, { marginTop: 4 }]}>
                  <Phone size={14} color={colors.textSecondary} />
                  <Text style={styles.activeAddress} numberOfLines={1}>
                    {typeof (order as any).customerId === 'object' ? (order as any).customerId.phone || 'N/A' : 'N/A'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {!loading && activeOrders.length === 0 && (
          <View style={styles.emptyState}>
            <Package size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Active Deliveries</Text>
            <Text style={styles.emptySubtitle}>
              New deliveries will appear here when assigned
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  greeting: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  name: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: -8,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  activeSection: {
    marginBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  // Active list styles
  activeCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  activeOrderId: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.text,
  },
  activeAmount: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  activePharmacy: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: 6,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeAddress: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
});
