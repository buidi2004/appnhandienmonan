import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera } from 'expo-camera';
import { auth, onAuthStateChanged } from '../config/firebaseConfig';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const { colors, typography, spacing } = useAppTheme();

  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animation
    Animated.spring(scale, {
      toValue: 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();

    Animated.timing(opacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 800,
      delay: 500,
      useNativeDriver: true,
    }).start();

    const checkStatus = async () => {
      try {
        // Chờ ít nhất 2s để người dùng thấy animation logo
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const hasAcceptedTerms = await AsyncStorage.getItem('hasAcceptedTerms');
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        
        if (!hasAcceptedTerms) {
          navigation.replace('Terms');
          return;
        }

        if (!hasSeenOnboarding) {
          navigation.replace('Onboarding');
          return;
        }

        // Kiểm tra Firebase Auth thật
        // Timeout 5s nếu Firebase không phản hồi
        const timeout = setTimeout(() => {
          unsubscribe();
          navigation.replace('Auth');
        }, 5000);

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          clearTimeout(timeout);
          unsubscribe();
          
          if (user) {
            const token = await user.getIdToken();
            await AsyncStorage.setItem('userToken', token);
            
            const { status } = await Camera.getCameraPermissionsAsync();
            if (status === 'granted') {
              navigation.replace('MainTabs');
            } else {
              navigation.replace('Permission');
            }
          } else {
            await AsyncStorage.removeItem('userToken');
            navigation.replace('Auth');
          }
        });
      } catch (e) {
        navigation.replace('Auth');
      }
    };

    checkStatus();

  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View 
        style={[
          styles.logoContainer, 
          { 
            backgroundColor: colors.card, 
            shadowColor: colors.primary, 
            marginBottom: spacing.xl,
            opacity: opacity,
            transform: [{ scale: scale }]
          }
        ]}
      >
        <Ionicons name="restaurant" size={80} color={colors.primary} />
      </Animated.View>
      
      <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
        <Text style={[styles.title, typography.h1, { color: colors.primary }]}>Smart Cooking AI</Text>
        <Text style={[styles.slogan, typography.h3, { color: colors.textSecondary }]}>Nấu gì hôm nay? Để AI lo!</Text>
        
        <View style={[styles.spinnerContainer, { marginTop: spacing.xl }]}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
  },
  slogan: {
    fontWeight: 'normal',
  },
  spinnerContainer: {
  }
});
