/**
 * Central design tokens for the mobile app.
 * Mirrors the existing web app's brand identity: deep navy + blue accent,
 * with a clean, editorial-finance feel. Solid colors — no gradients.
 */

export const colors = {
  brand: '#1e3a5f',
  brandLight: '#2563eb',
  brandSoft: '#eff6ff',

  bg: '#f6f7f9',
  surface: '#ffffff',
  border: '#e5e7eb',

  text: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',

  success: '#16a34a',
  successSoft: '#dcfce7',
  warning: '#d97706',
  warningSoft: '#fef3c7',
  danger: '#dc2626',
  dangerSoft: '#fee2e2',
  info: '#2563eb',
  infoSoft: '#dbeafe',
  purple: '#7c3aed',
  purpleSoft: '#ede9fe',

  white: '#ffffff',
  black: '#000000',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  full: 999,
} as const;

export const typography = {
  h1: { fontSize: 26, fontWeight: '700' as const, color: colors.text },
  h2: { fontSize: 20, fontWeight: '600' as const, color: colors.text },
  h3: { fontSize: 16, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  caption: { fontSize: 12, color: colors.textSecondary },
};
