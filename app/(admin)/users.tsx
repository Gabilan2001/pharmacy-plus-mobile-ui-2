import { colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Phone, Shield, User } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Users() {
  const { apiRequest } = useAuth();
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    (async () => {
      try {
        const data = await apiRequest('GET', '/users');
        setUsers(data);
      } catch (e) {
        console.error('Failed to load users', e);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [apiRequest]);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return { bg: '#FFE6E6', text: '#FF6B6B' };
      case 'pharmacy_owner':
        return { bg: '#E6F2FF', text: '#3B82F6' };
      case 'delivery_person':
        return { bg: '#FFF4E6', text: '#FFB84D' };
      default:
        return { bg: '#E6F7F1', text: colors.primary };
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'pharmacy_owner':
        return 'Pharmacy Owner';
      case 'delivery_person':
        return 'Delivery Person';
      default:
        return 'Customer';
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Users</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{users.length}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading && (
          <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>Loading users...</Text>
        )}
        {users.map((user) => {
          const roleColors = getRoleBadgeColor(user.role);

          return (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userHeader}>
                <View style={styles.avatar}>
                  <User size={24} color={colors.white} />
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <View style={[styles.roleBadge, { backgroundColor: roleColors.bg }]}>
                    <Shield size={12} color={roleColors.text} />
                    <Text style={[styles.roleText, { color: roleColors.text }]}>
                      {getRoleText(user.role)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.userDetails}>
                <View style={styles.detailRow}>
                  <Mail size={16} color={colors.textSecondary} />
                  <Text style={styles.detailText}>{user.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Phone size={16} color={colors.textSecondary} />
                  <Text style={styles.detailText}>{user.phone}</Text>
                </View>
                {user.address && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailText}>📍 {user.address}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
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
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  userDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
});             