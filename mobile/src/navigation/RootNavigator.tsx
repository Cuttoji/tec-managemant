import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList, MainTabParamList } from './types';
import { useAuth } from '@/context/AuthContext';
import { LoadingView } from '@/components/ui/Spinner';
import { colors } from '@/theme';

import LoginScreen from '@/screens/LoginScreen';
import DashboardScreen from '@/screens/DashboardScreen';
import AssetsScreen from '@/screens/AssetsScreen';
import AssetDetailScreen from '@/screens/AssetDetailScreen';
import TicketsScreen from '@/screens/TicketsScreen';
import TicketDetailScreen from '@/screens/TicketDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();

type IconName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<keyof MainTabParamList, { active: IconName; inactive: IconName }> = {
  Dashboard: { active: 'grid', inactive: 'grid-outline' },
  Assets: { active: 'hardware-chip', inactive: 'hardware-chip-outline' },
  Tickets: { active: 'construct', inactive: 'construct-outline' },
};

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brandLight,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons
            name={focused ? TAB_ICONS[route.name].active : TAB_ICONS[route.name].inactive}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tabs.Screen name="Dashboard" component={DashboardScreen} />
      <Tabs.Screen name="Assets" component={AssetsScreen} />
      <Tabs.Screen name="Tickets" component={TicketsScreen} />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingView />;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.brand },
          headerTintColor: colors.white,
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="AssetDetail" component={AssetDetailScreen} options={{ title: 'รายละเอียดครุภัณฑ์' }} />
            <Stack.Screen name="TicketDetail" component={TicketDetailScreen} options={{ title: 'รายละเอียดงานซ่อม' }} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
