import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';

import { colors } from '../theme';
import { HomeScreen } from '../screens/home/HomeScreen';
import { OutfitsScreen } from '../screens/outfits/OutfitsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { WardrobeScreen } from '../screens/wardrobe/WardrobeScreen';
import { MainTabsParamList } from './types';

const Tab = createBottomTabNavigator<MainTabsParamList>();

const ICONS: Record<keyof MainTabsParamList, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  Home: ['home-outline', 'home'],
  Wardrobe: ['shirt-outline', 'shirt'],
  Outfits: ['albums-outline', 'albums'],
  Profile: ['person-outline', 'person'],
};

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.hairline,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          letterSpacing: 0.2,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const [outline, filled] = ICONS[route.name];
          return <Ionicons name={focused ? filled : outline} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Ana Sayfa' }} />
      <Tab.Screen name="Wardrobe" component={WardrobeScreen} options={{ title: 'Dolabım' }} />
      <Tab.Screen name="Outfits" component={OutfitsScreen} options={{ title: 'Kombinler' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}
