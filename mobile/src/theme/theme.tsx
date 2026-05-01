import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const lightColors = {
  primary: '#2F7D57',
  primaryDark: '#245E44',
  secondary: '#C4513A',
  accent: '#2E5B9A',
  warning: '#B86B00',
  background: '#F6F7F2',
  card: '#FFFFFF',
  cardSecondary: '#EEF1EA',
  text: '#17231C',
  textSecondary: '#66736B',
  border: '#DDE4DA',
  error: '#D64545',
  success: '#2F9E67',
  iconBg: '#E9EFE8',
};

const darkColors = {
  primary: '#6FD19D',
  primaryDark: '#4CAC78',
  secondary: '#F07A62',
  accent: '#79A7EA',
  warning: '#E2A84B',
  background: '#0F1512',
  card: '#171F1A',
  cardSecondary: '#202A24',
  text: '#F5F7F2',
  textSecondary: '#A7B3AA',
  border: '#2A362F',
  error: '#FF6B6B',
  success: '#63D494',
  iconBg: '#1D2822',
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
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
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
  language: string;
  setManualTheme: (mode: 'dark' | 'light') => void;
  setSystemTheme: () => void;
  setLanguage: (lang: string) => void;
  colors: typeof lightColors;
  spacing: typeof spacing;
  typography: typeof typography;
  borderRadius: typeof borderRadius;
};

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  isSystem: true,
  language: 'vi',
  setManualTheme: () => {},
  setSystemTheme: () => {},
  setLanguage: () => {},
  colors: lightColors,
  spacing: spacing,
  typography: typography,
  borderRadius: borderRadius,
});

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [isSystem, setIsSystem] = useState(true);
  const [isDark, setIsDark] = useState(systemScheme === 'dark');

  const [language, setLanguageState] = useState('vi');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themeMode');
        const savedLang = await AsyncStorage.getItem('appLanguage');
        
        if (savedLang) setLanguageState(savedLang);

        if (savedTheme === 'dark') {
          setIsDark(true);
          setIsSystem(false);
        } else if (savedTheme === 'light') {
          setIsDark(false);
          setIsSystem(false);
        } else {
          setIsSystem(true);
          setIsDark(systemScheme === 'dark');
        }
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    };
    loadSettings();
  }, [systemScheme]);

  const setManualTheme = async (mode: 'dark' | 'light') => {
    const dark = mode === 'dark';
    setIsDark(dark);
    setIsSystem(false);
    await AsyncStorage.setItem('themeMode', mode);
  };

  const setSystemTheme = async () => {
    setIsSystem(true);
    setIsDark(systemScheme === 'dark');
    await AsyncStorage.removeItem('themeMode');
  };

  const setLanguage = async (lang: string) => {
    setLanguageState(lang);
    await AsyncStorage.setItem('appLanguage', lang);
  };

  const currentColors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ 
      isDark, 
      isSystem, 
      language,
      setManualTheme, 
      setSystemTheme, 
      setLanguage,
      colors: currentColors, 
      spacing, 
      typography, 
      borderRadius 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useAppTheme() {
  return useContext(ThemeContext);
}
