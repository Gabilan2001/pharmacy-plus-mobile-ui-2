import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import { UserCheck, UserX, Briefcase, Truck } from 'lucide-react-native';

export default function RequestsScreen() {
  const { apiRequest } = useAuth();
  const [pendingRequests, setPendingRequests] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadRequests = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest('GET', '/role-requests/pending');
      setPendingRequests(data);
    } catch (e) {
      console.error('Failed to load role requests', e);
      setPendingRequests([]);
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  React.useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleApprove = (requestId: string, userName: string, role: string) => {
    Alert.alert(
      'Approve Request',
      `Approve ${userName} as ${role.replace('_', ' ')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await apiRequest('PUT', `/role-requests/${requestId}/approve`);
              Alert.alert('Success', 'Request approved successfully');
              loadRequests();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to approve request');
            }
          },
        },
      ]
    );
  };

  const handleReject = (requestId: string, userName: string) => {
    Alert.alert(
      'Reject Request',
      `Reject ${userName}'s request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiRequest('PUT', `/role-requests/${requestId}/reject`);
              Alert.alert('Success', 'Request rejected');
              loadRequests();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to reject request');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Loading requests...</Text>
      </View>
    );
  }

  if (pendingRequests.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <UserCheck size={64} color={Colors.gray} />
        <Text style={styles.emptyText}>No pending requests</Text>
        <Text style={styles.emptySubtext}>Role requests will appear here</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {pendingRequests.map((request: any) => {
        const user = request.userId && typeof request.userId === 'object' ? request.userId : undefined;

        return (
          <View key={request.id} style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <View style={styles.iconContainer}>
                {request.requestedRole === 'pharmacy_owner' ? (
                  <Briefcase size={24} color={Colors.primary} />
                ) : (
                  <Truck size={24} color={Colors.primary} />
                )}
              </View>
              <View style={styles.requestInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <Text style={styles.requestRole}>
                  Wants to become: {request.requestedRole.replace('_', ' ')}
                </Text>
              </View>
            </View>

            <View style={styles.userDetails}>
              <Text style={styles.detailLabel}>Phone:</Text>
              <Text style={styles.detailValue}>{user.phone}</Text>
            </View>

            <View style={styles.requestActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleReject(request.id, user.name)}
              >
                <UserX size={20} color={Colors.white} />
                <Text style={styles.actionButtonText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleApprove(request.id, user.name, request.requestedRole)}
              >
                <UserCheck size={20} color={Colors.white} />
                <Text style={styles.actionButtonText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  requestCard: {
    backgroundColor: Colors.white,
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  requestRole: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  userDetails: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginRight: 8,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: '500' as const,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  approveButton: {
    backgroundColor: Colors.success,
  },
  rejectButton: {
    backgroundColor: Colors.error,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
