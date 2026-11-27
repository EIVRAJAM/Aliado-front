const lightPalette = {
  primary: '#1D4ED8',
  secondarySurface: '#EEF4FF',
  secondaryPressed: '#DBEAFE',
  secondaryBorder: '#C7D2FE',
  background: '#F4F6FB',
  surface: '#FFFFFF',
  surfaceRaised: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  neutral: '#475569',
  neutralSurface: 'rgba(71, 85, 105, 0.10)',
  success: '#166534',
  successSurface: 'rgba(22, 101, 52, 0.12)',
  warning: '#92400E',
  warningSurface: 'rgba(146, 64, 14, 0.14)',
  danger: '#B91C1C',
  dangerSurface: 'rgba(185, 28, 28, 0.12)',
  info: '#1D4ED8',
  infoSurface: 'rgba(29, 78, 216, 0.12)',
  teal: '#115E59',
  tealSurface: 'rgba(17, 94, 89, 0.14)',
  inputBackground: '#FFFFFF',
  disabled: '#94A3B8',
  chevron: '#94A3B8',
};

const darkPalette: typeof lightPalette = {
  primary: '#60A5FA',
  secondarySurface: '#17233D',
  secondaryPressed: '#1E3355',
  secondaryBorder: '#2B4C8C',
  background: '#0B1020',
  surface: '#141B2D',
  surfaceRaised: '#1B2438',
  text: '#F8FAFC',
  muted: '#A8B4C8',
  neutral: '#CBD5E1',
  neutralSurface: 'rgba(203, 213, 225, 0.12)',
  success: '#4ADE80',
  successSurface: 'rgba(74, 222, 128, 0.18)',
  warning: '#FBBF24',
  warningSurface: 'rgba(251, 191, 36, 0.18)',
  danger: '#F87171',
  dangerSurface: 'rgba(248, 113, 113, 0.18)',
  info: '#93C5FD',
  infoSurface: 'rgba(147, 197, 253, 0.16)',
  teal: '#5EEAD4',
  tealSurface: 'rgba(94, 234, 212, 0.16)',
  inputBackground: '#141B2D',
  disabled: '#64748B',
  chevron: '#94A3B8',
};

const staticColors = {
  border: 'rgba(100, 116, 139, 0.26)',
  primarySolid: '#1D4ED8',
  primary: '#1D4ED8',
  primaryPressed: '#1E40AF',
  primarySoft: 'rgba(29, 78, 216, 0.12)',
  onPrimary: '#FFFFFF',
  onImage: '#FFFFFF',
  danger: '#DC2626',
  dangerSurface: 'rgba(220, 38, 38, 0.12)',
  success: '#16A34A',
  successSurface: 'rgba(22, 163, 74, 0.12)',
  warning: '#B45309',
  warningSurface: 'rgba(180, 83, 9, 0.14)',
  info: '#1D4ED8',
  infoSurface: 'rgba(29, 78, 216, 0.12)',
  avatar: '#2563EB',
  teal: '#0F766E',
  tealSurface: 'rgba(15, 118, 110, 0.14)',
  neutralSurface: 'rgba(100, 116, 139, 0.12)',
  shadow: '#020617',
  authBackground: '#0B2A6F',
  authMuted: '#DBEAFE',
  header: '#0B2A6F',
  headerMuted: '#C7D2FE',
};

export type ThemeScheme = 'light' | 'dark';
export type ThemePalette = typeof lightPalette;
export type ThemeColors = typeof staticColors & ThemePalette;

export const lightColors: ThemeColors = { ...staticColors, ...lightPalette };
export const darkColors: ThemeColors = { ...staticColors, ...darkPalette };

export function getThemeColors(scheme: ThemeScheme): ThemeColors {
  return scheme === 'dark' ? darkColors : lightColors;
}

export function getThemePalette(scheme: ThemeScheme): ThemePalette {
  return scheme === 'dark' ? darkPalette : lightPalette;
}

export const colors = lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
};
