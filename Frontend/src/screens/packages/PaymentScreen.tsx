import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { Screen } from '../../components/Screen';

export function PaymentScreen() {
  return (
    <Screen style={styles.screen}>
      <Text>Payment</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { alignItems: 'center', justifyContent: 'center' },
});
