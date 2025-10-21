import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, Medicine, Order } from '@/types';
import { useAuth } from './AuthContext';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

const CART_STORAGE_KEY = '@pharmacy_plus_cart';
const ORDERS_STORAGE_KEY = '@pharmacy_plus_orders';

export const [CartProvider, useCart] = createContextHook(() => {
  const { currentUser, apiRequest } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCartData();
  }, []);

  const saveCartData = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems)),
        AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders)),
      ]);
    } catch (error) {
      console.error('Failed to save cart data:', error);
    }
  }, [cartItems, orders]);

  useEffect(() => {
    if (!isLoading) {
      saveCartData();
    }
  }, [cartItems, orders, isLoading, saveCartData]);

  const loadCartData = async () => {
    try {
      const [cartData, ordersData] = await Promise.all([
        AsyncStorage.getItem(CART_STORAGE_KEY),
        AsyncStorage.getItem(ORDERS_STORAGE_KEY),
      ]);

      if (cartData) {
        setCartItems(JSON.parse(cartData));
      }
      if (ordersData) {
        setOrders(JSON.parse(ordersData));
      }
    } catch (error) {
      console.error('Failed to load cart data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = useCallback((medicine: Medicine, quantity: number = 1) => {
    const getMedId = (m: any) => String(m?.id || m?._id);
    const targetId = getMedId(medicine);
    const existingItem = cartItems.find((item) => getMedId(item.medicine) === targetId);

    if (existingItem) {
      setCartItems(
        cartItems.map((item) =>
          getMedId(item.medicine) === targetId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      const normalized = { ...(medicine as any), id: (medicine as any).id || (medicine as any)._id } as Medicine;
      setCartItems([...cartItems, { medicine: normalized, quantity }]);
    }
  }, [cartItems]);

  const removeFromCart = useCallback((medicineId: string) => {
    const getMedId = (m: any) => String(m?.id || m?._id);
    setCartItems(cartItems.filter((item) => getMedId(item.medicine) !== String(medicineId)));
  }, [cartItems]);

  const updateQuantity = useCallback((medicineId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(medicineId);
      return;
    }

    const getMedId = (m: any) => String(m?.id || m?._id);
    setCartItems(
      cartItems.map((item) =>
        getMedId(item.medicine) === String(medicineId) ? { ...item, quantity } : item
      )
    );
  }, [cartItems, removeFromCart]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setAppliedCoupon(null);
  }, []);

  const getCartTotal = useCallback((): number => {
    return cartItems.reduce((total, item) => total + item.medicine.price * item.quantity, 0);
  }, [cartItems]);

  const applyCoupon = useCallback((code: string): { success: boolean; message: string } => {
    // Synchronous wrapper to keep API consistent; actual call done in async helper below
    return { success: false, message: 'Use applyCouponAsync' };
  }, []);

  const applyCouponAsync = useCallback(async (code: string): Promise<{ success: boolean; message: string }> => {
    try {
      const total = getCartTotal();
      const res = await apiRequest('POST', '/coupons/validate', { code: code.trim().toUpperCase(), orderTotal: total });
      if (res?.valid) {
        setAppliedCoupon({ code: res.code, discountAmount: Number(res.discountAmount) || 0 });
        return { success: true, message: `-$${Number(res.discountAmount).toFixed(2)} discount applied` };
      }
      return { success: false, message: 'Invalid coupon' };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Invalid coupon' };
    }
  }, [apiRequest, getCartTotal]);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, []);

  const getDiscountAmount = useCallback((): number => {
    if (!appliedCoupon) return 0;
    // Flat discount returned by backend validation
    const total = getCartTotal();
    return Math.min(appliedCoupon.discountAmount, total);
  }, [appliedCoupon, getCartTotal]);

  const getFinalTotal = useCallback((): number => {
    return getCartTotal() - getDiscountAmount();
  }, [getCartTotal, getDiscountAmount]);

  const placeOrder = useCallback(async (deliveryAddress: string): Promise<Order | null> => {
    if (!currentUser || cartItems.length === 0) return null;

    const pharmacyId = (cartItems[0].medicine as any).pharmacyId;
    const allSamePharmacy = cartItems.every((item) => (item.medicine as any).pharmacyId === pharmacyId);

    if (!allSamePharmacy) {
      return null;
    }

    try {
      const payload = {
        pharmacyId,
        items: cartItems.map((item) => ({
          medicineId: (item.medicine as any).id || (item.medicine as any)._id,
          quantity: item.quantity,
        })),
        deliveryAddress,
        couponCode: appliedCoupon?.code,
      };
      const created = await apiRequest('POST', '/orders', payload);
      setOrders([created, ...orders]);
      clearCart();
      return created as Order;
    } catch (e) {
      console.error('Place order failed', e);
      return null;
    }
  }, [currentUser, cartItems, orders, appliedCoupon, apiRequest, clearCart]);

  const getOrdersByCustomer = useCallback((customerId: string): Order[] => {
    return orders.filter((order) => order.customerId === customerId);
  }, [orders]);

  const getOrdersByPharmacy = useCallback((pharmacyId: string): Order[] => {
    return orders.filter((order) => order.pharmacyId === pharmacyId);
  }, [orders]);

  const getOrdersByDeliveryPerson = useCallback((deliveryPersonId: string): Order[] => {
    return orders.filter((order) => order.deliveryPersonId === deliveryPersonId);
  }, [orders]);

  const updateOrderStatus = useCallback(async (orderId: string, status: Order['status']) => {
    try {
      const updated = await apiRequest('PUT', `/orders/${orderId}/status`, { status });
      setOrders(orders.map((order) => (order.id === orderId ? updated : order)));
    } catch (e) {
      console.error('Update order status failed', e);
    }
  }, [orders, apiRequest]);

  const assignDeliveryPerson = useCallback(async (orderId: string, deliveryPersonId: string) => {
    try {
      const updated = await apiRequest('PUT', `/orders/${orderId}/assign-delivery`, { deliveryPersonId });
      setOrders(orders.map((order) => (order.id === orderId ? updated : order)));
    } catch (e) {
      console.error('Assign delivery failed', e);
    }
  }, [orders, apiRequest]);

  const getOrderById = useCallback((orderId: string): Order | undefined => {
    return orders.find((order) => order.id === orderId);
  }, [orders]);

  return useMemo(() => ({
    cartItems,
    orders,
    appliedCoupon,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    applyCoupon,
    applyCouponAsync,
    removeCoupon,
    getDiscountAmount,
    getFinalTotal,
    placeOrder,
    getOrdersByCustomer,
    getOrdersByPharmacy,
    getOrdersByDeliveryPerson,
    updateOrderStatus,
    assignDeliveryPerson,
    getOrderById,
  }), [cartItems, orders, appliedCoupon, isLoading, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, applyCoupon, applyCouponAsync, removeCoupon, getDiscountAmount, getFinalTotal, placeOrder, getOrdersByCustomer, getOrdersByPharmacy, getOrdersByDeliveryPerson, updateOrderStatus, assignDeliveryPerson, getOrderById]);
});
