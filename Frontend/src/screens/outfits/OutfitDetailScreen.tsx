import { useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { outfitsApi } from '../../api';
import { OutfitCard } from '../../components/OutfitCard';
import { Screen } from '../../components/Screen';
import { colors, spacing, typography } from '../../theme';

export function OutfitDetailScreen() {
  const route = useRoute();
  const { outfitId } = route.params as { outfitId: number };

  const { data: outfit, isLoading, isError } = useQuery({
    queryKey: ['outfits', outfitId],
    queryFn: () => outfitsApi.detail(outfitId),
  });

  if (isLoading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.textSecondary} />
      </Screen>
    );
  }

  if (isError || !outfit) {
    return (
      <Screen style={styles.center}>
        <Text style={typography.body}>Kombin bulunamadı.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Kombin Detayı</Text>
        <OutfitCard outfit={outfit} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  title: {
    ...typography.title,
    fontSize: 24,
  },
});
