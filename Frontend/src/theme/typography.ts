import { TextStyle } from 'react-native';

import { colors } from './colors';

export const fonts = {
  light: 'SpaceGrotesk_300Light',
  regular: 'SpaceGrotesk_400Regular',
  medium: 'SpaceGrotesk_500Medium',
  semiBold: 'SpaceGrotesk_600SemiBold',
  bold: 'SpaceGrotesk_700Bold',
} as const;

export const typography: Record<string, TextStyle> = {
  display: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
    color: colors.textPrimary,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 17,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  bodySecondary: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    color: colors.textSecondary,
  },
  button: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.ctaText,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textTertiary,
  },
};
