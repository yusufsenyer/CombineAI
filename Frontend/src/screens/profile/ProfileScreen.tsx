import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { Screen } from '../../components/Screen';

export function ProfileScreen() {
  return (
    <Screen style={styles.screen}>
      <Text>Profile</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { alignItems: 'center', justifyContent: 'center' },
});
