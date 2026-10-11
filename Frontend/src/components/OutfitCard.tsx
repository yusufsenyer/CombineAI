import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Outfit, resolveImageUrl } from '../api/types';
import { colors, radius, spacing, typography } from '../theme';
import { Skeleton } from './Skeleton';

interface OutfitCardProps {
  outfit: Outfit;
  onUnlock?: () => void;
}

export function OutfitCard({ outfit, onUnlock }: OutfitCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.suggestion}>{outfit.text_suggestion}</Text>

      <Text style={styles.sectionLabel}>Seçilen parçalar</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.collage}
      >
        {outfit.item_images.map((url, idx) => (
          <Image
            key={idx}
            source={{ uri: resolveImageUrl(url) ?? undefined }}
            style={styles.collageImage}
            contentFit="cover"
            transition={150}
          />
        ))}
      </ScrollView>

      <TryOnVisual outfit={outfit} onUnlock={onUnlock} />
    </View>
  );
}

function TryOnVisual({ outfit, onUnlock }: { outfit: Outfit; onUnlock?: () => void }) {
  const { status, url, locked } = outfit.visual;

  if (status === 'pending') {
    return (
      <>
        <Text style={styles.sectionLabel}>Try-on</Text>
        <Skeleton style={styles.tryOnSkeleton} />
      </>
    );
  }

  if (status === 'error') {
    return (
      <>
        <Text style={styles.sectionLabel}>Try-on</Text>
        <Text style={styles.errorText}>Görsel üretilemedi.</Text>
      </>
    );
  }

  if (locked) {
    const preview = outfit.item_images[0] ? resolveImageUrl(outfit.item_images[0]) : undefined;
    return (
      <>
        <Text style={styles.sectionLabel}>Try-on</Text>
        <Pressable style={styles.locked} onPress={onUnlock}>
          <Image
            source={{ uri: preview ?? undefined }}
            style={styles.lockedImage}
            blurRadius={18}
            contentFit="cover"
          />
          <View style={styles.lockedOverlay}>
            <Ionicons name="lock-closed" size={22} color={colors.ctaText} />
            <Text style={styles.lockedText}>Try-on için premium alın</Text>
          </View>
        </Pressable>
      </>
    );
  }

  return (
    <>
      <Text style={styles.sectionLabel}>Try-on</Text>
      <Image
        source={{ uri: resolveImageUrl(url) ?? undefined }}
        style={styles.tryOnImage}
        contentFit="cover"
        transition={200}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.md,
  },
  suggestion: {
    ...typography.body,
    fontSize: 16,
    lineHeight: 24,
  },
  sectionLabel: {
    ...typography.label,
  },
  collage: {
    gap: spacing.sm,
  },
  collageImage: {
    width: 110,
    height: 140,
    borderRadius: radius.sm,
    backgroundColor: colors.hairline,
  },
  tryOnSkeleton: {
    width: '100%',
    aspectRatio: 0.75,
  },
  tryOnImage: {
    width: '100%',
    aspectRatio: 0.75,
    borderRadius: radius.sm,
    backgroundColor: colors.hairline,
  },
  locked: {
    width: '100%',
    aspectRatio: 0.75,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  lockedImage: {
    width: '100%',
    height: '100%',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(17, 17, 17, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  lockedText: {
    ...typography.button,
    color: colors.ctaText,
  },
  errorText: {
    ...typography.bodySecondary,
    color: colors.danger,
  },
});
