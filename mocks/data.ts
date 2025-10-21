import { Coupon, Medicine, Order, Pharmacy, RoleRequest, User } from '@/types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@pharmacy.com',
    password: 'admin123',
    phone: '+1234567890',
    role: 'admin',
  },
  {
    id: '2',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'customer123',
    phone: '+1234567891',
    role: 'customer',
    address: '123 Main St, New York, NY 10001',
  },
  {
    id: '3',
    name: 'Sarah Pharmacy',
    email: 'sarah@pharmacy.com',
    password: 'pharmacy123',
    phone: '+1234567892',
    role: 'pharmacy_owner',
  },
  {
    id: '4',
    name: 'Mike Delivery',
    email: 'mike@delivery.com',
    password: 'delivery123',
    phone: '+1234567893',
    role: 'delivery_person',
  },
  {
    id: '5',
    name: 'Jane Customer',
    email: 'jane@example.com',
    password: 'customer123',
    phone: '+1234567894',
    role: 'customer',
    address: '456 Oak Ave, Brooklyn, NY 11201',
  },
];

export const mockPharmacies: Pharmacy[] = [
  {
    id: 'p1',
    name: 'HealthCare Pharmacy',
    ownerId: '3',
    address: '789 Health St, Manhattan, NY 10002',
    phone: '+1234567895',
    image: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=400',
    rating: 4.8,
  },
  {
    id: 'p2',
    name: 'MediPlus Store',
    ownerId: '3',
    address: '321 Wellness Blvd, Queens, NY 11354',
    phone: '+1234567896',
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400',
    rating: 4.6,
  },
  {
    id: 'p3',
    name: 'QuickMeds Pharmacy',
    ownerId: '3',
    address: '555 Care Lane, Bronx, NY 10451',
    phone: '+1234567897',
    image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400',
    rating: 4.9,
  },
];

export const mockMedicines: Medicine[] = [
  {
    id: 'm1',
    name: 'Paracetamol 500mg',
    description: 'Pain relief and fever reducer. Take 1-2 tablets every 4-6 hours.',
    price: 5.99,
    stock: 100,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
    pharmacyId: 'p1',
    category: 'Pain Relief',
  },
  {
    id: 'm2',
    name: 'Ibuprofen 400mg',
    description: 'Anti-inflammatory pain reliever. Effective for headaches and muscle pain.',
    price: 8.99,
    stock: 75,
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400',
    pharmacyId: 'p1',
    category: 'Pain Relief',
  },
  {
    id: 'm3',
    name: 'Vitamin C 1000mg',
    description: 'Immune system support. Take one tablet daily with food.',
    price: 12.99,
    stock: 150,
    image: 'https://images.unsplash.com/photo-1550572017-4814c6f5a5e6?w=400',
    pharmacyId: 'p2',
    category: 'Vitamins',
  },
  {
    id: 'm4',
    name: 'Amoxicillin 250mg',
    description: 'Antibiotic for bacterial infections. Prescription required.',
    price: 15.99,
    stock: 50,
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400',
    pharmacyId: 'p2',
    category: 'Antibiotics',
  },
  {
    id: 'm5',
    name: 'Cetirizine 10mg',
    description: 'Antihistamine for allergy relief. Non-drowsy formula.',
    price: 9.99,
    stock: 80,
    image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400',
    pharmacyId: 'p3',
    category: 'Allergy',
  },
  {
    id: 'm6',
    name: 'Omeprazole 20mg',
    description: 'Reduces stomach acid. For heartburn and acid reflux.',
    price: 11.99,
    stock: 60,
    image: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400',
    pharmacyId: 'p3',
    category: 'Digestive',
  },
  {
    id: 'm7',
    name: 'Aspirin 75mg',
    description: 'Blood thinner and pain relief. Consult doctor before use.',
    price: 6.99,
    stock: 120,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
    pharmacyId: 'p1',
    category: 'Cardiovascular',
  },
  {
    id: 'm8',
    name: 'Multivitamin Complex',
    description: 'Complete daily vitamin supplement with minerals.',
    price: 18.99,
    stock: 90,
    image: 'https://images.unsplash.com/photo-1550572017-4814c6f5a5e6?w=400',
    pharmacyId: 'p2',
    category: 'Vitamins',
  },
];

export const mockOrders: Order[] = [
  {
    id: 'o1',
    customerId: '2',
    pharmacyId: 'p1',
    items: [
      { medicineId: 'm1', quantity: 2, price: 5.99, name: 'Paracetamol 500mg' },
      { medicineId: 'm2', quantity: 1, price: 8.99, name: 'Ibuprofen 400mg' },
    ],
    totalAmount: 20.97,
    status: 'packing',
    deliveryAddress: '123 Main St, New York, NY 10001',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'o2',
    customerId: '5',
    pharmacyId: 'p2',
    items: [
      { medicineId: 'm3', quantity: 1, price: 12.99, name: 'Vitamin C 1000mg' },
    ],
    totalAmount: 12.99,
    status: 'on_the_way',
    deliveryAddress: '456 Oak Ave, Brooklyn, NY 11201',
    deliveryPersonId: '4',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'o3',
    customerId: '2',
    pharmacyId: 'p3',
    items: [
      { medicineId: 'm5', quantity: 1, price: 9.99, name: 'Cetirizine 10mg' },
    ],
    totalAmount: 9.99,
    status: 'delivered',
    deliveryAddress: '123 Main St, New York, NY 10001',
    deliveryPersonId: '4',
    couponCode: 'SAVE10',
    discount: 1.0,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

export const mockCoupons: Coupon[] = [
  { code: 'SAVE10', discount: 10, minAmount: 20 },
  { code: 'FIRST15', discount: 15, minAmount: 30 },
  { code: 'HEALTH20', discount: 20, minAmount: 50 },
];

export const mockRoleRequests: RoleRequest[] = [
  {
    id: 'r1',
    userId: '5',
    requestedRole: 'pharmacy_owner',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'r2',
    userId: '2',
    requestedRole: 'delivery_person',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

export const mockDeliveryPersons: User[] = mockUsers.filter(u => u.role === 'delivery_person');
