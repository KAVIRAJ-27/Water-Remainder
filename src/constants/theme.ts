import { Platform } from 'react-native';

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  waterFill: string;
  waterGlow: string;
  background: string;
  backgroundElement: string;
  backgroundSelected: string;
  surface: string;
  surfaceElevated: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  tabBar: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
  cardGlow: string;
  badge: string;
  badgeText: string;
  success: string;
  warning: string;
  danger: string;
}

export const Colors: { light: ThemeColors; dark: ThemeColors } = {
  light: {
    primary: '#0284C7',
    primaryLight: '#38BDF8',
    primaryDark: '#0369A1',
    accent: '#06B6D4',
    waterFill: '#0EA5E9',
    waterGlow: 'rgba(14, 165, 233, 0.18)',
    background: '#F8FAFC',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    surface: '#FFFFFF',
    surfaceElevated: '#F1F5F9',
    card: '#FFFFFF',
    text: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    tabBar: '#FFFFFF',
    tabBarBorder: '#E2E8F0',
    tabBarActive: '#0284C7',
    tabBarInactive: '#94A3B8',
    cardGlow: 'rgba(2, 132, 199, 0.08)',
    badge: '#E0F2FE',
    badgeText: '#0284C7',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
  },
  dark: {
    primary: '#38BDF8',
    primaryLight: '#7DD3FC',
    primaryDark: '#0284C7',
    accent: '#22D3EE',
    waterFill: '#38BDF8',
    waterGlow: 'rgba(56, 189, 248, 0.22)',
    background: '#070D18',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    surface: '#0F172A',
    surfaceElevated: '#1E293B',
    card: '#111C30',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    border: '#1E293B',
    borderLight: '#162235',
    tabBar: '#0B1322',
    tabBarBorder: '#172338',
    tabBarActive: '#38BDF8',
    tabBarInactive: '#64748B',
    cardGlow: 'rgba(56, 189, 248, 0.12)',
    badge: '#082F49',
    badgeText: '#38BDF8',
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
  },
};

export type ThemeColorKey = keyof ThemeColors;
export type ThemeColor = ThemeColorKey;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
}) as { sans: string; serif: string; rounded: string; mono: string };

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
};
