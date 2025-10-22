import { colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { Order, OrderStatus, Pharmacy } from '@/types';
import { Clock, DollarSign, MapPin, User, X, Plus, AlertCircle, Utensils, Droplet, Timer } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Instruction {
  text: string;
  icon: string;
  priority: 'low' | 'medium' | 'high';
}

export default function PharmacyOrders() {
  const { currentUser, apiRequest } = useAuth();
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<Order[]>([]);
  const [instructionsModalVisible, setInstructionsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [newInstructionText, setNewInstructionText] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('info');
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high'>('medium');

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

  const handleOpenInstructionsModal = (order: Order) => {
    setSelectedOrder(order);
    setInstructions((order as any).instructions || []);
    setInstructionsModalVisible(true);
  };

  const handleAddInstruction = () => {
    if (!newInstructionText.trim()) {
      Alert.alert('Error', 'Please enter instruction text');
      return;
    }

    const newInstruction: Instruction = {
      text: newInstructionText.trim(),
      icon: selectedIcon,
      priority: selectedPriority,
    };

    setInstructions([...instructions, newInstruction]);
    setNewInstructionText('');
    setSelectedIcon('info');
    setSelectedPriority('medium');
  };

  const handleRemoveInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const handleSaveInstructions = async () => {
    if (!selectedOrder) return;

    try {
      const updated = await apiRequest('POST', `/orders/instructions/${selectedOrder.id}`, {
        instructions,
      });
      
      console.log("order",selectedOrder);
      setOrders(prev => prev.map(o => (o.id === selectedOrder.id ? updated : o)));
      Alert.alert('Success', 'Instructions saved successfully');
      setInstructionsModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save instructions');
    }
  };

  const handleMarkAsReady = async (orderId: string) => {
    try {
      const updated = await apiRequest('PUT', `/orders/${orderId}/status`, { status: 'packing' });
      setOrders(prev => prev.map(o => (o.id === orderId ? updated : o)));
      Alert.alert('Success', 'Order marked as ready');
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

  const iconOptions = [
    { value: 'info', label: 'Info', Icon: AlertCircle },
    { value: 'food', label: 'Food', Icon: Utensils },
    { value: 'water', label: 'Water', Icon: Droplet },
    { value: 'time', label: 'Time', Icon: Timer },
  ];

  const getIconComponent = (iconName: string) => {
    const option = iconOptions.find(opt => opt.value === iconName);
    return option ? option.Icon : AlertCircle;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return colors.textSecondary;
    }
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
            const orderInstructions = (order as any).instructions || [];

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
                </View>

                <View style={styles.itemsList}>
                  <Text style={styles.itemsTitle}>Items:</Text>
                  {order.items.map((item, index) => (
                    <Text key={index} style={styles.itemText}>
                      • {item.name} x{item.quantity} - Rs.{(item.price * item.quantity).toFixed(2)}
                    </Text>
                  ))}
                </View>

                {orderInstructions.length > 0 && (
                  <View style={styles.instructionsPreview}>
                    <Text style={styles.instructionsPreviewTitle}>
                      📋 {orderInstructions.length} Instruction(s) Added
                    </Text>
                  </View>
                )}

                {order.status === 'packing' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.instructionsButton}
                      onPress={() => handleOpenInstructionsModal(order)}
                    >
                      <Plus size={16} color={colors.primary} />
                      <Text style={styles.instructionsButtonText}>
                        {orderInstructions.length > 0 ? 'Edit Instructions' : 'Add Instructions'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleMarkAsReady(order.id)}
                    >
                      <Text style={styles.actionButtonText}>Mark as Ready</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Instructions Modal */}
      <Modal
        visible={instructionsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setInstructionsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Instructions</Text>
              <TouchableOpacity onPress={() => setInstructionsModalVisible(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Existing Instructions */}
              {instructions.map((instruction, index) => {
                const IconComponent = getIconComponent(instruction.icon);
                return (
                  <View key={index} style={styles.instructionItem}>
                    <View style={styles.instructionContent}>
                      <IconComponent size={20} color={getPriorityColor(instruction.priority)} />
                      <View style={styles.instructionTextContainer}>
                        <Text style={styles.instructionText}>{instruction.text}</Text>
                        <Text style={styles.instructionMeta}>
                          Priority: {instruction.priority.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveInstruction(index)}>
                      <X size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                );
              })}

              {/* Add New Instruction */}
              <View style={styles.addInstructionSection}>
                <Text style={styles.sectionLabel}>Add New Instruction</Text>
                
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Take with food"
                  value={newInstructionText}
                  onChangeText={setNewInstructionText}
                  multiline
                />

                <Text style={styles.sectionLabel}>Icon</Text>
                <View style={styles.iconSelector}>
                  {iconOptions.map(({ value, label, Icon }) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.iconOption,
                        selectedIcon === value && styles.iconOptionSelected,
                      ]}
                      onPress={() => setSelectedIcon(value)}
                    >
                      <Icon size={24} color={selectedIcon === value ? colors.primary : colors.textSecondary} />
                      <Text style={[
                        styles.iconLabel,
                        selectedIcon === value && styles.iconLabelSelected,
                      ]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionLabel}>Priority</Text>
                <View style={styles.prioritySelector}>
                  {['low', 'medium', 'high'].map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.priorityOption,
                        selectedPriority === priority && styles.priorityOptionSelected,
                        { borderColor: getPriorityColor(priority) },
                      ]}
                      onPress={() => setSelectedPriority(priority as 'low' | 'medium' | 'high')}
                    >
                      <Text style={[
                        styles.priorityLabel,
                        selectedPriority === priority && { color: getPriorityColor(priority) },
                      ]}>
                        {priority.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.addButton} onPress={handleAddInstruction}>
                  <Plus size={20} color={colors.white} />
                  <Text style={styles.addButtonText}>Add Instruction</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setInstructionsModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveInstructions}>
                <Text style={styles.saveButtonText}>Save Instructions</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  instructionsPreview: {
    backgroundColor: '#E6F7F1',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  instructionsPreviewTitle: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600' as const,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  instructionsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  instructionsButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  actionButton: {
    flex: 1,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  modalBody: {
    padding: 20,
    maxHeight: 500,
  },
  instructionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  instructionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  instructionTextContainer: {
    flex: 1,
  },
  instructionText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  instructionMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  addInstructionSection: {
    marginTop: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  iconSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  iconOption: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: '#E6F7F1',
  },
  iconLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  iconLabelSelected: {
    color: colors.primary,
    fontWeight: '600' as const,
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  priorityOption: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 2,
  },
  priorityOptionSelected: {
    backgroundColor: colors.white,
  },
  priorityLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600' as const,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 12,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.white,
  },
});