import { colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { RoleRequest, User as IUser } from '@/types';
import { Calendar, CheckCircle, Mail, Phone, User, XCircle } from 'lucide-react-native';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';

export default function UserRequests() {
  const { apiRequest, getPendingRoleRequests, approveRoleRequest, rejectRoleRequest } = useAuth();
  const insets = useSafeAreaInsets();

  const [pendingRequests, setPendingRequests] = useState<RoleRequest[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<{ id: string; userName: string; role: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const requests = await getPendingRoleRequests();
        console.log('📋 Loaded role requests:', requests);
        setPendingRequests(Array.isArray(requests) ? requests : []);
        
        // Extract users from populated userId in requests
        if (Array.isArray(requests)) {
          const usersFromRequests = requests
            .filter(r => r.userId && typeof r.userId === 'object')
            .map(r => r.userId as unknown as IUser);
          console.log('👥 Extracted users from requests:', usersFromRequests);
          setUsers(usersFromRequests);
        }
      } catch (e) {
        console.warn('Failed to load role requests:', e);
        setPendingRequests([]);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [getPendingRoleRequests]);

  const handleApprove = (requestId: string, userName: string, role: string) => {
    setSelectedRequest({ id: requestId, userName, role });
    setShowApproveModal(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedRequest) return;
    setShowApproveModal(false);
    
    try {
      console.log('🔄 Approving request:', selectedRequest.id);
      await approveRoleRequest(selectedRequest.id);
      setPendingRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
      alert('✅ Request approved successfully');
    } catch (e) {
      console.error('❌ Approve error:', e);
      alert('❌ Failed to approve request');
    }
  };

  const handleReject = (requestId: string, userName: string) => {
    setSelectedRequest({ id: requestId, userName, role: '' });
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedRequest) return;
    setShowRejectModal(false);
    
    try {
      console.log('🔄 Rejecting request:', selectedRequest.id);
      await rejectRoleRequest(selectedRequest.id);
      setPendingRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
      alert('✅ Request rejected');
    } catch (e) {
      console.error('❌ Reject error:', e);
      alert('❌ Failed to reject request');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Role Requests</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{pendingRequests.length}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.emptyState}>
            <User size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Loading...</Text>
          </View>
        ) : pendingRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <User size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Pending Requests</Text>
            <Text style={styles.emptySubtitle}>
              All role requests have been processed
            </Text>
          </View>
        ) : (
          pendingRequests.map((request: RoleRequest) => {
            // userId might be populated as an object or just an ID string
            const user = typeof request.userId === 'object' 
              ? request.userId as unknown as IUser
              : users.find(u => u.id === request.userId);
            
            if (!user) {
              console.warn('User not found for request:', request.id);
              return null;
            }

            return (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.userInfo}>
                  <View style={styles.avatar}>
                    <User size={24} color={colors.white} />
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <View style={styles.infoRow}>
                      <Mail size={14} color={colors.textSecondary} />
                      <Text style={styles.infoText}>{user.email}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Phone size={14} color={colors.textSecondary} />
                      <Text style={styles.infoText}>{user.phone}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Calendar size={14} color={colors.textSecondary} />
                      <Text style={styles.infoText}>{formatDate(request.createdAt)}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.roleTag}>
                  <Text style={styles.roleTagText}>
                    Requesting: {request.requestedRole.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleApprove(request.id, user.name, request.requestedRole)}
                  >
                    <CheckCircle size={20} color={colors.white} />
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleReject(request.id, user.name)}
                  >
                    <XCircle size={20} color="#FF6B6B" />
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ✅ APPROVE CONFIRMATION MODAL */}
      <Modal visible={showApproveModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Approve Request</Text>
            <Text style={styles.modalMessage}>
              {selectedRequest && `Approve ${selectedRequest.userName} as ${selectedRequest.role.replace('_', ' ')}?`}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowApproveModal(false)} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleApproveConfirm} style={styles.modalConfirm}>
                <Text style={styles.modalConfirmText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ REJECT CONFIRMATION MODAL */}
      <Modal visible={showRejectModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Reject Request</Text>
            <Text style={styles.modalMessage}>
              {selectedRequest && `Reject ${selectedRequest.userName}'s request?`}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowRejectModal(false)} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRejectConfirm} style={styles.modalConfirm}>
                <Text style={[styles.modalConfirmText, { color: '#FF6B6B' }]}>Reject</Text>
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
  requestCard: {
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
  userInfo: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  roleTag: {
    backgroundColor: '#E6F7F1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  roleTagText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  approveButton: {
    backgroundColor: colors.primary,
  },
  approveButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  rejectButton: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: '#FF6B6B',
  },
  rejectButtonText: {
    color: '#FF6B6B',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 8,
    color: colors.text,
  },
  modalMessage: {
    fontSize: 14,
    color: '#555',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCancel: {
    marginRight: 20,
  },
  modalCancelText: {
    color: '#666',
    fontSize: 16,
  },
  modalConfirm: {},
  modalConfirmText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
