import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import { User, LogOut, Briefcase, Truck } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { currentUser, logout, requestRoleChange } = useAuth();
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false); // 👈 Modal state

  if (!currentUser) return null;

  // ✅ Working logout handler
  const handleLogoutConfirm = async () => {
    setShowConfirm(false);
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  // 🧪 Test logout - direct call
  // const handleDirectLogout = async () => {
  //   try {
  //     await logout();
  //     router.replace('/login');
  //   } catch (error) {
  //     console.error('🧪 Direct logout error:', error);
  //   }
  // };

  const handleRoleRequest = (role: 'pharmacy_owner' | 'delivery_person') => {
    const roleName = role === 'pharmacy_owner' ? 'Pharmacy Owner' : 'Delivery Person';
    requestRoleChange(role);
    alert(`✅ Your request to become a ${roleName} has been sent to the admin`);
  };

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <User size={48} color={Colors.white} />
        </View>
        <Text style={styles.name}>{currentUser.name}</Text>
        <Text style={styles.email}>{currentUser.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{currentUser.role.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>

      {/* ACCOUNT INFORMATION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>{currentUser.phone}</Text>
        </View>
        {currentUser.address && (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>{currentUser.address}</Text>
          </View>
        )}
      </View>

      {/* ROLE REQUEST SECTION */}
      {currentUser.role === 'customer' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Request New Role</Text>
          <TouchableOpacity
            style={styles.roleButton}
            onPress={() => handleRoleRequest('pharmacy_owner')}
          >
            <Briefcase size={24} color={Colors.primary} />
            <View style={styles.roleButtonText}>
              <Text style={styles.roleButtonTitle}>Become a Pharmacy Owner</Text>
              <Text style={styles.roleButtonSubtitle}>Manage your own pharmacy</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.roleButton}
            onPress={() => handleRoleRequest('delivery_person')}
          >
            <Truck size={24} color={Colors.primary} />
            <View style={styles.roleButtonText}>
              <Text style={styles.roleButtonTitle}>Become a Delivery Person</Text>
              <Text style={styles.roleButtonSubtitle}>Deliver medicines to customers</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* LOGOUT BUTTONS */}
      <View style={styles.section}>
        {/* 🧪 Test direct logout */}
        {/* <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: Colors.warning || '#FFA500', borderColor: Colors.warning || '#FFA500', marginBottom: 12 }]} 
          onPress={handleDirectLogout}
        >
          <Text style={[styles.logoutText, { color: Colors.white }]}>🧪 TEST DIRECT LOGOUT</Text>
        </TouchableOpacity> */}

        {/* 🧍 Normal Logout with modal */}
        <TouchableOpacity style={styles.logoutButton} onPress={() => setShowConfirm(true)}>
          <LogOut size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* ✅ CONFIRMATION MODAL */}
      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalMessage}>Are you sure you want to logout?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowConfirm(false)} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogoutConfirm} style={styles.modalConfirm}>
                <Text style={styles.modalConfirmText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    backgroundColor: Colors.primary,
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text.primary,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '500' as const,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleButtonText: {
    marginLeft: 16,
    flex: 1,
  },
  roleButtonTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  roleButtonSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.error,
    marginLeft: 8,
  },
  // 🔸 MODAL STYLES
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
    color: Colors.error,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
