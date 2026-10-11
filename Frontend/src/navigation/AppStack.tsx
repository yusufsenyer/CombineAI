import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { AddItemScreen } from '../screens/wardrobe/AddItemScreen';
import { OutfitDetailScreen } from '../screens/outfits/OutfitDetailScreen';
import { PackagesScreen } from '../screens/packages/PackagesScreen';
import { PaymentScreen } from '../screens/packages/PaymentScreen';
import { ReadySelectionScreen } from '../screens/outfit/ReadySelectionScreen';
import { ResultScreen } from '../screens/outfit/ResultScreen';
import { MainTabs } from './MainTabs';
import { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={MainTabs} />
      <Stack.Screen name="ReadySelection" component={ReadySelectionScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
      <Stack.Screen name="AddItem" component={AddItemScreen} />
      <Stack.Screen name="OutfitDetail" component={OutfitDetailScreen} />
      <Stack.Screen name="Packages" component={PackagesScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
    </Stack.Navigator>
  );
}
