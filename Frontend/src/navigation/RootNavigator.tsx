import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';

import { useAuth } from '../auth/AuthContext';
import { AuthScreen } from '../screens/auth/AuthScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { AppStack } from './AppStack';
import { OnboardingStack } from './OnboardingStack';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, status, bootstrap } = useAuth();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (status === 'loading') {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {status === 'signedOut' ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : !user?.onboarding_completed ? (
        <Stack.Screen name="Onboarding" component={OnboardingStack} />
      ) : (
        <Stack.Screen name="Main" component={AppStack} />
      )}
    </Stack.Navigator>
  );
}
