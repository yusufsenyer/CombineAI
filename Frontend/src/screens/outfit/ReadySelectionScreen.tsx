import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { outfitsApi, wardrobeApi } from '../../api';
import { ApiError } from '../../api/client';
import { resolveImageUrl } from '../../api/types';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { UpgradeModal } from '../../components/UpgradeModal';
import { categoryLabel, categoryTone, CATEGORIES } from '../../config/categories';
import { AppStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';

type Navigation = NativeStackNavigationProp<AppStackParamList>;

export function ReadySelectionScreen() {
  const navigation = useNavigation<Navigation>();
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeVisible, setUpgradeVisible] = useState(false);

  const { data: items, isLoading } = useQuery({
    queryKey: ['wardrobe', category ?? 'all'],
    queryFn: () => wardrobeApi.list(category),
  });

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCount = selected.size;

  const handleGenerate = async () => {
    if (selectedCount === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await outfitsApi.generate(Array.from(selected));
      navigation.navigate('Result', { jobId: result.job_id });
    } catch (e) {
      if (e instanceof ApiError && e.code === 'daily_limit_reached') {
        setUpgradeVisible(true);
      } else {
        setError(e instanceof ApiError ? e.message : 'Kombin oluşturulamadı.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: { id: number; category: string; color: string; image_url: string | null } }) => {
    const isSelected = selected.has(item.id);
    return (
      <Pressable style={styles.card} onPress={() => toggle(item.id)}>
        <Image
          source={{ uri: resolveImageUrl(item.image_url) ?? undefined }}
          style={styles.cardImage}
          contentFit="cover"
          transition={150}
        />
        {isSelected ? (
          <View style={styles.selectedOverlay}>
            <Ionicons name="checkmark" size={32} color={colors.ctaText} />
          </View>
        ) : null}
        <View style={styles.cardMeta}>
          <Badge label={categoryLabel(item.category)} tone={categoryTone(item.category)} />
        </View>
      </Pressable>
    );
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Bugün ne hazır?</Text>
        <Text style={styles.subtitle}>Temiz ve hazır parçaları seç.</Text>
      </View>

      <View style={styles.filters}>
        <FilterChip label="Tümü" active={!category} onPress={() => setCategory(undefined)} />
        {CATEGORIES.map((c) => (
          <FilterChip key={c.key} label={c.label} active={category === c.key} onPress={() => setCategory(c.key)} />
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.textSecondary} />
        </View>
      ) : items && items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Önce dolabına kıyafet ekle</Text>
          <Button label="Kıyafet Ekle" onPress={() => navigation.navigate('AddItem')} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.footer}>
        <Text style={styles.footerText}>{selectedCount} parça seçildi</Text>
        <Button
          label="Kombin Oluştur"
          onPress={handleGenerate}
          disabled={selectedCount === 0}
          loading={submitting}
          style={styles.footerButton}
        />
      </View>

      <UpgradeModal
        visible={upgradeVisible}
        onClose={() => setUpgradeVisible(false)}
        onUpgrade={() => {
          setUpgradeVisible(false);
          navigation.navigate('Packages');
        }}
        title="Günlük limit doldu"
        message="Bugünlük kombin hakkını doldurdun. Sınırsız kombin için premium'a yükselt."
      />
    </Screen>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
    fontSize: 28,
  },
  subtitle: {
    ...typography.bodySecondary,
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  chipActive: {
    backgroundColor: colors.cta,
    borderColor: colors.cta,
  },
  chipText: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'none',
  },
  chipTextActive: {
    color: colors.ctaText,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    ...typography.title,
    textAlign: 'center',
  },
  grid: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  row: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    aspectRatio: 0.8,
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(17, 17, 17, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheck: {
    color: colors.ctaText,
    fontSize: 32,
    fontWeight: '700',
  },
  cardMeta: {
    padding: spacing.sm,
  },
  error: {
    ...typography.bodySecondary,
    color: colors.danger,
    paddingHorizontal: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    backgroundColor: colors.surface,
  },
  footerText: {
    ...typography.bodySecondary,
  },
  footerButton: {
    flex: 1,
  },
});
