import { colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { LogOut, ShoppingBag, Store, UserCog, Users, Tag } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const { currentUser, apiRequest, getPendingRoleRequests, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPharmacies, setTotalPharmacies] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [usersRes, pharmaciesRes, ordersRes, pendingReqs] = await Promise.all([
          apiRequest('GET', '/users'),
          apiRequest('GET', '/pharmacies'),
          apiRequest('GET', '/orders'),
          getPendingRoleRequests(),
        ]);

        const usersCount = Array.isArray(usersRes) ? usersRes.length : 0;
        const pharmaciesCount = Array.isArray(pharmaciesRes) ? pharmaciesRes.length : 0;
        const ordersArr: Array<{ status?: string }> = Array.isArray(ordersRes) ? ordersRes : [];
        const ordersCount = ordersArr.length;
        const activeCount = ordersArr.filter(o => o.status !== 'delivered').length;
        const pendingCount = Array.isArray(pendingReqs) ? pendingReqs.length : 0;

        setTotalUsers(usersCount);
        setTotalPharmacies(pharmaciesCount);
        setTotalOrders(ordersCount);
        setActiveOrders(activeCount);
        setPendingRequestsCount(pendingCount);
      } catch (err) {
        console.warn('Failed to load admin dashboard stats:', err);
      }
    };

    loadStats();
  }, [apiRequest, getPendingRoleRequests]);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const stats = [
    {
      title: 'Total Users',
      value: totalUsers.toString(),
      icon: Users,
      color: colors.primary,
      bgColor: '#E6F7F1',
    },
    {
      title: 'Total Pharmacies',
      value: totalPharmacies.toString(),
      icon: Store,
      color: '#FF6B6B',
      bgColor: '#FFE6E6',
    },
    {
      title: 'Total Orders',
      value: totalOrders.toString(),
      icon: ShoppingBag,
      color: '#4ECDC4',
      bgColor: '#E6F9F7',
    },
    {
      title: 'Pending Requests',
      value: pendingRequestsCount.toString(),
      icon: UserCog,
      color: '#FFB84D',
      bgColor: '#FFF4E6',
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{currentUser?.name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <LogOut size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Admin Dashboard</Text>

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

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(admin)/user-requests')}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#FFF4E6' }]}>
                <UserCog size={24} color="#FFB84D" />
              </View>
              <View>
                <Text style={styles.actionTitle}>Review Role Requests</Text>
                <Text style={styles.actionSubtitle}>
                  {pendingRequestsCount} pending requests
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(admin)/orders-management')}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#E6F9F7' }]}>
                <ShoppingBag size={24} color="#4ECDC4" />
              </View>
              <View>
                <Text style={styles.actionTitle}>Manage Orders</Text>
                <Text style={styles.actionSubtitle}>
                  {activeOrders} active orders
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(admin)/pharmacies')}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#FFE6E6' }]}>
                <Store size={24} color="#FF6B6B" />
              </View>
              <View>
                <Text style={styles.actionTitle}>View Pharmacies</Text>
                <Text style={styles.actionSubtitle}>
                  {totalPharmacies} registered pharmacies
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(admin)/coupons')}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#E6F7F1' }]}>
                <Tag size={24} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.actionTitle}>Offer Codes</Text>
                <Text style={styles.actionSubtitle}>
                  Create and manage coupons
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  logoutButton: {
    padding: 8,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
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
  quickActions: {
    marginTop: 8,
  },
  actionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
