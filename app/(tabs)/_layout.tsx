// import { Tabs } from 'expo-router';
// import React from 'react';
// import { Home, ShoppingCart, Package, User, Users, Truck } from 'lucide-react-native';
// import { useAuth } from '@/contexts/AuthContext';
// import { Colors } from '@/constants/colors';

// export default function TabLayout() {
//   const { currentUser } = useAuth();

//   if (!currentUser) return null;

//   const renderTabsByRole = () => {
//     switch (currentUser.role) {
//       case 'customer':
//         return (
//           <>
//             <Tabs.Screen
//               name="index"
//               options={{
//                 title: 'Home',
//                 tabBarIcon: ({ color }) => <Home size={24} color={color} />,
//               }}
//             />
//             <Tabs.Screen
//               name="orders"
//               options={{
//                 title: 'My Orders',
//                 tabBarIcon: ({ color }) => <Package size={24} color={color} />,
//               }}
//             />
//             <Tabs.Screen
//               name="cart"
//               options={{
//                 title: 'Cart',
//                 tabBarIcon: ({ color }) => <ShoppingCart size={24} color={color} />,
//               }}
//             />
//             <Tabs.Screen
//               name="profile"
//               options={{
//                 title: 'Profile',
//                 tabBarIcon: ({ color }) => <User size={24} color={color} />,
//               }}
//             />
//           </>
//         );

//       case 'pharmacy_owner':
//         return (
//           <>
//             <Tabs.Screen
//               name="index"
//               options={{
//                 title: 'Dashboard',
//                 tabBarIcon: ({ color }) => <Home size={24} color={color} />,
//               }}
//             />
//             <Tabs.Screen
//               name="medicines"
//               options={{
//                 title: 'Medicines',
//                 tabBarIcon: ({ color }) => <Package size={24} color={color} />,
//               }}
//             />
//             <Tabs.Screen
//               name="orders"
//               options={{
//                 title: 'Orders',
//                 tabBarIcon: ({ color }) => <ShoppingCart size={24} color={color} />,
//               }}
//             />
//             <Tabs.Screen
//               name="profile"
//               options={{
//                 title: 'Profile',
//                 tabBarIcon: ({ color }) => <User size={24} color={color} />,
//               }}
//             />
//           </>
//         );

//       case 'delivery_person':
//         return (
//           <>
//             <Tabs.Screen
//               name="index"
//               options={{
//                 title: 'Deliveries',
//                 tabBarIcon: ({ color }) => <Truck size={24} color={color} />,
//               }}
//             />
//             <Tabs.Screen
//               name="profile"
//               options={{
//                 title: 'Profile',
//                 tabBarIcon: ({ color }) => <User size={24} color={color} />,
//               }}
//             />
//           </>
//         );

//       case 'admin':
//         return (
//           <>
//             <Tabs.Screen
//               name="index"
//               options={{
//                 title: 'Dashboard',
//                 tabBarIcon: ({ color }) => <Home size={24} color={color} />,
//               }}
//             />
//             <Tabs.Screen
//               name="requests"
//               options={{
//                 title: 'Requests',
//                 tabBarIcon: ({ color }) => <Users size={24} color={color} />,
//               }}
//             />
//             <Tabs.Screen
//               name="orders"
//               options={{
//                 title: 'Orders',
//                 tabBarIcon: ({ color }) => <Package size={24} color={color} />,
//               }}
//             />
//             <Tabs.Screen
//               name="profile"
//               options={{
//                 title: 'Profile',
//                 tabBarIcon: ({ color }) => <User size={24} color={color} />,
//               }}
//             />
//           </>
//         );

//       default:
//         return null;
//     }
//   };

//   return (
//     <Tabs
//       screenOptions={{
//         tabBarActiveTintColor: Colors.primary,
//         tabBarInactiveTintColor: Colors.gray,
//         headerShown: true,
//         headerStyle: {
//           backgroundColor: Colors.primary,
//         },
//         headerTintColor: Colors.white,
//         headerTitleStyle: {
//           fontWeight: '600' as const,
//         },
//         tabBarStyle: {
//           borderTopWidth: 1,
//           borderTopColor: Colors.border,
//         },
//         tabBarLabelStyle: {
//           fontSize: 12,
//           fontWeight: '500' as const,
//         },
//       }}
//     >
//       {renderTabsByRole()}
//       <Tabs.Screen
//         name="cart"
//         options={{
//           href: currentUser.role === 'customer' ? undefined : null,
//         }}
//       />
//       <Tabs.Screen
//         name="medicines"
//         options={{
//           href: currentUser.role === 'pharmacy_owner' ? undefined : null,
//         }}
//       />
//       <Tabs.Screen
//         name="requests"
//         options={{
//           href: currentUser.role === 'admin' ? undefined : null,
//         }}
//       />
//     </Tabs>
//   );
// }
import { Tabs } from 'expo-router';
import React from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';
import { Home, ShoppingCart, Package, User, Users, Truck } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import { useCart } from '@/contexts/CartContext';

type IconProps = { color: string; size?: number };

const ICONS = {
  home: (p: IconProps) => <Home size={24} color={p.color} />,
  orders: (p: IconProps) => <Package size={24} color={p.color} />,
  cart: (p: IconProps) => <ShoppingCart size={24} color={p.color} />,
  profile: (p: IconProps) => <User size={24} color={p.color} />,
  requests: (p: IconProps) => <Users size={24} color={p.color} />,
  deliveries: (p: IconProps) => <Truck size={24} color={p.color} />,
};

export default function TabLayout() {
  const { currentUser } = useAuth();
  if (!currentUser) return null;

  // tabs per role (what you already had)
  const roleTabs: Record<
    string,
    Array<{ name: string; title: string; iconKey: keyof typeof ICONS }>
  > = {
    customer: [
      { name: 'index', title: 'Home', iconKey: 'home' },
      { name: 'orders', title: 'My Orders', iconKey: 'orders' },
      { name: 'cart', title: 'Cart', iconKey: 'cart' },
      { name: 'profile', title: 'Profile', iconKey: 'profile' },
    ],
    pharmacy_owner: [
      { name: 'index', title: 'Dashboard', iconKey: 'home' },
      { name: 'medicines', title: 'Medicines', iconKey: 'orders' },
      { name: 'orders', title: 'Orders', iconKey: 'cart' },
      { name: 'profile', title: 'Profile', iconKey: 'profile' },
    ],
    delivery_person: [
      { name: 'index', title: 'Deliveries', iconKey: 'deliveries' },
      { name: 'profile', title: 'Profile', iconKey: 'profile' },
    ],
    admin: [
      { name: 'index', title: 'Dashboard', iconKey: 'home' },
      { name: 'requests', title: 'Requests', iconKey: 'requests' },
      { name: 'orders', title: 'Orders', iconKey: 'orders' },
      { name: 'profile', title: 'Profile', iconKey: 'profile' },
    ],
  };

  const tabs = roleTabs[currentUser.role] ?? [];

  return (
    <Tabs
      tabBar={(props) => <FancyTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '600' as const },
      }}
    >
      {/* visible role tabs */}
      {tabs.map(({ name, title, iconKey }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color }) => ICONS[iconKey]({ color }),
          }}
        />
      ))}

      {/* Hidden/extra screens are not declared here to avoid duplicates.
          FancyTabBar hides any routes without an icon, so auto-registered
          screens that aren't part of the current role's tab map won't render. */}
    </Tabs>
  );
}

/** custom tab bar */
function FancyTabBar({ state, descriptors, navigation }: any) {
  const { cartItems } = useCart();
  const cartCount = cartItems.reduce((sum, ci) => sum + (ci.quantity || 0), 0);
  return (
    <View
      style={{
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: Platform.OS === 'ios' ? 20 : 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eaeaea',
      }}
    >
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];

        // ⛔ skip any route explicitly hidden with href:null
        if (options?.href === null) return null;

        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const color = isFocused ? Colors.primary : Colors.gray;
        const icon =
          typeof options.tabBarIcon === 'function'
            ? options.tabBarIcon({ focused: isFocused, color })
            : null;

        // If a route has no icon (e.g., a hidden/stack-only screen), skip it from the tab bar.
        if (!icon) return null;

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            onPress={onPress}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: 56 }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.8}
          >
            <View
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: isFocused ? `${Colors.primary}15` : 'transparent',
              }}
            >
              <View style={{ alignItems: 'center', gap: 4 }}>
                <View style={{ transform: [{ translateY: 1 }], position: 'relative' }}>
                  {icon}
                  {route.name === 'cart' && cartCount > 0 && (
                    <View
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -10,
                        minWidth: 18,
                        height: 18,
                        borderRadius: 9,
                        backgroundColor: Colors.error,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 4,
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{cartCount}</Text>
                    </View>
                  )}
                </View>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: isFocused ? '600' : '500',
                    color,
                  }}
                  numberOfLines={1}
                >
                  {String(label)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
