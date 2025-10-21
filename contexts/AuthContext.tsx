import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole, RoleRequest } from '@/types';
// Removed mock data imports: import { mockUsers, mockRoleRequests } from '@/mocks/data';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
const AUTH_STORAGE_KEY = '@pharmacy_plus_auth';
const TOKEN_STORAGE_KEY = '@pharmacy_plus_jwt_token'; // New key for JWT token

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null); // New state for JWT token
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuthData();
  }, []);

  const saveAuthData = useCallback(async (user: User | null, jwtToken: string | null) => {
    try {
      if (user) {
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }
      if (jwtToken) {
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, jwtToken);
      } else {
        await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to save auth data:', error);
    }
  }, []);

  const loadAuthData = async () => {
    try {
      const authData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      const storedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);

      if (authData) {
        setCurrentUser(JSON.parse(authData));
      }
      if (storedToken) {
        setToken(storedToken);
      }
    } catch (error) {
      console.error('Failed to load auth data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to make authenticated API requests
  const apiRequest = useCallback(async (method: string, url: string, data?: any, isFormData = false) => {
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const config: RequestInit = {
      method,
      headers,
      cache: 'no-store',
    };

    if (data) {
      config.body = isFormData ? data : JSON.stringify(data);
    }

    // Add cache-buster for GET requests to avoid 304 Not Modified
    let finalUrl = `${API_BASE_URL}${url}`;
    if (method.toUpperCase() === 'GET') {
      finalUrl += (finalUrl.includes('?') ? '&' : '?') + `_=${Date.now()}`;
    }

    const response = await fetch(finalUrl, config);
    let responseData: any = null;
    const ct = response.headers.get('content-type') || '';
    if (response.status !== 204 && ct.includes('application/json')) {
      try {
        responseData = await response.json();
      } catch (e) {
        // ignore JSON parse errors for empty bodies
      }
    }

    if (!response.ok) {
      throw new Error((responseData && responseData.message) || `Request failed with status ${response.status}`);
    }
    return responseData;
  }, [token]);

  const login = useCallback(async (email: string, password: string): Promise<User | null> => {
    try {
      const data = await apiRequest('POST', '/auth/login', { email, password });
      const user: User = {
        id: data._id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        address: data.address,
      };
      setCurrentUser(user);
      setToken(data.token);
      await saveAuthData(user, data.token);
      return user;
    } catch (error) {
      console.error('Login failed:', error);
      return null;
    }
  }, [saveAuthData, apiRequest]);

  const register = useCallback(async (name: string, email: string, password: string, phone: string): Promise<User | null> => {
    try {
      const data = await apiRequest('POST', '/auth/register', { name, email, password, phone });
      const user: User = {
        id: data._id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        address: data.address,
      };
      setCurrentUser(user);
      setToken(data.token);
      await saveAuthData(user, data.token);
      return user;
    } catch (error) {
      console.error('Registration failed:', error);
      return null;
    }
  }, [saveAuthData, apiRequest]);

  const logout = useCallback(async () => {
    try {
      // Call the logout API endpoint
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Clear local state and storage regardless of API response
      setCurrentUser(null);
      setToken(null);
      await saveAuthData(null, null);
    }
  }, [saveAuthData, token]);

  const updateUserProfile = useCallback(async (updates: Partial<User>) => {
    if (!currentUser) return;
    try {
      const data = await apiRequest('PUT', '/auth/profile', updates);
      const updatedUser: User = {
        id: data._id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        address: data.address,
      };
      setCurrentUser(updatedUser);
      setToken(data.token);
      await saveAuthData(updatedUser, data.token);
    } catch (error) {
      console.error('Update profile failed:', error);
    }
  }, [currentUser, saveAuthData, apiRequest]);

  const requestRoleChange = useCallback(async (requestedRole: 'pharmacy_owner' | 'delivery_person') => {
    if (!currentUser) return;
    try {
      await apiRequest('POST', '/role-requests', { requestedRole });
      // Frontend might need to refetch requests or update local state after successful request
    } catch (error) {
      console.error('Request role change failed:', error);
    }
  }, [currentUser, apiRequest]);

  const approveRoleRequest = useCallback(async (requestId: string) => {
    try {
      await apiRequest('PUT', `/role-requests/${requestId}/approve`);
      // Frontend might need to refetch requests or update local state after approval
    } catch (error) {
      console.error('Approve role request failed:', error);
    }
  }, [apiRequest]);

  const rejectRoleRequest = useCallback(async (requestId: string) => {
    try {
      await apiRequest('PUT', `/role-requests/${requestId}/reject`);
      // Frontend might need to refetch requests or update local state after rejection
    } catch (error) {
      console.error('Reject role request failed:', error);
    }
  }, [apiRequest]);

  const getPendingRoleRequests = useCallback(async (): Promise<RoleRequest[]> => {
    try {
      const data = await apiRequest('GET', '/role-requests/pending');
      return data;
    } catch (error) {
      console.error('Get pending role requests failed:', error);
      return [];
    }
  }, [apiRequest]);

  const getUserById = useCallback(async (userId: string): Promise<User | undefined> => {
    // This function might not be directly used as often with a backend for individual users
    // If needed, a backend endpoint for fetching a user by ID would be required.
    // For now, it will return the current user if the ID matches.
    if (currentUser && currentUser.id === userId) {
      return currentUser;
    }
    // Alternatively, you could implement a backend endpoint like /api/users/:id
    // const data = await apiRequest('GET', `/users/${userId}`);
    // return data;
    return undefined;
  }, [currentUser]);

  const hasRole = useCallback((role: UserRole): boolean => {
    return currentUser?.role === role;
  }, [currentUser]);

  return useMemo(() => ({
    currentUser,
    isLoading,
    token,
    apiRequest,
    login,
    register,
    logout,
    updateUserProfile,
    requestRoleChange,
    approveRoleRequest,
    rejectRoleRequest,
    getPendingRoleRequests,
    getUserById,
    hasRole,
  }), [currentUser, isLoading, token, apiRequest, login, register, logout, updateUserProfile, requestRoleChange, approveRoleRequest, rejectRoleRequest, getPendingRoleRequests, getUserById, hasRole]);
});
