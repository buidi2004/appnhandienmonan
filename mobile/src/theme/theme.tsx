import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const lightColors = {
  primary: '#F09035', // Warm Orange/Yellow
  primaryDark: '#D47D2C',
  secondary: '#FF8C42', 
  accent: '#2E5B9A',
  warning: '#B86B00',
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
  primary: '#E6B971', // Yellowish Gold
  primaryDark: '#C9A05C',
  secondary: '#E6B971', 
  accent: '#79A7EA',
  warning: '#E2A84B',
  background: '#13110E', // Very dark brown/black
  card: '#1A1714', 
  cardSecondary: '#25211B', 
  text: '#FDFCF0', 
  textSecondary: '#A99B8B',
  border: '#2C2721',
  error: '#EF4444',
  success: '#2ECC71',
  iconBg: '#1C1916',
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
  colors: lightColors, 
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
      } catch (e) {}
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
