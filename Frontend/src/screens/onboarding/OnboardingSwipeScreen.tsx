import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { onboardingApi } from '../../api';
import { resolveImageUrl, SwipeCard } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { Badge } from '../../components/Badge';
import { Screen } from '../../components/Screen';
import { colors, radius, spacing, typography } from '../../theme';

const SWIPE_THRESHOLD = 120;

export function OnboardingSwipeScreen() {
  const route = useRoute();
  const { answers } = route.params as { answers: { question_key: string; answer_value: string }[] };
  const { setUser } = useAuth();

  const { data: cards, isLoading, isError } = useQuery({
    queryKey: ['onboarding', 'swipe_cards'],
    queryFn: onboardingApi.swipeCards,
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [completing, setCompleting] = useState(false);
  const responsesRef = useRef<{ card_id: number; liked: boolean }[]>([]);

  const position = useRef(new Animated.ValueXY()).current;

  const rotate = position.x.interpolate({
    inputRange: [-250, 0, 250],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });
  const likeOpacity = position.x.interpolate({
    inputRange: [0, 80, 160],
    outputRange: [0, 0.4, 1],
    extrapolate: 'clamp',
  });
  const dislikeOpacity = position.x.interpolate({
    inputRange: [-160, -80, 0],
    outputRange: [1, 0.4, 0],
    extrapolate: 'clamp',
  });

  const currentCard = cards?.[currentIndex];

  const complete = async () => {
    setCompleting(true);
    try {
      const result = await onboardingApi.complete(answers, responsesRef.current);
      setUser(result.user);
    } catch {
      // If completion fails, allow retry from the last card.
      setCompleting(false);
    }
  };

  const advance = (liked: boolean) => {
    if (!currentCard) return;
    responsesRef.current.push({ card_id: currentCard.id, liked });
    position.setValue({ x: 0, y: 0 });
    setCurrentIndex((i) => i + 1);
  };

  const swipe = (liked: boolean) => {
    Animated.timing(position, {
      toValue: { x: (liked ? 1 : -1) * 500, y: 0 },
      duration: 240,
      useNativeDriver: false,
    }).start(() => advance(liked));
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderMove: Animated.event([null, { dx: position.x, dy: position.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx > SWIPE_THRESHOLD) {
            swipe(true);
          } else if (gesture.dx < -SWIPE_THRESHOLD) {
            swipe(false);
          } else {
            Animated.spring(position, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: false,
              friction: 5,
            }).start();
          }
        },
      }),
    [position],
  );

  useEffect(() => {
    if (cards && cards.length > 0 && currentIndex >= cards.length && !completing) {
      complete();
    }
  }, [currentIndex, cards, completing]);

  if (isLoading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.textSecondary} />
      </Screen>
    );
  }

  if (isError || !cards) {
    return (
      <Screen style={styles.center}>
        <Text style={typography.body}>Bir şeyler ters gitti.</Text>
      </Screen>
    );
  }

  if (cards.length === 0) {
    return (
      <Screen style={styles.center}>
        <Text style={typography.body}>Kart bulunamadı.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Tarza göz at</Text>
          <Text style={styles.subtitle}>Beğendiklerini sağa, beğenmediklerini sola kaydır.</Text>
        </View>

        <View style={styles.deck}>
          {currentCard ? (
            <Animated.View
              {...panResponder.panHandlers}
              style={[
                styles.card,
                { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] },
              ]}
            >
              <Image
                source={{ uri: resolveImageUrl(currentCard.image_url) ?? undefined }}
                style={styles.cardImage}
                contentFit="cover"
                transition={200}
              />
              <View style={styles.cardFooter}>
                {currentCard.tags.map((tag) => (
                  <Badge key={tag} label={tag} tone="neutral" />
                ))}
              </View>
              <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOpacity }]}>
                <Text style={[styles.stampText, { color: colors.success }]}>BEĞENDİM</Text>
              </Animated.View>
              <Animated.View style={[styles.stamp, styles.dislikeStamp, { opacity: dislikeOpacity }]}>
                <Text style={[styles.stampText, { color: colors.danger }]}>BEĞENMEDİM</Text>
              </Animated.View>
            </Animated.View>
          ) : null}
        </View>

        <View style={styles.actions}>
          <Pressable style={[styles.roundButton, styles.dislike]} onPress={() => swipe(false)}>
            <Ionicons name="close" size={26} color={colors.danger} />
          </Pressable>
          <Pressable style={[styles.roundButton, styles.like]} onPress={() => swipe(true)}>
            <Ionicons name="heart" size={24} color={colors.ctaText} />
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
  },
  subtitle: {
    ...typography.bodySecondary,
  },
  deck: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  cardImage: {
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  stamp: {
    position: 'absolute',
    top: spacing.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  likeStamp: {
    left: spacing.md,
    borderColor: colors.success,
  },
  dislikeStamp: {
    right: spacing.md,
    borderColor: colors.danger,
  },
  stampText: {
    ...typography.label,
    fontSize: 13,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  roundButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dislike: {
    backgroundColor: colors.surface,
    borderColor: colors.hairline,
  },
  like: {
    backgroundColor: colors.cta,
    borderColor: colors.cta,
  },
});
