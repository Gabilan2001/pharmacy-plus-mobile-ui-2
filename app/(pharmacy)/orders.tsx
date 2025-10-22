import { colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { Order, OrderStatus, Pharmacy } from '@/types';
import { Clock, DollarSign, MapPin, User } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PharmacyOrders() {
  const { currentUser, apiRequest } = useAuth();
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchOrders = useCallback(async () => {
    if (!currentUser) return;
    try {
      const pharmacies: Pharmacy[] = await apiRequest('GET', `/pharmacies?ownerId=${currentUser.id}`);
      const ids = pharmacies.map(p => p.id);
      const lists = await Promise.all(ids.map(id => apiRequest('GET', `/orders/pharmacy/${id}`)));
      setOrders(lists.flat());
    } catch (e) {
      console.error('Failed to load pharmacy orders', e);
      setOrders([]);
    }
  }, [apiRequest, currentUser]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'packing':
        return { bg: '#FFF4E6', text: '#FFB84D' };
      case 'on_the_way':
        return { bg: '#E6F2FF', text: '#3B82F6' };
      case 'delivered':
        return { bg: '#E6F7F1', text: colors.primary };
      default:
        return { bg: colors.background, text: colors.textSecondary };
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'packing':
        return 'Packing';
      case 'on_the_way':
        return 'On the Way';
      case 'delivered':
        return 'Delivered';
      default:
        return status;
    }
  };

  const handleMarkAsPacking = async (orderId: string) => {
    try {
      const updated = await apiRequest('PUT', `/orders/${orderId}/status`, { status: 'packing' });
      setOrders(prev => prev.map(o => (o.id === orderId ? updated : o)));
      Alert.alert('Success', 'Order marked as packing');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update order');
    }
  };

  const getCustomer = (order: any) => {
    const c = (order as any).customerId;
    if (c && typeof c === 'object') return c;
    return undefined;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{orders.length}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Orders Yet</Text>
            <Text style={styles.emptySubtitle}>
              Orders will appear here when customers place them
            </Text>
          </View>
        ) : (
          orders.map((order) => {
            const customer = getCustomer(order);
            const statusColors = getStatusColor(order.status);

            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderId}>Order #{order.id.toUpperCase()}</Text>
                    <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                    <Text style={[styles.statusText, { color: statusColors.text }]}>
                      {getStatusText(order.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderDetails}>
                  <View style={styles.detailRow}>
                    <User size={16} color={colors.textSecondary} />
                    <Text style={styles.detailText}>{customer?.name || 'Unknown'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <MapPin size={16} color={colors.textSecondary} />
                    <Text style={styles.detailText} numberOfLines={1}>
                      {order.deliveryAddress}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <DollarSign size={16} color={colors.textSecondary} />
                    <Text style={styles.detailText}>Rs.{order.totalAmount.toFixed(2)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Clock size={16} color={colors.textSecondary} />
                    <Text style={styles.detailText}>{formatDate(order.createdAt)}</Text>
                  </View>
                </View>

                <View style={styles.itemsList}>
                  <Text style={styles.itemsTitle}>Items:</Text>
                  {order.items.map((item, index) => (
                    <Text key={index} style={styles.itemText}>
                      • {item.name} x{item.quantity} - Rs.{(item.price * item.quantity).toFixed(2)}
                    </Text>
                  ))}
                </View>

                {order.status === 'packing' && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleMarkAsPacking(order.id)}
                  >
                    <Text style={styles.actionButtonText}>Mark as Ready</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  content: {
    flex: 1,
    padding: 20,
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
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
  },
  orderDate: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  orderDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    marginBottom: 12,
  },
  itemsTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 6,
  },
  itemText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600' as const,
  },
});
