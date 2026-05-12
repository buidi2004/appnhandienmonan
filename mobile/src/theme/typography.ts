export const typography = {
  displayLg: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -1.0, color: '#FFFFFF' },
  displayMd: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.6, color: '#FFFFFF' },
  h1:        { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.4, color: '#FFFFFF' },
  h2:        { fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.2, color: '#FFFFFF' },
  h3:        { fontSize: 17, fontWeight: '600' as const, color: '#FFFFFF' },
  h4:        { fontSize: 15, fontWeight: '600' as const, color: '#FFFFFF' },
  bodyLg:    { fontSize: 17, fontWeight: '400' as const, lineHeight: 26, color: 'rgba(255,255,255,0.65)' },
  body:      { fontSize: 15, fontWeight: '400' as const, lineHeight: 23, color: 'rgba(255,255,255,0.65)' },
  bodySm:    { fontSize: 13, fontWeight: '400' as const, lineHeight: 20, color: 'rgba(255,255,255,0.65)' },
  label:     { fontSize: 13, fontWeight: '500' as const, color: 'rgba(255,255,255,0.65)' },
  labelSm:   { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.6, color: 'rgba(255,255,255,0.40)' },
  caption:   { fontSize: 11, fontWeight: '400' as const, color: 'rgba(255,255,255,0.40)' },
  numeric:   { fontSize: 15, fontWeight: '600' as const, color: '#FFFFFF' },
  numericLg: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5, color: '#FFFFFF' },
} as const;

export default typography;
