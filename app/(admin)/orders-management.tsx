import { colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { Order, OrderStatus, User as UserType } from '@/types';
import { Clock, DollarSign, MapPin, Package, User } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OrdersManagement() {
  const { apiRequest } = useAuth();
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryPeople, setDeliveryPeople] = useState<UserType[]>([]);
  // Modals state
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState<OrderStatus | null>(null);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [allOrders, users] = await Promise.all([
        apiRequest('GET', '/orders'),
        apiRequest('GET', '/users'),
      ]);
      setOrders(allOrders);
      setDeliveryPeople((users as UserType[]).filter(u => u.role === 'delivery_person'));
    } catch (e) {
      console.error('Failed to load admin data', e);
      setOrders([]);
      setDeliveryPeople([]);
    }
  }, [apiRequest]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getPharmacyName = (order: any) => {
    const p = order.pharmacyId;
    if (p && typeof p === 'object') return p.name || 'Unknown';
    return 'Pharmacy';
  };

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

  const handleUpdateStatus = (orderId: string, targetStatus: OrderStatus) => {
    setPendingOrderId(orderId);
    setNextStatus(targetStatus);
    setStatusModalVisible(true);
  };

  const handleAssignDelivery = (order: any) => {
    if (deliveryPeople.length === 0) {
      Alert.alert('Error', 'No delivery persons available');
      return;
    }
    setPendingOrderId(order.id);
    const existing = (order as any).deliveryPersonId;
    const preselect = existing ? (typeof existing === 'object' ? existing.id : existing) : null;
    setSelectedDeliveryId(preselect);
    setAssignModalVisible(true);
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
        <Text style={styles.headerTitle}>Orders Management</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{orders.length}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {orders.map((order) => {
          const customer = (order as any).customerId && typeof (order as any).customerId === 'object' ? (order as any).customerId : undefined;
          const deliveryField = (order as any).deliveryPersonId;
          const deliveryName = deliveryField ? (typeof deliveryField === 'object' ? deliveryField.name : 'Assigned') : null;
          const statusColors = getStatusColor(order.status);

          return (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderId}>Order #{String(order.id).toUpperCase()}</Text>
                  <Text style={styles.pharmacyName}>{getPharmacyName(order)}</Text>
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
                {deliveryName && (
                  <View style={styles.detailRow}>
                    <Package size={16} color={colors.textSecondary} />
                    <Text style={styles.detailText}>Delivery: {deliveryName}</Text>
                  </View>
                )}
              </View>

              <View style={styles.itemsList}>
                <Text style={styles.itemsTitle}>Items:</Text>
                {order.items.map((item, index) => (
                  <Text key={index} style={styles.itemText}>
                    • {item.name} x{item.quantity}
                  </Text>
                ))}
              </View>

              <View style={styles.actions}>
                {/* Separate status buttons */}
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    order.status === 'packing' ? styles.statusButtonActive : styles.statusButtonInactive,
                  ]}
                  disabled={isSubmitting || order.status === 'packing'}
                  onPress={() => handleUpdateStatus(order.id, 'packing')}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      order.status === 'packing' && styles.statusButtonTextActive,
                    ]}
                  >
                    Pending
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    order.status === 'on_the_way' ? styles.statusButtonActive : styles.statusButtonInactive,
                  ]}
                  disabled={isSubmitting || order.status === 'on_the_way'}
                  onPress={() => handleUpdateStatus(order.id, 'on_the_way')}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      order.status === 'on_the_way' && styles.statusButtonTextActive,
                    ]}
                  >
                    On the Way
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    order.status === 'delivered' ? styles.statusButtonActive : styles.statusButtonInactive,
                  ]}
                  disabled={isSubmitting || order.status === 'delivered'}
                  onPress={() => handleUpdateStatus(order.id, 'delivered')}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      order.status === 'delivered' && styles.statusButtonTextActive,
                    ]}
                  >
                    Delivered
                  </Text>
                </TouchableOpacity>
              </View>

              {order.status !== 'delivered' && (
                <View style={[styles.actions, { marginTop: 8 }]}> 
                  <TouchableOpacity
                    style={styles.assignButton}
                    onPress={() => handleAssignDelivery(order)}
                  >
                    <Text style={styles.assignButtonText}>
                      {(() => {
                        const df = (order as any).deliveryPersonId;
                        if (!df) return 'Assign Delivery';
                        if (typeof df === 'object') return `Assigned: ${df.name}`;
                        const sid = String(df);
                        return `Assigned: #${sid.slice(-6)}`;
                      })()}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Update Status Modal */}
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !isSubmitting && setStatusModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => !isSubmitting && setStatusModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={() => { /* keep open */ }}>
            <Text style={styles.modalTitle}>Update Status</Text>
            <Text style={styles.modalMessage}>
              {nextStatus ? `Change order status to "${getStatusText(nextStatus)}"?` : ''}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                disabled={isSubmitting}
                onPress={() => setStatusModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, styles.modalCancelText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirm]}
                disabled={isSubmitting || !pendingOrderId || !nextStatus}
                onPress={async () => {
                  if (!pendingOrderId || !nextStatus) return;
                  try {
                    setIsSubmitting(true);
                    const updated = await apiRequest('PUT', `/orders/${pendingOrderId}/status`, { status: nextStatus });
                    setOrders(prev => prev.map(o => (o.id === pendingOrderId ? updated : o)));
                    setStatusModalVisible(false);
                  } catch (e: any) {
                    Alert.alert('Error', e.message || 'Failed to update order');
                  } finally {
                    setIsSubmitting(false);
                    setPendingOrderId(null);
                    setNextStatus(null);
                  }
                }}
              >
                {isSubmitting ? <ActivityIndicator color={colors.white} /> : (
                  <Text style={styles.modalButtonText}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Assign Delivery Modal */}
      <Modal
        visible={assignModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !isSubmitting && setAssignModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => !isSubmitting && setAssignModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={() => { /* keep open */ }}>
            <Text style={styles.modalTitle}>Assign Delivery</Text>
            <Text style={styles.modalMessage}>Select a delivery person:</Text>
            <View style={styles.deliveryList}>
              {deliveryPeople.map(dp => (
                <TouchableOpacity
                  key={dp.id}
                  style={[styles.deliveryItem, selectedDeliveryId === dp.id && styles.deliveryItemSelected]}
                  disabled={isSubmitting}
                  onPress={() => setSelectedDeliveryId(dp.id)}
                >
                  <Text style={styles.deliveryName}>{dp.name}</Text>
                  <Text style={styles.deliveryRole}>#{dp.id.slice(-6)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                disabled={isSubmitting}
                onPress={() => setAssignModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, styles.modalCancelText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirm]}
                disabled={isSubmitting || !pendingOrderId || !selectedDeliveryId}
                onPress={async () => {
                  if (!pendingOrderId || !selectedDeliveryId) return;
                  try {
                    setIsSubmitting(true);
                    const updated = await apiRequest('PUT', `/orders/${pendingOrderId}/assign-delivery`, { deliveryPersonId: selectedDeliveryId });
                    setOrders(prev => prev.map(o => (o.id === pendingOrderId ? updated : o)));
                    setAssignModalVisible(false);
                  } catch (e: any) {
                    Alert.alert('Error', e.message || 'Failed to assign delivery');
                  } finally {
                    setIsSubmitting(false);
                    setPendingOrderId(null);
                    setSelectedDeliveryId(null);
                  }
                }}
              >
                {isSubmitting ? <ActivityIndicator color={colors.white} /> : (
                  <Text style={styles.modalButtonText}>Assign</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  pharmacyName: {
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
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  statusButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusButtonInactive: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  statusButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text,
  },
  statusButtonTextActive: {
    color: colors.white,
  },
  updateButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  updateButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  assignButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  assignButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  modalCancel: {
    backgroundColor: colors.background,
  },
  modalCancelText: {
    color: colors.text,
  },
  modalConfirm: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  deliveryList: {
    maxHeight: 240,
    marginBottom: 8,
  },
  deliveryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  deliveryItemSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F4F8FF',
  },
  deliveryName: {
    fontSize: 14,
    color: colors.text,
  },
  deliveryRole: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
