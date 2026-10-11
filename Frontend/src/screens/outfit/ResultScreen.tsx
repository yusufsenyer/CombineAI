import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { outfitsApi } from '../../api';
import { OutfitCard } from '../../components/OutfitCard';
import { Screen } from '../../components/Screen';
import { AppStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

type Navigation = NativeStackNavigationProp<AppStackParamList>;

export function ResultScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute();
  const { jobId } = route.params as { jobId: number };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['outfits', 'job', jobId],
    queryFn: () => outfitsApi.job(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'complete' || status === 'error') return false;
      return 1500;
    },
  });

  if (isLoading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.textSecondary} />
      </Screen>
    );
  }

  if (isError || !data) {
    return (
      <Screen style={styles.center}>
        <Text style={typography.body}>Kombinler yüklenemedi.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Kombinlerin</Text>
        <Text style={styles.subtitle}>
          {data.status === 'complete'
            ? 'İşte sana öneriler.'
            : 'Kombinlerin hazırlanıyor...'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {data.outfits.map((outfit) => (
          <OutfitCard
            key={outfit.id}
            outfit={outfit}
            onUnlock={() => navigation.navigate('Packages')}
          />
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
});
