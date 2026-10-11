import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { outfitsApi } from '../../api';
import { Outfit, resolveImageUrl } from '../../api/types';
import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { AppStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';

type Navigation = NativeStackNavigationProp<AppStackParamList>;

export function OutfitsScreen() {
  const navigation = useNavigation<Navigation>();
  const { data: outfits, isLoading } = useQuery({
    queryKey: ['outfits', 'history'],
    queryFn: () => outfitsApi.list(1),
  });

  const renderItem = ({ item }: { item: Outfit }) => (
    <Pressable
      style={styles.card}
      onPress={() => navigation.navigate('OutfitDetail', { outfitId: item.id })}
    >
      <Image
        source={{ uri: resolveImageUrl(item.item_images[0]) ?? undefined }}
        style={styles.thumb}
        contentFit="cover"
        transition={150}
      />
      <View style={styles.cardBody}>
        <Text style={styles.cardText} numberOfLines={2}>
          {item.text_suggestion}
        </Text>
        <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
      </View>
    </Pressable>
  );

  return (
    <Screen edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Kombinler</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.textSecondary} />
        </View>
      ) : outfits && outfits.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Henüz kombin oluşturmadın</Text>
          <Text style={styles.emptyBody}>İlk kombinini oluşturarak başla.</Text>
          <Button label="Kombin Oluştur" onPress={() => navigation.navigate('ReadySelection')} />
        </View>
      ) : (
        <FlatList
          data={outfits}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.title,
    fontSize: 28,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    ...typography.title,
    textAlign: 'center',
  },
  emptyBody: {
    ...typography.bodySecondary,
    marginBottom: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.card,
    padding: spacing.sm,
  },
  thumb: {
    width: 72,
    height: 88,
    borderRadius: radius.sm,
    backgroundColor: colors.hairline,
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  cardText: {
    ...typography.body,
  },
  cardDate: {
    ...typography.caption,
  },
});
