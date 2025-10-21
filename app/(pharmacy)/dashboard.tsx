import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator, Modal } from 'react-native';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/constants/colors';
import { Pill, ShoppingBag, Store, Plus, X, Image as ImageIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

export default function PharmacyDashboard() {
  const { currentUser, apiRequest, token } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [imageUri, setImageUri] = useState<string>('');
  const [newPharmacy, setNewPharmacy] = useState({
    name: '',
    address: '',
    phone: '',
  });
  const [totalMedicines, setTotalMedicines] = useState(0);
  const [countingMeds, setCountingMeds] = useState(false);

  useEffect(() => {
    if (currentUser?.id) {
      fetchPharmacies();
    }
  }, [currentUser?.id]);

  const fetchPharmacies = async () => {
    try {
      const ownerId = currentUser?.id;
      const base = ownerId ? `/pharmacies?ownerId=${ownerId}` : '/pharmacies';
      const endpoint = `${base}${base.includes('?') ? '&' : '?'}_=${Date.now()}`; // cache-buster to avoid 304
      const data = await apiRequest('GET', endpoint);
      // If server filtered by ownerId, take as-is; otherwise fallback to client filter
      const myPharmacies = ownerId
        ? data
        : data.filter((p: any) => p.ownerId?._id === ownerId || p.ownerId === ownerId);
      setPharmacies(myPharmacies);
      // Debug
      console.log('Fetched pharmacies count:', Array.isArray(myPharmacies) ? myPharmacies.length : 0);
      // After pharmacies load, compute total medicines
      await fetchTotalMedicines(myPharmacies);
    } catch (error) {
      console.error('Error fetching pharmacies:', error);
    }
  };

  const fetchTotalMedicines = async (list: any[]) => {
    try {
      setCountingMeds(true);
      if (!Array.isArray(list) || list.length === 0) {
        setTotalMedicines(0);
        return;
      }
      const counts = await Promise.all(
        list.map(async (p: any) => {
          const pid = p.id || p._id;
          if (!pid) return 0;
          const endpoint = `/medicines/pharmacy/${pid}?_=${Date.now()}`; // cache-buster
          const meds = await apiRequest('GET', endpoint);
          return Array.isArray(meds) ? meds.length : 0;
        })
      );
      const total = counts.reduce((sum, n) => sum + (Number(n) || 0), 0);
      setTotalMedicines(total);
    } catch (err) {
      console.error('Error counting medicines:', err);
      setTotalMedicines(0);
    } finally {
      setCountingMeds(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleAddPharmacy = async () => {
    if (!newPharmacy.name || !newPharmacy.address || !newPharmacy.phone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!imageUri) {
      Alert.alert('Error', 'Please select an image for the pharmacy');
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('name', newPharmacy.name);
      formData.append('address', newPharmacy.address);
      formData.append('phone', newPharmacy.phone);

      const filename = imageUri.split('/').pop() || 'pharmacy.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      // React Native vs Web handling
      if (Platform.OS === 'web') {
        const blob = await (await fetch(imageUri)).blob();
        formData.append('image', blob, filename);
      } else {
        formData.append('image', {
          uri: imageUri,
          name: filename,
          type,
        } as any);
      }

      console.log('About to POST /pharmacies with headers only Authorization, no Content-Type');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api'}/pharmacies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create pharmacy');
      }

      await fetchPharmacies();
      setNewPharmacy({ name: '', address: '', phone: '' });
      setImageUri('');
      setShowAddModal(false);
      Alert.alert('Success', 'Pharmacy created successfully!');
    } catch (error: any) {
      console.error('Error creating pharmacy:', error);
      Alert.alert('Error', error.message || 'Failed to create pharmacy');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: 'My Pharmacies',
      value: pharmacies.length.toString(),
      icon: Store,
      color: colors.primary,
      bgColor: '#E6F7F1',
    },
    {
      title: 'Total Medicines',
      value: countingMeds ? '…' : totalMedicines.toString(),
      icon: Pill,
      color: '#4ECDC4',
      bgColor: '#E6F9F7',
    },
    {
      title: 'Total Orders',
      value: '0',
      icon: ShoppingBag,
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
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Pharmacy Dashboard</Text>

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
            onPress={() => router.push('/(pharmacy)/medicines')}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#E6F9F7' }]}>
                <Plus size={24} color="#4ECDC4" />
              </View>
              <View>
                <Text style={styles.actionTitle}>Add New Medicine</Text>
                <Text style={styles.actionSubtitle}>
                  Expand your inventory
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(pharmacy)/orders')}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#FFF4E6' }]}>
                <ShoppingBag size={24} color="#FFB84D" />
              </View>
              <View>
                <Text style={styles.actionTitle}>View Orders</Text>
                <Text style={styles.actionSubtitle}>
                  Check pending orders
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {pharmacies.length > 0 && (
          <View style={styles.pharmaciesSection}>
            <Text style={styles.sectionTitle}>My Pharmacies</Text>
            {pharmacies.map((pharmacy: any) => (
              <View key={pharmacy._id || pharmacy.id} style={styles.pharmacyCard}>
                <Image source={{ uri: pharmacy.image }} style={styles.pharmacyImage} />
                <View style={styles.pharmacyInfo}>
                  <Text style={styles.pharmacyName}>{pharmacy.name}</Text>
                  <Text style={styles.pharmacyAddress}>{pharmacy.address}</Text>
                  <Text style={styles.pharmacyPhone}>{pharmacy.phone}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Pharmacy Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Pharmacy</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                ) : (
                  <View style={styles.imagePickerPlaceholder}>
                    <ImageIcon size={40} color={colors.textSecondary} />
                    <Text style={styles.imagePickerText}>Tap to select pharmacy image *</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TextInput
                style={styles.input}
                placeholder="Pharmacy Name *"
                value={newPharmacy.name}
                onChangeText={(text) => setNewPharmacy({ ...newPharmacy, name: text })}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Address *"
                value={newPharmacy.address}
                onChangeText={(text) => setNewPharmacy({ ...newPharmacy, address: text })}
                multiline
                numberOfLines={3}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number *"
                value={newPharmacy.phone}
                onChangeText={(text) => setNewPharmacy({ ...newPharmacy, phone: text })}
                keyboardType="phone-pad"
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddPharmacy}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Add Pharmacy</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
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
  addButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  quickActions: {
    marginTop: 8,
    marginBottom: 24,
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
  pharmaciesSection: {
    marginBottom: 20,
  },
  pharmacyCard: {
    flexDirection: 'row',
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
  pharmacyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E6F7F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pharmacyInfo: {
    flex: 1,
  },
  pharmacyName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  pharmacyAddress: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  pharmacyPhone: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  pharmacyImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: colors.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  modalContent: {
    padding: 20,
  },
  imagePicker: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  imagePickerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: colors.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
