import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { OnboardingQuestionsScreen } from '../screens/onboarding/OnboardingQuestionsScreen';
import { OnboardingSwipeScreen } from '../screens/onboarding/OnboardingSwipeScreen';
import { OnboardingStackParamList } from './types';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingStack() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, gestureEnabled: false }}
      initialRouteName="OnboardingQuestions"
    >
      <Stack.Screen name="OnboardingQuestions" component={OnboardingQuestionsScreen} />
      <Stack.Screen name="OnboardingSwipe" component={OnboardingSwipeScreen} />
    </Stack.Navigator>
  );
}
