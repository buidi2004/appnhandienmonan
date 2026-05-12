export * from './colors';
export * from './spacing';
export * from './typography';
export * from './borders';
export * from './shadow';
export * from './glass';
export * from './glow';

import { themeColors, gradients, colors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';
import { borderPresets, borderRadius, borderWidth, borderColors } from './borders';
import { shadow } from './shadow';
import { glass } from './glass';
import { glow } from './glow';

export const theme = {
  colors,
  themeColors,
  gradients,
  spacing,
  borderRadius,
  borderPresets,
  typography,
  shadow,
  glass,
  glow,
} as const;

export default theme;
