import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '../theme/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  borderRadius?: number;
}

const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  style, 
  intensity = 30, 
  tint, 
  borderRadius = 24 
}) => {
  const { isDark } = useAppTheme();
  const defaultTint = tint || (isDark ? 'dark' : 'light');

  return (
    <View style={[styles.container, { borderRadius }, style]}>
      <BlurView 
        intensity={intensity} 
        tint={defaultTint} 
        style={[styles.blur, { borderRadius }]}
      >
        {children}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  blur: {
    flex: 1,
  },
});

export default GlassCard;
