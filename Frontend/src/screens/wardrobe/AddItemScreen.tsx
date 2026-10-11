import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { Screen } from '../../components/Screen';

export function AddItemScreen() {
  return (
    <Screen style={styles.screen}>
      <Text>Add Item</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { alignItems: 'center', justifyContent: 'center' },
});
