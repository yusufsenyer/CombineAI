import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { wardrobeApi } from '../../api';
import { resolveImageUrl, WardrobeItem } from '../../api/types';
import { Badge } from '../../components/Badge';
import { Screen } from '../../components/Screen';
import { UpgradeModal } from '../../components/UpgradeModal';
import { categoryLabel, categoryTone, CATEGORIES } from '../../config/categories';
import { FREE_WARDROBE_LIMIT } from '../../config/limits';
import { useAuth } from '../../auth/AuthContext';
import { AppStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';

type Navigation = NativeStackNavigationProp<AppStackParamList>;

export function WardrobeScreen() {
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [category, setCategory] = useState<string | undefined>(undefined);
  const [upgradeVisible, setUpgradeVisible] = useState(false);

  const { data: items, isLoading } = useQuery({
    queryKey: ['wardrobe', category ?? 'all'],
    queryFn: () => wardrobeApi.list(category),
  });

  const limitReached = useMemo(
    () => user?.package === 'free' && (items?.length ?? 0) >= FREE_WARDROBE_LIMIT,
    [user?.package, items],
  );

  const handleAdd = () => {
    if (limitReached) {
      setUpgradeVisible(true);
    } else {
      navigation.navigate('AddItem');
    }
  };

  const handleDelete = (item: WardrobeItem) => {
    Alert.alert('Parçayı sil', 'Bu parçayı dolabından silmek istediğine emin misin?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await wardrobeApi.remove(item.id);
          queryClient.invalidateQueries({ queryKey: ['wardrobe'] });
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: WardrobeItem }) => (
    <Pressable style={styles.card} onLongPress={() => handleDelete(item)}>
      <Image
        source={{ uri: resolveImageUrl(item.image_url) ?? undefined }}
        style={styles.cardImage}
        contentFit="cover"
        transition={150}
      />
      <View style={styles.cardMeta}>
        <Badge label={categoryLabel(item.category)} tone={categoryTone(item.category)} />
        {item.color ? <Text style={styles.cardColor}>{item.color}</Text> : null}
      </View>
    </Pressable>
  );

  return (
    <Screen edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Dolabım</Text>
        <Text style={styles.subtitle}>
          {items ? `${items.length} parça` : ''}
        </Text>
      </View>

      <View style={styles.filters}>
        <FilterChip label="Tümü" active={!category} onPress={() => setCategory(undefined)} />
        {CATEGORIES.map((c) => (
          <FilterChip
            key={c.key}
            label={c.label}
            active={category === c.key}
            onPress={() => setCategory(c.key)}
          />
        ))}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.textSecondary} />
        </View>
      ) : items && items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Henüz kıyafet eklemedin</Text>
          <Text style={styles.emptyBody}>Dolabına bir parça ekleyerek başla.</Text>
          <Pressable style={styles.emptyButton} onPress={handleAdd}>
            <Ionicons name="add" size={28} color={colors.ctaText} />
          </Pressable>
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

      <Pressable style={styles.fab} onPress={handleAdd}>
        <Ionicons name="add" size={30} color={colors.ctaText} />
      </Pressable>

      <UpgradeModal
        visible={upgradeVisible}
        onClose={() => setUpgradeVisible(false)}
        onUpgrade={() => {
          setUpgradeVisible(false);
          navigation.navigate('Packages');
        }}
        title="Dolap limiti doldu"
        message="Free pakette 5 parça sınırına ulaştın. Sınırsız parça için premium'a yükselt."
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
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    ...typography.title,
  },
  emptyBody: {
    ...typography.bodySecondary,
  },
  emptyButton: {
    marginTop: spacing.md,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.cta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
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
  cardMeta: {
    padding: spacing.sm,
    gap: 2,
  },
  cardColor: {
    ...typography.caption,
    textTransform: 'capitalize',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.cta,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
