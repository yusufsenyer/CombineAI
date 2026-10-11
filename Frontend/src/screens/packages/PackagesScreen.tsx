import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { packagesApi } from '../../api';
import { Package } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { AppStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';

type Navigation = NativeStackNavigationProp<AppStackParamList>;

export function PackagesScreen() {
  const navigation = useNavigation<Navigation>();
  const { user } = useAuth();
  const { data: packages, isLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: packagesApi.list,
  });

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Paketler</Text>
        <Text style={styles.subtitle}>Sana uygun paketi seç.</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.textSecondary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {packages?.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              current={pkg.key === user?.package}
              onSelect={() => navigation.navigate('Payment', { packageId: pkg.id })}
            />
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

function PackageCard({
  pkg,
  current,
  onSelect,
}: {
  pkg: Package;
  current: boolean;
  onSelect: () => void;
}) {
  return (
    <View style={[styles.card, current && styles.cardCurrent]}>
      <View style={styles.cardHeader}>
        <Text style={styles.packageName}>{pkg.name}</Text>
        <Text style={styles.packagePrice}>{pkg.price_placeholder}</Text>
      </View>

      <View style={styles.features}>
        {pkg.features.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <Ionicons name="checkmark" size={16} color={colors.textSecondary} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      {current ? (
        <Button label="Mevcut Paketin" disabled />
      ) : (
        <Button label="Seç" onPress={onSelect} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
    fontSize: 28,
  },
  subtitle: {
    ...typography.bodySecondary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardCurrent: {
    borderColor: colors.textPrimary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  packageName: {
    ...typography.title,
  },
  packagePrice: {
    ...typography.subtitle,
    color: colors.textSecondary,
  },
  features: {
    gap: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    ...typography.bodySecondary,
  },
});
