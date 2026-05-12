export const borderWidth = {
  thin: 0.5,
  normal: 1,
  thick: 2,
  ultra: 3,
  heavy: 1.5,
} as const;

export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  full: 9999,
  round: 30,
} as const;

export const borderColors = {
  white: {
    faint: 'rgba(255, 255, 255, 0.05)',
    subtle: 'rgba(255, 255, 255, 0.1)',
    normal: 'rgba(255, 255, 255, 0.15)',
    medium: 'rgba(255, 255, 255, 0.2)',
    strong: 'rgba(255, 255, 255, 0.3)',
    heavy: 'rgba(255, 255, 255, 0.4)',
  },
  purple: {
    faint: 'rgba(168, 85, 247, 0.1)',
    subtle: 'rgba(168, 85, 247, 0.2)',
    medium: 'rgba(168, 85, 247, 0.4)',
    light: 'rgba(180, 150, 220, 0.4)',
    normal: 'rgba(168, 85, 247, 0.5)',
    heavy: 'rgba(168, 85, 247, 0.7)',
  },
  pink: {
    subtle: 'rgba(192, 38, 211, 0.2)',
    medium: 'rgba(192, 38, 211, 0.4)',
  },
  error: 'rgba(220, 38, 38, 0.3)',
} as const;

export const borderPresets = {
  card: {
    borderWidth: borderWidth.normal,
    borderColor: borderColors.white.subtle,
    borderRadius: borderRadius.xl,
    overflow: 'hidden' as const,
  },
  cardPurple: {
    borderWidth: borderWidth.normal,
    borderColor: borderColors.purple.medium,
    borderRadius: borderRadius.xl,
    overflow: 'hidden' as const,
  },
  cardPink: {
    borderWidth: borderWidth.normal,
    borderColor: borderColors.pink.medium,
    borderRadius: borderRadius.xl,
    overflow: 'hidden' as const,
  },
  cardRed: {
    borderWidth: borderWidth.normal,
    borderColor: 'rgba(220, 38, 38, 0.5)',
    borderRadius: borderRadius.xl,
    overflow: 'hidden' as const,
  },
  button: {
    borderWidth: borderWidth.normal,
    borderColor: borderColors.white.medium,
    borderRadius: borderRadius.md,
    overflow: 'hidden' as const,
  },
  chip: {
    borderWidth: borderWidth.thin,
    borderColor: borderColors.white.subtle,
    borderRadius: borderRadius.full,
    overflow: 'hidden' as const,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
} as const;

export default {
  width: borderWidth,
  radius: borderRadius,
  colors: borderColors,
  presets: borderPresets,
};
