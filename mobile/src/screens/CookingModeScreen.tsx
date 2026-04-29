import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  Modal,
  Animated,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

type Props = NativeStackScreenProps<RootStackParamList, 'CookingMode'>;

const { width, height } = Dimensions.get('window');

export default function CookingModeScreen({ route, navigation }: Props) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();
  const { steps, dishName } = route.params;
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [progress] = useState(new Animated.Value(0));
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    speakCurrentStep();
    updateProgress();
    
    return () => {
      Speech.stop();
    };
  }, [currentStep]);

  useEffect(() => {
    if (isSpeaking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(0);
    }
  }, [isSpeaking]);

  const updateProgress = () => {
    const targetProgress = ((currentStep + 1) / steps.length) * width;
    Animated.timing(progress, {
      toValue: targetProgress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  };

  const speakCurrentStep = () => {
    Speech.stop();
    setIsSpeaking(true);
    Speech.speak(`Bước ${currentStep + 1}. ${steps[currentStep]}`, {
      language: 'vi-VN',
      pitch: 1.0,
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      Alert.alert('Hoàn thành!', 'Chúc mừng bạn đã hoàn thành món ăn này! 🎉', [
        { text: 'Kết thúc', onPress: () => navigation.goBack() }
      ]);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      speakCurrentStep();
    }
  };

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.4]
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0]
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={[typography.caption, { color: colors.primary, fontWeight: 'bold' }]}>CHẾ ĐỘ NẤU ĂN</Text>
          <Text style={[typography.h3, { color: colors.text }]} numberOfLines={1}>{dishName}</Text>
        </View>
        <TouchableOpacity onPress={() => Alert.alert('Hẹn giờ', 'Tính năng Timer đang được tích hợp...')}>
          <Ionicons name="timer-outline" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
        <Animated.View style={[styles.progressBar, { width: progress, backgroundColor: colors.primary }]} />
      </View>

      {/* Immersive Content */}
      <View style={styles.content}>
        <Text style={[styles.stepNumber, { color: colors.primary }]}>BƯỚC {currentStep + 1} / {steps.length}</Text>
        
        <View style={styles.stepFocusArea}>
          <Text style={[styles.stepText, { color: colors.text }]}>
            {steps[currentStep]}
          </Text>
          
          {currentStep < steps.length - 1 && (
            <View style={styles.nextPreview}>
              <Text style={[styles.nextLabel, { color: colors.textSecondary }]}>TIẾP THEO:</Text>
              <Text style={[styles.nextText, { color: colors.textSecondary }]} numberOfLines={2}>
                {steps[currentStep + 1]}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity 
          onPress={prevStep} 
          style={[styles.smallControl, { opacity: currentStep === 0 ? 0.2 : 1 }]}
          disabled={currentStep === 0}
        >
          <Ionicons name="play-back" size={32} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.mainControlWrapper}>
          {isSpeaking && (
            <Animated.View 
              style={[
                styles.pulseRing, 
                { 
                  backgroundColor: colors.primary,
                  transform: [{ scale: pulseScale }],
                  opacity: pulseOpacity
                }
              ]} 
            />
          )}
          <TouchableOpacity 
            onPress={toggleSpeech} 
            style={[styles.mainControl, { backgroundColor: colors.primary }]}
          >
            <Ionicons name={isSpeaking ? "pause" : "volume-high"} size={40} color="#FFF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          onPress={nextStep} 
          style={styles.smallControl}
        >
          <Ionicons name="play-forward" size={32} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Immersive Visual Footer */}
      <View style={styles.footer}>
        <View style={[styles.audioWave, { backgroundColor: isSpeaking ? colors.primary : colors.border }]} />
        <View style={[styles.audioWave, { height: 24, backgroundColor: isSpeaking ? colors.primary : colors.border, marginHorizontal: 8 }]} />
        <View style={[styles.audioWave, { backgroundColor: isSpeaking ? colors.primary : colors.border }]} />
      </View>

      {/* Custom Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.successModal, { backgroundColor: '#1A1A1A' }]}>
            <TouchableOpacity style={styles.heartIcon}>
              <Ionicons name="heart" size={24} color={colors.error} />
              <Text style={styles.heartText}>Lưu vào món ruột</Text>
            </TouchableOpacity>

            <View style={styles.successIconContainer}>
              <View style={[styles.successIconBg, { backgroundColor: colors.primary }]}>
                <Ionicons name="restaurant" size={50} color="#FFF" />
              </View>
              {/* Giả lập confetti đơn giản */}
              <View style={[styles.dot, { top: -20, left: -20, backgroundColor: colors.primary }]} />
              <View style={[styles.dot, { top: -30, right: 10, backgroundColor: '#FFD700' }]} />
              <View style={[styles.dot, { bottom: 10, left: -40, backgroundColor: '#FF4500' }]} />
            </View>

            <Text style={[styles.successTitle, { color: '#FFF' }]}>Tuyệt vời quá Dĩ ơi! Xuất sắc!</Text>
            <Text style={[styles.successDesc, { color: 'rgba(255,255,255,0.7)' }]}>
              Bạn đã hoàn thành món <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{dishName}</Text>. Đây là món ăn thứ 13 bạn nấu thành công!
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.primaryAction, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setShowSuccess(false);
                  navigation.navigate('MainTabs'); // Hoặc mở camera
                }}
              >
                <Ionicons name="camera" size={20} color="#FFF" />
                <Text style={styles.primaryActionText}>📸 Chụp ảnh khoe thành quả</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.secondaryAction}
                onPress={() => {
                  setShowSuccess(false);
                  navigation.navigate('MainTabs');
                }}
              >
                <Text style={[styles.secondaryActionText, { color: 'rgba(255,255,255,0.5)' }]}>Quay về Trang chủ</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    height: 70, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerTitleBox: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
  closeBtn: { padding: 4 },
  progressBarContainer: { height: 4, width: '100%' },
  progressBar: { height: '100%' },
  content: { flex: 1, padding: 30, justifyContent: 'center' },
  stepNumber: { fontSize: 14, fontWeight: '900', letterSpacing: 2, marginBottom: 30, textAlign: 'center' },
  stepFocusArea: { flex: 1, justifyContent: 'center' },
  stepText: { fontSize: 38, fontWeight: '800', textAlign: 'center', lineHeight: 52 },
  nextPreview: { marginTop: 60, alignItems: 'center', opacity: 0.4 },
  nextLabel: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  nextText: { fontSize: 18, textAlign: 'center', fontStyle: 'italic', paddingHorizontal: 20 },
  controls: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-evenly',
    paddingVertical: 50,
  },
  mainControlWrapper: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  mainControl: { 
    width: 90, 
    height: 90, 
    borderRadius: 45, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 2,
  },
  smallControl: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  footer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingBottom: 40 
  },
  audioWave: {
    width: 4,
    height: 16,
    borderRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  successModal: {
    width: '100%',
    padding: 30,
    borderRadius: 32,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  heartIcon: {
    position: 'absolute',
    top: 20,
    right: 20,
    alignItems: 'center'
  },
  heartText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2
  },
  successIconContainer: {
    marginVertical: 30,
    position: 'relative'
  },
  successIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12
  },
  successDesc: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 10
  },
  modalActions: {
    width: '100%',
    gap: 12
  },
  primaryAction: {
    flexDirection: 'row',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  primaryActionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10
  },
  secondaryAction: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center'
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '500'
  },
  dot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5
  }
});
