import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';

export type BadgeTone = 'red' | 'blue' | 'green' | 'yellow' | 'neutral';

const TONES: Record<BadgeTone, { bg: string; text: string }> = {
  red: colors.paleRed,
  blue: colors.paleBlue,
  green: colors.paleGreen,
  yellow: colors.paleYellow,
  neutral: { bg: '#EFEFED', text: colors.textSecondary },
};

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  style?: ViewStyle;
}

export function Badge({ label, tone = 'neutral', style }: BadgeProps) {
  const palette = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }, style]}>
      <Text style={[styles.text, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  text: {
    ...typography.label,
    textTransform: 'uppercase',
  },
});
