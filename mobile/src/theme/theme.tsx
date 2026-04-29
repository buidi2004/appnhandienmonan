import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const lightColors = {
  primary: '#F09035', // Warm Orange/Yellow
  primaryDark: '#D47D2C',
  secondary: '#FF8C42', 
  background: '#FDFCF0', // Creamy White
  card: '#FFFFFF',
  cardSecondary: '#F3EFE9', // Light gray/brown for cards
  text: '#2C2721', // Dark Brown Text
  textSecondary: '#8B7B6B',
  border: '#E2DCD3',
  error: '#EF4444',
  success: '#2ECC71',
  iconBg: '#F3EFE9',
};

const darkColors = {
  primary: '#E6B971', // Yellowish Gold from the image
  primaryDark: '#C9A05C',
  secondary: '#E6B971', 
  background: '#13110E', // Very dark brown/black
  card: '#1A1714', // Slightly lighter dark brown
  cardSecondary: '#25211B', // For inner cards
  text: '#FDFCF0', // Creamy White Text
  textSecondary: '#A99B8B',
  border: '#2C2721',
  error: '#EF4444',
  success: '#2ECC71',
  iconBg: '#1C1916', // Dark background for icons
};

export const typography = {
  fontFamily: 'Poppins_400Regular', 
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    fontFamily: 'Poppins_700Bold',
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    fontFamily: 'Poppins_700Bold',
  },
  h3: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    fontFamily: 'Poppins_600SemiBold',
  },
  body: {
    fontSize: 16,
    fontWeight: 'normal' as const,
    fontFamily: 'Poppins_400Regular',
  },
  caption: {
    fontSize: 14,
    fontWeight: 'normal' as const,
    fontFamily: 'Poppins_400Regular',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const borderRadius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  round: 9999,
};

export const theme = {
  colors: lightColors, // Default fallback
  spacing,
  typography,
  borderRadius,
};

type ThemeContextType = {
  isDark: boolean;
  isSystem: boolean;
  setManualTheme: (isDark: boolean) => void;
  setSystemTheme: () => void;
  colors: typeof lightColors;
  spacing: typeof spacing;
  typography: typeof typography;
  borderRadius: typeof borderRadius;
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  isSystem: true,
  setManualTheme: () => {},
  setSystemTheme: () => {},
  colors: lightColors,
  spacing,
  typography,
  borderRadius,
});

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [isSystem, setIsSystem] = useState(true);
  const [isDark, setIsDark] = useState(systemScheme === 'dark');

  useEffect(() => {
    loadThemePreferences();
  }, []);

  useEffect(() => {
    if (isSystem) {
      setIsDark(systemScheme === 'dark');
    }
  }, [systemScheme, isSystem]);

  const loadThemePreferences = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem('appThemePreference');
      if (storedTheme === 'dark') {
        setIsSystem(false);
        setIsDark(true);
      } else if (storedTheme === 'light') {
        setIsSystem(false);
        setIsDark(false);
      } else {
        setIsSystem(true);
      }
    } catch (e) {}
  };

  const setManualTheme = async (dark: boolean) => {
    setIsSystem(false);
    setIsDark(dark);
    await AsyncStorage.setItem('appThemePreference', dark ? 'dark' : 'light');
  };

  const setSystemTheme = async () => {
    setIsSystem(true);
    setIsDark(systemScheme === 'dark');
    await AsyncStorage.removeItem('appThemePreference');
  };

  const value = {
    isDark,
    isSystem,
    setManualTheme,
    setSystemTheme,
    colors: isDark ? darkColors : lightColors,
    spacing,
    typography,
    borderRadius,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useAppTheme() {
  return useContext(ThemeContext);
}
