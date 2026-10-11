import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../components/Screen';
import { colors, spacing, typography } from '../theme';

export function SplashScreen() {
  return (
    <Screen style={styles.screen}>
      <Text style={styles.brand}>Kombin</Text>
      <ActivityIndicator color={colors.textSecondary} style={styles.spinner} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    ...typography.display,
    fontSize: 36,
  },
  spinner: {
    marginTop: spacing.lg,
  },
});
