import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors as designColors, spacing, typography, borderRadius, glass, glow, borderPresets } from './index';

const lightColors = {
  ...designColors,
  background: '#0e0118',
  card: 'rgba(255, 255, 255, 0.05)',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.65)',
  textTertiary: 'rgba(255, 255, 255, 0.35)',
  border: 'rgba(255, 255, 255, 0.1)',
};

const darkColors = {
  ...designColors,
  background: '#0D0D1A',
  card: '#13132A',
  text: '#FFFFFF',
  border: 'rgba(255,255,255,0.1)',
};

type ThemeContextType = {
  isDark: boolean;
  isSystem: boolean;
  language: string;
  setManualTheme: (mode: 'dark' | 'light') => void;
  setSystemTheme: () => void;
  setLanguage: (lang: string) => void;
  colors: typeof darkColors;
  spacing: typeof spacing;
  typography: typeof typography;
  borderRadius: typeof borderRadius;
  glass: typeof glass;
  glow: typeof glow;
  borderPresets: typeof borderPresets;
};

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(true);
  const [isSystem, setIsSystem] = useState(false);
  const [language, setLanguageState] = useState('vi');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themeMode');
        const savedLang = await AsyncStorage.getItem('appLanguage');
        
        if (savedLang) setLanguageState(savedLang);
        
        if (savedTheme) {
          setIsSystem(false);
          setIsDark(savedTheme === 'dark');
        } else {
          setIsSystem(false);
          setIsDark(true);
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
      borderRadius,
      glass,
      glow,
      borderPresets
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useAppTheme() {
  return useContext(ThemeContext);
}
