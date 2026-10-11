export const colors = {
  canvas: '#FBFBFA',
  surface: '#FFFFFF',
  hairline: '#EAEAEA',
  textPrimary: '#111111',
  textSecondary: '#787774',
  textTertiary: '#A0A09B',
  cta: '#111111',
  ctaPressed: '#333333',
  ctaText: '#FFFFFF',
  danger: '#9F2F2D',
  success: '#346538',

  paleRed: { bg: '#FDEBEC', text: '#9F2F2D' },
  paleBlue: { bg: '#E1F3FE', text: '#1F6C9F' },
  paleGreen: { bg: '#EDF3EC', text: '#346538' },
  paleYellow: { bg: '#FBF3DB', text: '#956400' },
} as const;

export type ColorName = keyof typeof colors;
