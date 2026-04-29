import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');

const slides = [
  {
    id: 1,
    title: 'Quét nguyên liệu tức thì',
    description: 'Sử dụng AI thông minh để nhận diện ngay mọi thực phẩm có trong tủ lạnh của bạn chỉ với một bức ảnh.',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=800&auto=format&fit=crop',
    icon: 'scan'
  },
  {
    id: 2,
    title: 'Gợi ý thực đơn đa dạng',
    description: 'AI tự động tạo ra hàng ngàn công thức nấu ăn ngon miệng, đảm bảo bạn không bao giờ phải nghĩ "Hôm nay ăn gì?".',
    image: 'https://images.unsplash.com/photo-1495195129352-aeb325a55b65?q=80&w=800&auto=format&fit=crop',
    icon: 'restaurant'
  },
  {
    id: 3,
    title: 'Sống khỏe mỗi ngày',
    description: 'Kiểm soát lượng Calo và thời gian nấu nướng dễ dàng. Nấu ăn nhanh hơn, khỏe mạnh hơn.',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop',
    icon: 'fitness'
  }
];

export default function OnboardingScreen({ navigation }: Props) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    navigation.replace('Permission');
  };

  const slide = slides[currentSlide];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity style={styles.skipBtn} onPress={handleFinish}>
        <Text style={[typography.body, { color: colors.textSecondary }]}>Bỏ qua</Text>
      </TouchableOpacity>

      <View style={styles.imageContainer}>
        <Image source={{ uri: slide.image }} style={[styles.image, { borderRadius: borderRadius.xl }]} />
        <View style={[styles.iconWrapper, { backgroundColor: colors.card, shadowColor: colors.primary }]}>
          <Ionicons name={slide.icon as any} size={40} color={colors.primary} />
        </View>
      </View>

      <View style={[styles.contentContainer, { paddingHorizontal: spacing.xl }]}>
        <Text style={[typography.h1, { color: colors.text, textAlign: 'center', marginBottom: spacing.md }]}>{slide.title}</Text>
        <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', lineHeight: 24 }]}>{slide.description}</Text>
      </View>

      <View style={[styles.footer, { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl }]}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.dot, 
                { 
                  backgroundColor: currentSlide === index ? colors.primary : colors.border,
                  width: currentSlide === index ? 24 : 8
                }
              ]} 
            />
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.nextBtn, { backgroundColor: colors.primary, borderRadius: borderRadius.lg }]}
          onPress={handleNext}
        >
          <Text style={[typography.h3, { color: '#FFF' }]}>{currentSlide === slides.length - 1 ? 'Bắt đầu ngay' : 'Tiếp theo'}</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  imageContainer: {
    height: '50%',
    width: '100%',
    padding: 20,
    paddingTop: 80,
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  iconWrapper: {
    position: 'absolute',
    bottom: 0,
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 40,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  }
});
