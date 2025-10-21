import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, FlatList } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import { Search, MapPin, Star } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useCart } from '@/contexts/CartContext';

export default function HomeScreen() {
  const { currentUser, apiRequest } = useAuth();
  const { addToCart, cartItems, updateQuantity } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [phs, meds] = await Promise.all([
          apiRequest('GET', '/pharmacies'),
          apiRequest('GET', '/medicines'),
        ]);
        setPharmacies(Array.isArray(phs) ? phs : []);
        setMedicines(Array.isArray(meds) ? meds : []);
      } catch (e) {
        console.error('Error loading home data:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredMedicines = medicines.filter((medicine: any) =>
    medicine.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (currentUser?.role === 'customer') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {currentUser.name}!</Text>
          <Text style={styles.subtitle}>Find your medicines</Text>
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search medicines..."
            placeholderTextColor={Colors.text.light}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 16 }} color={Colors.primary} />
        ) : (
          <>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pharmacies Near You</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pharmacyList}>
            {pharmacies.map((pharmacy: any) => (
              <TouchableOpacity key={pharmacy.id || pharmacy._id} style={styles.pharmacyCard}>
                <Image source={{ uri: pharmacy.image }} style={styles.pharmacyImage} />
                <View style={styles.pharmacyInfo}>
                  <Text style={styles.pharmacyName}>{pharmacy.name}</Text>
                  <View style={styles.pharmacyMeta}>
                    <MapPin size={14} color={Colors.gray} />
                    <Text style={styles.pharmacyAddress} numberOfLines={1}>
                      {pharmacy.address}
                    </Text>
                  </View>
                  <View style={styles.ratingContainer}>
                    <Star size={14} color={Colors.warning} fill={Colors.warning} />
                    <Text style={styles.rating}>{pharmacy.rating ?? '4.5'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Medicines</Text>
          <FlatList
            data={filteredMedicines}
            keyExtractor={(item: any) => String(item.id || item._id)}
            numColumns={2}
            columnWrapperStyle={styles.medicineRow}
            contentContainerStyle={{ paddingHorizontal: 8 }}
            scrollEnabled={false}
            renderItem={({ item }: { item: any }) => (
              <View style={styles.medicineCard}>
                <Image source={{ uri: item.image }} style={styles.medicineImage} />
                <View style={styles.medicineInfo}>
                  <Text style={styles.medicineName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.medicineCategory}>{item.category}</Text>
                  <Text style={styles.medicinePrice}>${Number(item.price).toFixed(2)}</Text>
                  {(() => {
                    const medId = String(item.id || item._id);
                    const found = cartItems.find((ci) => String((ci.medicine as any).id || (ci.medicine as any)._id) === medId);
                    const qty = found?.quantity || 0;
                    if (qty > 0) {
                      return (
                        <View style={styles.qtyContainer}>
                          <TouchableOpacity
                            style={styles.qtyButton}
                            onPress={() => updateQuantity(medId, qty - 1)}
                          >
                            <Text style={styles.qtyButtonText}>-</Text>
                          </TouchableOpacity>
                          <Text style={styles.qtyCount}>{qty}</Text>
                          <TouchableOpacity
                            style={styles.qtyButton}
                            onPress={() => addToCart(item, 1)}
                          >
                            <Text style={styles.qtyButtonText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    }
                    return (
                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => {
                          addToCart(item, 1);
                        }}
                      >
                        <Text style={styles.addButtonText}>Add to Cart</Text>
                      </TouchableOpacity>
                    );
                  })()}
                </View>
              </View>
            )}
          />
        </View>
          </>
        )}
      </ScrollView>
    );
  }

  if (currentUser?.role === 'pharmacy_owner') {
    const myPharmacies = pharmacies.filter((p: any) =>
      (p.ownerId?._id || p.ownerId) === currentUser.id
    );
    const myMedicines = medicines.filter((m: any) =>
      myPharmacies.some((p: any) => (p.id || p._id) === (m.pharmacyId?.toString?.() || m.pharmacyId))
    );

    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back, {currentUser.name}!</Text>
          <Text style={styles.subtitle}>Manage your pharmacy</Text>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 16 }} color={Colors.primary} />
        ) : (
          <>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{myPharmacies.length}</Text>
            <Text style={styles.statLabel}>Pharmacies</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{myMedicines.length}</Text>
            <Text style={styles.statLabel}>Medicines</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {myMedicines.reduce((sum: number, m: any) => sum + (Number(m.stock) || 0), 0)}
            </Text>
            <Text style={styles.statLabel}>Total Stock</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Pharmacies</Text>
          {myPharmacies.map((pharmacy: any) => (
            <View key={pharmacy.id || pharmacy._id} style={styles.pharmacyListCard}>
              <Image source={{ uri: pharmacy.image }} style={styles.pharmacyListImage} />
              <View style={styles.pharmacyListInfo}>
                <Text style={styles.pharmacyListName}>{pharmacy.name}</Text>
                <Text style={styles.pharmacyListAddress}>{pharmacy.address}</Text>
                <View style={styles.ratingContainer}>
                  <Star size={14} color={Colors.warning} fill={Colors.warning} />
                  <Text style={styles.rating}>{pharmacy.rating ?? '4.5'}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
          </>
        )}
      </ScrollView>
    );
  }

  if (currentUser?.role === 'delivery_person') {
    // Using mock data for now - empty orders list
    const myOrders: any[] = [];

    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {currentUser.name}!</Text>
          <Text style={styles.subtitle}>Your deliveries</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{myOrders.length}</Text>
            <Text style={styles.statLabel}>Total Deliveries</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {myOrders.filter((o) => o.status === 'on_the_way').length}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {myOrders.filter((o) => o.status === 'delivered').length}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Deliveries</Text>
          {myOrders
            .filter((order: any) => order.status === 'on_the_way')
            .map((order: any) => {
              // Mock customer data
              const customer = { name: 'Customer' };
              return (
                <View key={order.id} style={styles.deliveryCard}>
                  <View style={styles.deliveryHeader}>
                    <Text style={styles.deliveryId}>Order #{order.id}</Text>
                    <View style={[styles.statusBadge, styles.statusOnTheWay]}>
                      <Text style={styles.statusText}>On the Way</Text>
                    </View>
                  </View>
                  <Text style={styles.deliveryCustomer}>Customer: {customer?.name}</Text>
                  <Text style={styles.deliveryAddress}>{order.deliveryAddress}</Text>
                  <Text style={styles.deliveryAmount}>${order.totalAmount.toFixed(2)}</Text>
                </View>
              );
            })}
          {myOrders.filter((o) => o.status === 'on_the_way').length === 0 && (
            <Text style={styles.emptyText}>No active deliveries</Text>
          )}
        </View>
      </ScrollView>
    );
  }

  if (currentUser?.role === 'admin') {
    // Using mock data for now
    const pendingRequests: any[] = [];
    const users: any[] = [];
    const orders: any[] = [];

    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>Manage Pharmacy Plus</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{users.length}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{pendingRequests.length}</Text>
            <Text style={styles.statLabel}>Pending Requests</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{orders.length}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <Text style={styles.activityText}>
              {pharmacies.length} pharmacies registered
            </Text>
          </View>
          <View style={styles.activityCard}>
            <Text style={styles.activityText}>
              {medicines.length} medicines available
            </Text>
          </View>
          <View style={styles.activityCard}>
            <Text style={styles.activityText}>
              {orders.filter((o) => o.status === 'packing').length} orders being packed
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    padding: 20,
    backgroundColor: Colors.primary,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text.primary,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  pharmacyList: {
    paddingLeft: 16,
  },
  pharmacyCard: {
    width: 280,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pharmacyImage: {
    width: '100%',
    height: 140,
    backgroundColor: Colors.lightGray,
  },
  pharmacyInfo: {
    padding: 12,
  },
  pharmacyName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  pharmacyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pharmacyAddress: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginLeft: 4,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text.primary,
    marginLeft: 4,
  },
  medicineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  medicineRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  medicineCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    margin: 8,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medicineImage: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.lightGray,
  },
  medicineInfo: {
    padding: 12,
  },
  medicineName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text.primary,
    marginBottom: 4,
    minHeight: 36,
  },
  medicineCategory: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  medicinePrice: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: 6,
  },
  qtyButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  qtyButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  qtyCount: {
    minWidth: 20,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  pharmacyListCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pharmacyListImage: {
    width: 100,
    height: 100,
    backgroundColor: Colors.lightGray,
  },
  pharmacyListInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  pharmacyListName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  pharmacyListAddress: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  deliveryCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deliveryId: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOnTheWay: {
    backgroundColor: Colors.status.onTheWay,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  deliveryCustomer: {
    fontSize: 14,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  deliveryAddress: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  deliveryAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 24,
  },
  activityCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityText: {
    fontSize: 14,
    color: Colors.text.primary,
  },
});
