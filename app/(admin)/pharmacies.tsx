import { colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { Pharmacy, User as IUser } from '@/types';
import { MapPin, Phone, Star, User } from 'lucide-react-native';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';

export default function Pharmacies() {
  const { apiRequest } = useAuth();
  const insets = useSafeAreaInsets();

  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pharmaciesRes, usersRes] = await Promise.all([
          apiRequest('GET', '/pharmacies'),
          apiRequest('GET', '/users'), // admin-only; ensure logged in as admin
        ]);
        setPharmacies(Array.isArray(pharmaciesRes) ? pharmaciesRes : []);
        setUsers(Array.isArray(usersRes) ? usersRes : []);
      } catch (err) {
        console.warn('Failed to load pharmacies/users:', err);
        setPharmacies([]);
        setUsers([]);
      }
    };
    loadData();
  }, [apiRequest]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pharmacies</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{pharmacies.length}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {pharmacies.map((pharmacy) => {
          const owner = users.find(u => u.id === pharmacy.ownerId);

          return (
            <View key={pharmacy.id} style={styles.pharmacyCard}>
              <Image source={{ uri: pharmacy.image }} style={styles.pharmacyImage} />
              
              <View style={styles.pharmacyInfo}>
                <View style={styles.pharmacyHeader}>
                  <Text style={styles.pharmacyName}>{pharmacy.name}</Text>
                  <View style={styles.ratingContainer}>
                    <Star size={16} color="#FFB84D" fill="#FFB84D" />
                    <Text style={styles.rating}>{pharmacy.rating}</Text>
                  </View>
                </View>

                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <MapPin size={16} color={colors.textSecondary} />
                    <Text style={styles.detailText}>{pharmacy.address}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Phone size={16} color={colors.textSecondary} />
                    <Text style={styles.detailText}>{pharmacy.phone}</Text>
                  </View>
                  {owner && (
                    <View style={styles.detailRow}>
                      <User size={16} color={colors.textSecondary} />
                      <Text style={styles.detailText}>Owner: {owner.name}</Text>
                    </View>
                  )}
                </View>
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
  pharmacyCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pharmacyImage: {
    width: '100%',
    height: 160,
    backgroundColor: colors.background,
  },
  pharmacyInfo: {
    padding: 16,
  },
  pharmacyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pharmacyName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF4E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFB84D',
  },
  detailsContainer: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
});
