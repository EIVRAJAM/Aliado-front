import { File, Paths } from 'expo-file-system';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { Appearance, useColorScheme } from 'react-native';

import { getThemeColors, type ThemeColors, type ThemeScheme } from './theme';

export type ThemeMode = 'system' | 'light' | 'dark';
export type { ThemeColors, ThemePalette } from './theme';

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedScheme: ThemeScheme;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const themeFile = new File(Paths.document, 'aliado-theme-preference.txt');
const validModes: ThemeMode[] = ['system', 'light', 'dark'];

function applyMode(mode: ThemeMode) {
  Appearance.setColorScheme(mode === 'system' ? 'auto' : mode);
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (!themeFile.exists) {
          return;
        }
        const stored = (await themeFile.text()).trim() as ThemeMode;
        if (active && validModes.includes(stored)) {
          setModeState(stored);
          applyMode(stored);
        }
      } catch {
        // Keep the system theme when the local preference cannot be read.
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    applyMode(nextMode);
    try {
      themeFile.writeSync(nextMode);
    } catch {
      // The selection still applies for this execution.
    }
  }, []);

  const resolvedScheme: ThemeScheme =
    systemScheme ?? (mode === 'dark' ? 'dark' : 'light');
  const themeColors = getThemeColors(resolvedScheme);
  const value = useMemo(
    () => ({ mode, resolvedScheme, colors: themeColors, setMode }),
    [mode, resolvedScheme, themeColors, setMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useAppTheme must be used inside ThemeProvider');
  }
  return value;
}

export const useTheme = useAppTheme;
