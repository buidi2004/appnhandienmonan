import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/theme';
import AnimatedButton from './AnimatedButton';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  buttonText?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon, 
  title, 
  description, 
  buttonText, 
  onPress,
  style 
}) => {
  const { colors, typography, spacing, borderRadius } = useAppTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}20` }]}>
        <Ionicons name={icon} size={48} color={colors.primary} />
      </View>
      <Text style={[typography.h2, { color: colors.text, marginTop: spacing.lg, textAlign: 'center' }]}>
        {title}
      </Text>
      <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center', paddingHorizontal: 40 }]}>
        {description}
      </Text>
      {buttonText && onPress && (
        <AnimatedButton 
          style={[styles.button, { backgroundColor: colors.primary, borderRadius: borderRadius.md }]} 
          onPress={onPress}
        >
          <Text style={[typography.h3, { color: '#FFF' }]}>{buttonText}</Text>
        </AnimatedButton>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
});

export default EmptyState;
