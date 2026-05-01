import React, { useRef } from 'react';
import { TouchableOpacity, Animated, TouchableOpacityProps, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

interface AnimatedButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  haptic?: boolean;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({ 
  children, 
  style, 
  onPress, 
  haptic = true, 
  activeOpacity = 0.8,
  ...props 
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
      bounciness: 10,
    }).start();
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 10,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      {...props}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default AnimatedButton;
