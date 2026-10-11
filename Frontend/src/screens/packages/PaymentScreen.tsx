import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { packagesApi } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { AppStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';

type Navigation = NativeStackNavigationProp<AppStackParamList>;

export function PaymentScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute();
  const { packageId } = route.params as { packageId: number };
  const { setUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: packages } = useQuery({
    queryKey: ['packages'],
    queryFn: packagesApi.list,
  });

  const selected = packages?.find((p) => p.id === packageId);

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = cardNumber.trim() && expiry.trim() && cvv.trim() && cardName.trim();

  const handlePay = async () => {
    setSubmitting(true);
    try {
      const result = await packagesApi.subscribe(packageId);
      setUser(result.user);
      queryClient.invalidateQueries({ queryKey: ['usage'] });
      queryClient.invalidateQueries({ queryKey: ['wardrobe'] });
      Alert.alert('Ödeme alındı', undefined, [
        { text: 'Tamam', onPress: () => navigation.popToTop() },
      ]);
    } catch {
      Alert.alert('Hata', 'Ödeme tamamlanamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Ödeme</Text>

        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Seçilen paket</Text>
          <Text style={styles.summaryName}>{selected?.name ?? 'Paket'}</Text>
          <Text style={styles.summaryPrice}>{selected?.price_placeholder ?? ''}</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Kart Numarası"
            value={cardNumber}
            onChangeText={setCardNumber}
            placeholder="0000 0000 0000 0000"
            keyboardType="number-pad"
          />
          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Input
                label="Son Kullanma"
                value={expiry}
                onChangeText={setExpiry}
                placeholder="AA/YY"
              />
            </View>
            <View style={styles.rowItem}>
              <Input
                label="CVV"
                value={cvv}
                onChangeText={setCvv}
                placeholder="123"
                keyboardType="number-pad"
                secureTextEntry
              />
            </View>
          </View>
          <Input
            label="Kart Üzerindeki İsim"
            value={cardName}
            onChangeText={setCardName}
            placeholder="AD SOYAD"
            autoCapitalize="characters"
          />
        </View>

        <Button
          label="Öde"
          onPress={handlePay}
          loading={submitting}
          disabled={!canSubmit}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    ...typography.title,
    fontSize: 28,
  },
  summary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.xs,
  },
  summaryLabel: {
    ...typography.label,
  },
  summaryName: {
    ...typography.title,
  },
  summaryPrice: {
    ...typography.bodySecondary,
  },
  form: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowItem: {
    flex: 1,
  },
});
