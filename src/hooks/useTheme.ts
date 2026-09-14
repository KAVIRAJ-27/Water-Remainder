import { useColorScheme } from 'react-native';
import { Colors, ThemeColors } from '../constants/theme';
import { useUserStore } from '../store/userStore';
import { ThemeMode } from '../types';

export function useTheme(): {
  colors: ThemeColors;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
} {
  const systemColorScheme = useColorScheme();
  const themeMode = useUserStore((state) => state.themeMode);
  const setThemeMode = useUserStore((state) => state.setThemeMode);

  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');

  const colors = isDark ? Colors.dark : Colors.light;

  return {
    colors,
    isDark,
    themeMode,
    setThemeMode,
  };
}
