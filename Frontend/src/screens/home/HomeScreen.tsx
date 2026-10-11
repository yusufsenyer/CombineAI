import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { meApi, outfitsApi } from '../../api';
import { Badge } from '../../components/Badge';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../auth/AuthContext';
import { AppStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';

type Navigation = NativeStackNavigationProp<AppStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Navigation>();
  const { user } = useAuth();

  const { data: usage } = useQuery({
    queryKey: ['usage'],
    queryFn: meApi.usage,
    enabled: !!user,
  });

  const { data: outfits } = useQuery({
    queryKey: ['outfits', 'recent'],
    queryFn: () => outfitsApi.list(1),
    enabled: !!user,
  });

  const lastOutfit = outfits?.[0];
  const quotaExhausted =
    !!usage && usage.daily_outfit.limit !== null && usage.daily_outfit.used >= usage.daily_outfit.limit;

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Bugün ne giyeceğini bil.</Text>
          <Text style={styles.subtitle}>Dolabındaki hazır parçalardan kombin önerileri al.</Text>
        </View>

        {usage && usage.daily_outfit.limit !== null ? (
          <View style={styles.quotaRow}>
            <Badge
              label={
                quotaExhausted
                  ? 'Bugünkü hakkın doldu'
                  : `Bugün ${usage.daily_outfit.used}/${usage.daily_outfit.limit}`
              }
              tone={quotaExhausted ? 'red' : 'neutral'}
            />
          </View>
        ) : null}

        {quotaExhausted ? (
          <View style={styles.exhaustedCard}>
            <Text style={styles.exhaustedTitle}>Bugünlük kombin hakkın doldu</Text>
            <Text style={styles.exhaustedBody}>Yarın tekrar dene ya da sınırsız kombin için yükselt.</Text>
            <Pressable style={styles.exhaustedButton} onPress={() => navigation.navigate('Packages')}>
              <Text style={styles.exhaustedButtonText}>Paketleri Gör</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
            onPress={() => navigation.navigate('ReadySelection')}
          >
            <View style={styles.ctaContent}>
              <Text style={styles.ctaTitle}>Bugün Ne Giyeyim?</Text>
              <Text style={styles.ctaBody}>Hazır parçaları seç, kombin önerisi al.</Text>
            </View>
            <Ionicons name="arrow-forward" size={24} color={colors.ctaText} />
          </Pressable>
        )}

        {lastOutfit ? (
          <Pressable
            style={styles.lastCard}
            onPress={() => navigation.navigate('OutfitDetail', { outfitId: lastOutfit.id })}
          >
            <Text style={styles.sectionLabel}>Son kombin</Text>
            <Text style={styles.lastText} numberOfLines={2}>
              {lastOutfit.text_suggestion}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <Pressable style={styles.cameraFab} onPress={() => navigation.navigate('AddItem')}>
        <Ionicons name="camera" size={26} color={colors.ctaText} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  greeting: {
    ...typography.display,
    fontSize: 30,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  quotaRow: {
    flexDirection: 'row',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cta,
    borderRadius: radius.card,
    padding: spacing.lg,
  },
  ctaPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  ctaContent: {
    flex: 1,
    gap: spacing.xs,
  },
  ctaTitle: {
    ...typography.title,
    color: colors.ctaText,
  },
  ctaBody: {
    ...typography.bodySecondary,
    color: colors.ctaText,
    opacity: 0.7,
  },
  exhaustedCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  exhaustedTitle: {
    ...typography.title,
  },
  exhaustedBody: {
    ...typography.bodySecondary,
  },
  exhaustedButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.cta,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginTop: spacing.sm,
  },
  exhaustedButtonText: {
    ...typography.button,
    color: colors.ctaText,
  },
  lastCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.xs,
  },
  sectionLabel: {
    ...typography.label,
  },
  lastText: {
    ...typography.body,
  },
  cameraFab: {
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
