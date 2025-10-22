import { colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, Clock, MapPin, Package, Truck, DollarSign, Phone, User, Navigation, AlertCircle, Utensils, Droplet, Timer, ChevronUp, ChevronDown } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Switch, Linking, Platform, Alert, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useEffect, useState, useRef } from 'react';
import { Order } from '@/types';

interface Instruction {
  text: string;
  icon: string;
  priority: 'low' | 'medium' | 'high';
  createdAt?: string;
}

export default function DeliveryDashboard() {
  const { currentUser, apiRequest } = useAuth();
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState<{ [key: string]: number }>({});
  const [autoPlayActive, setAutoPlayActive] = useState<{ [key: string]: boolean }>({});

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

  const fetchRiderStatus = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await apiRequest('GET', '/rider/status');
      setIsOnline(data.isOnline || false);
    } catch (e) {
      console.error('Failed to fetch rider status', e);
      setIsOnline(false);
    }
  }, [apiRequest, currentUser]);

  useEffect(() => {
    fetchDeliveries();
    fetchRiderStatus();
  }, [fetchDeliveries, fetchRiderStatus]);

  // Auto-play instructions
  useEffect(() => {
    const intervals: Record<string, ReturnType<typeof setInterval>> = {};

    orders.forEach(order => {
      const instructions = (order as any).instructions || [];
      if (autoPlayActive[order.id] && instructions.length > 0) {
        intervals[order.id] = setInterval(() => {
          setCurrentInstructionIndex(prev => {
            const currentIdx = prev[order.id] || 0;
            if (currentIdx < instructions.length - 1) {
              return { ...prev, [order.id]: currentIdx + 1 };
            } else {
              setAutoPlayActive(prevAuto => ({ ...prevAuto, [order.id]: false }));
              return prev;
            }
          });
        }, 3000);
      }
    });

    return () => {
      Object.values(intervals).forEach(interval => clearInterval(interval));
    };
  }, [autoPlayActive, orders]);

  const toggleOnlineStatus = async () => {
    setUpdatingStatus(true);
    try {
      const newStatus = !isOnline;
      await apiRequest('PUT', '/rider/status', { isOnline: newStatus });
      setIsOnline(newStatus);
    } catch (e) {
      setIsOnline(!isOnline);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCallCustomer = (order: Order) => {
    const phoneNumber = typeof (order as any).customerId === 'object' 
      ? (order as any).customerId.phone 
      : null;

    if (!phoneNumber) {
      Alert.alert('No Phone Number', 'Customer phone number is not available');
      return;
    }

    const phoneUrl = Platform.OS === 'ios' 
      ? `telprompt:${phoneNumber}` 
      : `tel:${phoneNumber}`;

    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Error', 'Cannot make phone calls on this device');
        }
      })
      .catch((err) => {
        console.error('Error opening phone dialer:', err);
        Alert.alert('Error', 'Failed to open phone dialer');
      });
  };

  const handleNavigate = (order: Order) => {
    const address = order.deliveryAddress;
    
    if (!address) {
      Alert.alert('No Address', 'Delivery address is not available');
      return;
    }

    const encodedAddress = encodeURIComponent(address);
    const googleMapsUrl = Platform.OS === 'ios'
      ? `comgooglemaps://?daddr=${encodedAddress}&directionsmode=driving`
      : `google.navigation:q=${encodedAddress}&mode=d`;
    const webGoogleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=driving`;

    Linking.canOpenURL(googleMapsUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(googleMapsUrl);
        } else {
          return Linking.openURL(webGoogleMapsUrl);
        }
      })
      .catch(() => {
        Linking.openURL(webGoogleMapsUrl).catch(() => {
          Alert.alert('Error', 'Failed to open navigation');
        });
      });
  };

  const handleToggleInstructions = (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      setAutoPlayActive(prev => ({ ...prev, [orderId]: false }));
    } else {
      setExpandedOrderId(orderId);
      setCurrentInstructionIndex(prev => ({ ...prev, [orderId]: 0 }));
      setAutoPlayActive(prev => ({ ...prev, [orderId]: true }));
    }
  };

  const handleReplayInstructions = (orderId: string) => {
    setCurrentInstructionIndex(prev => ({ ...prev, [orderId]: 0 }));
    setAutoPlayActive(prev => ({ ...prev, [orderId]: true }));
  };

  const getInstructionIcon = (iconName: string, color: string) => {
    switch (iconName) {
      case 'food':
        return <Utensils size={20} color={color} />;
      case 'water':
        return <Droplet size={20} color={color} />;
      case 'time':
        return <Timer size={20} color={color} />;
      default:
        return <AlertCircle size={20} color={color} />;
    }
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

  const getPriorityBgColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#FEE2E2';
      case 'medium':
        return '#FEF3C7';
      case 'low':
        return '#D1FAE5';
      default:
        return colors.background;
    }
  };

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
        
        <View style={styles.statusContainer}>
          <View style={styles.statusToggle}>
            <View style={styles.statusTextContainer}>
              <View style={[styles.statusDot, { backgroundColor: isOnline ? colors.primary : '#999' }]} />
              <Text style={[styles.statusText, { color: isOnline ? colors.primary : '#999' }]}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
            <Switch
              value={isOnline}
              onValueChange={toggleOnlineStatus}
              disabled={updatingStatus}
              trackColor={{ false: '#D1D5DB', true: colors.primary }}
              thumbColor={isOnline ? '#fff' : '#f4f3f4'}
              ios_backgroundColor="#D1D5DB"
            />
          </View>
          {updatingStatus && (
            <ActivityIndicator size="small" color={colors.primary} style={styles.statusLoader} />
          )}
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

            {activeOrders.map((order) => {
              const instructions: Instruction[] = (order as any).instructions || [];
              const hasInstructions = instructions.length > 0;
              const isExpanded = expandedOrderId === order.id;
              const currentIdx = currentInstructionIndex[order.id] || 0;

              return (
                <View key={order.id} style={styles.activeCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Truck size={18} color={colors.primary} />
                      <Text style={styles.activeOrderId}>#{String(order.id).slice(-6).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.activeAmount}>${order.totalAmount.toFixed(2)}</Text>
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

                  {/* Instructions Video Button */}
                  {hasInstructions && (
                    <TouchableOpacity
                      style={styles.instructionsButton}
                      onPress={() => handleToggleInstructions(order.id)}
                      activeOpacity={0.8}
                    >
                      <Utensils size={18} color={colors.white} />
                      <Text style={styles.instructionsButtonText}>Watch Instructions Video</Text>
                      {isExpanded ? <ChevronUp size={20} color={colors.white} /> : <ChevronDown size={20} color={colors.white} />}
                    </TouchableOpacity>
                  )}

                  {/* Animated Instructions Video Player */}
                  {isExpanded && hasInstructions && (
                    <View style={styles.videoContainer}>
                      <View style={styles.playingBadge}>
                        <View style={styles.playingDot} />
                        <Text style={styles.playingText}>PLAYING</Text>
                      </View>

                      <View style={styles.videoHeader}>
                        <View style={styles.videoIconContainer}>
                          <Utensils size={32} color={colors.white} />
                        </View>
                        <Text style={styles.videoTitle}>Medication Guidelines</Text>
                        <Text style={styles.videoStep}>Step {currentIdx + 1}</Text>
                      </View>

                      <View style={styles.videoContent}>
                        {instructions.map((instruction, idx) => {
                          if (idx === currentIdx) {
                            return (
                              <View
                                key={idx}
                                style={[
                                  styles.instructionCard,
                                  { backgroundColor: getPriorityBgColor(instruction.priority) }
                                ]}
                              >
                                <View style={styles.instructionCardContent}>
                                  {getInstructionIcon(instruction.icon, getPriorityColor(instruction.priority))}
                                  <View style={styles.instructionTextContainer}>
                                    <Text style={styles.instructionText}>{instruction.text}</Text>
                                    <View style={styles.priorityBadge}>
                                      <Text style={[styles.priorityText, { color: getPriorityColor(instruction.priority) }]}>
                                        {instruction.priority.toUpperCase()} PRIORITY
                                      </Text>
                                    </View>
                                  </View>
                                </View>
                              </View>
                            );
                          }
                          return null;
                        })}
                      </View>

                      <View style={styles.progressDots}>
                        {instructions.map((_, idx) => (
                          <View
                            key={idx}
                            style={[
                              styles.dot,
                              idx <= currentIdx && styles.dotActive
                            ]}
                          />
                        ))}
                      </View>

                      <Text style={styles.instructionCounter}>
                        {currentIdx < instructions.length - 1
                          ? `${instructions.length - currentIdx - 1} more instruction(s)`
                          : 'All instructions shown'}
                      </Text>

                      {currentIdx === instructions.length - 1 && (
                        <TouchableOpacity
                          style={styles.replayButton}
                          onPress={() => handleReplayInstructions(order.id)}
                        >
                          <Text style={styles.replayButtonText}>Replay Instructions</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleCallCustomer(order)}
                      activeOpacity={0.7}
                    >
                      <Phone size={16} color={colors.white} />
                      <Text style={styles.actionButtonText}>Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.actionButton, styles.navigateButton]}
                      onPress={() => handleNavigate(order)}
                      activeOpacity={0.7}
                    >
                      <Navigation size={16} color={colors.white} />
                      <Text style={styles.actionButtonText}>Navigate</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {!loading && activeOrders.length === 0 && (
          <View style={styles.emptyState}>
            <Package size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Active Deliveries</Text>
            <Text style={styles.emptySubtitle}>
              {isOnline 
                ? 'New deliveries will appear here when assigned'
                : 'Go online to receive delivery assignments'}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  statusLoader: {
    marginTop: 4,
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
  instructionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EC4899',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  instructionsButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  videoContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    position: 'relative',
  },
  playingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  playingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  playingText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700' as const,
  },
  videoHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  videoIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EC4899',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  videoTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.white,
    marginBottom: 4,
  },
  videoStep: {
    fontSize: 13,
    color: '#EC4899',
  },
  videoContent: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
  },
  instructionCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
  },
  instructionCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  instructionTextContainer: {
    flex: 1,
  },
  instructionText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
    marginBottom: 8,
    fontWeight: '500' as const,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4B5563',
  },
  dotActive: {
    width: 32,
    backgroundColor: '#EC4899',
  },
  instructionCounter: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 12,
  },
  replayButton: {
    backgroundColor: '#EC4899',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  replayButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#4A90E2',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  navigateButton: {
    backgroundColor: colors.primary,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600' as const,
  },
});