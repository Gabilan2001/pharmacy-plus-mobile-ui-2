import { colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { Order } from '@/types';
import { CheckCircle, DollarSign, MapPin, Phone, User } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Deliveries() {
  const { currentUser, apiRequest } = useAuth();
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeliveries = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await apiRequest('GET', '/orders/mydeliveries');
      setOrders(data);
    } catch (e) {
      console.error('Failed to load deliveries', e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [apiRequest, currentUser]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const activeOrders = orders.filter(o => o.status === 'on_the_way');
  const completedOrders = orders.filter(o => o.status === 'delivered');

  const getPharmacyName = (order: any) => {
    const p = (order as any).pharmacyId;
    if (p && typeof p === 'object') return p.name || 'Unknown';
    return 'Pharmacy';
  };

  const getCustomer = (order: any) => {
    const c = (order as any).customerId;
    if (c && typeof c === 'object') return c;
    return undefined;
  };

  const markDelivered = async (orderId: string) => {
    try {
      const updated = await apiRequest('PUT', `/orders/${orderId}/status`, { status: 'delivered' });
      setOrders(prev => prev.map(o => (o.id === orderId ? updated : o)));
      Alert.alert('Success', 'Order marked as delivered');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update order');
    }
  };

  const handleMarkAsDelivered = (orderId: string) => {
    Alert.alert('Mark as Delivered', 'Confirm that this order has been delivered?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => markDelivered(orderId) },
    ]);
  };



  const renderOrder = (order: Order) => {
    const customer: any = getCustomer(order);

    return (
      <View key={order.id} style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>Order #{order.id.toUpperCase()}</Text>
            <Text style={styles.pharmacyName}>{getPharmacyName(order)}</Text>
          </View>
          {order.status === 'delivered' && (
            <View style={styles.deliveredBadge}>
              <CheckCircle size={16} color={colors.primary} />
              <Text style={styles.deliveredText}>Delivered</Text>
            </View>
          )}
        </View>

        <View style={styles.customerSection}>
          <Text style={styles.sectionLabel}>Customer Details</Text>
          <View style={styles.detailRow}>
            <User size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>{customer?.name || 'Unknown'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Phone size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>{customer?.phone || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <MapPin size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>{(order as any).deliveryAddress}</Text>
          </View>
          <View style={styles.detailRow}>
            <DollarSign size={16} color={colors.textSecondary} />
            <Text style={styles.detailText}>${order.totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.itemsList}>
          <Text style={styles.sectionLabel}>Order Items</Text>
          {order.items.map((item, index) => (
            <Text key={index} style={styles.itemText}>
              • {item.name} x{item.quantity}
            </Text>
          ))}
        </View>

        {order.status === 'on_the_way' && (
          <TouchableOpacity
            style={styles.deliverButton}
            onPress={() => handleMarkAsDelivered(order.id)}
          >
            <CheckCircle size={20} color={colors.white} />
            <Text style={styles.deliverButtonText}>Mark as Delivered</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Deliveries</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeOrders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Deliveries ({activeOrders.length})</Text>
            {activeOrders.map(renderOrder)}
          </View>
        )}

        {completedOrders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completed ({completedOrders.length})</Text>
            {completedOrders.map(renderOrder)}
          </View>
        )}

        {orders.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Deliveries Assigned</Text>
            <Text style={styles.emptySubtitle}>
              Deliveries will appear here when assigned to you
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 12,
  },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
  },
  pharmacyName: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  deliveredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6F7F1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  deliveredText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  customerSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  itemsList: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  itemText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  deliverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  deliverButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600' as const,
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
});
