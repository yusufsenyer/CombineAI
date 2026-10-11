import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { onboardingApi } from '../../api';
import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { OnboardingStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';

type Navigation = NativeStackNavigationProp<OnboardingStackParamList, 'OnboardingQuestions'>;

export function OnboardingQuestionsScreen() {
  const navigation = useNavigation<Navigation>();
  const { data: questions, isLoading, isError } = useQuery({
    queryKey: ['onboarding', 'questions'],
    queryFn: onboardingApi.questions,
  });

  const [index, setIndex] = useState(0);
  const [selection, setSelection] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ question_key: string; answer_value: string }[]>([]);

  const question = questions?.[index];
  const total = questions?.length ?? 0;
  const isLast = index === total - 1;

  const progress = useMemo(() => (total > 0 ? (index + 1) / total : 0), [index, total]);

  const handleNext = () => {
    if (!question || !selection) return;
    const nextAnswers = [...answers, { question_key: question.key, answer_value: selection }];
    setAnswers(nextAnswers);

    if (isLast) {
      navigation.replace('OnboardingSwipe', { answers: nextAnswers });
    } else {
      setIndex(index + 1);
      setSelection(null);
    }
  };

  if (isLoading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.textSecondary} />
      </Screen>
    );
  }

  if (isError || !question) {
    return (
      <Screen style={styles.center}>
        <Text style={typography.body}>Bir şeyler ters gitti.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>
            {index + 1} / {total}
          </Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        <Text style={styles.prompt}>{question.prompt}</Text>

        <View style={styles.options}>
          {question.options.map((option) => {
            const selected = selection === option;
            return (
              <Pressable
                key={option}
                onPress={() => setSelection(option)}
                style={[styles.option, selected && styles.optionSelected]}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Button label={isLast ? 'Devam' : 'Devam'} onPress={handleNext} disabled={!selection} />
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
  progressRow: {
    gap: spacing.sm,
  },
  progressLabel: {
    ...typography.label,
  },
  track: {
    height: 3,
    backgroundColor: colors.hairline,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.textPrimary,
  },
  prompt: {
    ...typography.title,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  options: {
    flex: 1,
    gap: spacing.sm,
  },
  option: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.card,
    paddingVertical: 16,
    paddingHorizontal: spacing.md,
  },
  optionSelected: {
    backgroundColor: colors.cta,
    borderColor: colors.cta,
  },
  optionText: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  optionTextSelected: {
    color: colors.ctaText,
  },
});
