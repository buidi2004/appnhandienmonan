import AlertManager, { CustomAlert } from '../components/CustomAlert';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Modal, Animated, Dimensions, Vibration,
  PanResponder, Linking, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import { useKeepAwake } from 'expo-keep-awake';
import { Accelerometer } from 'expo-sensors';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RealImage } from '../components/RealImage';
import AnimatedButton from '../components/AnimatedButton';
import { GlassCard } from '../components/ui/GlassCard';
import { themeColors, gradients, glass, glow } from '../theme';
import { borderWidth, borderRadius, borderColors, borderPresets } from '../theme/borders';


type Props = NativeStackScreenProps<RootStackParamList, 'CookingMode'>;
const { width } = Dimensions.get('window');

// --- Highlight Helper ---
const HIGHLIGHT_PATTERNS = [
  /\b(đun sôi|xào|chiên|nướng|hấp|luộc|trộn|khuấy|đảo|vắt|vớt|rửa|cắt|thái|băm|nghiền|ướp|nêm|chan|rắc|múc|đổ|cho vào|lấy ra|bắc lên|hạ lửa|tắt bếp|bật bếp|để nguội|rim|kho|ninh|om|rang)\b/gi,
  /\b(\d+\s*(phút|giây|giờ|tiếng))\b/gi,
  /\b(\d+\s*(°C|độ C|ml|lít|g|kg|gram|thìa|muỗng|chén|bát|cốc))\b/gi,
  /\b(mì|hành lá|tỏi|ớt|nước mắm|đường|muối|tiêu|dầu ăn|bơ|trứng|thịt|cá|tôm|mực|rau)\b/gi,
];

function highlightStepText(text: string, accentColor: string, textColor: string, scale: number) {
  const combined = new RegExp(HIGHLIGHT_PATTERNS.map(p => p.source).join('|'), 'gi');
  const parts: { text: string; highlight: boolean }[] = [];
  let lastIndex = 0;
  let match;
  combined.lastIndex = 0;
  while ((match = combined.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push({ text: text.slice(lastIndex, match.index), highlight: false });
    parts.push({ text: match[0], highlight: true });
    lastIndex = combined.lastIndex;
  }
  if (lastIndex < text.length) parts.push({ text: text.slice(lastIndex), highlight: false });
  if (parts.length === 0) return <Text style={[styles.stepText, { color: textColor, fontSize: 20 * scale, lineHeight: 28 * scale }]}>{text}</Text>;
  return (
    <Text style={[styles.stepText, { color: textColor, fontSize: 20 * scale, lineHeight: 28 * scale }]}>
      {parts.map((part, i) =>
        part.highlight
          ? <Text key={i} style={{ color: accentColor, fontWeight: '700' }}>{part.text}</Text>
          : <Text key={i}>{part.text}</Text>
      )}
    </Text>
  );
}

// --- Smart Timer: extract time from step text ---
function extractTimerSeconds(text: string): number | null {
  const match = text.match(/(\d+)\s*(phút|giây|giờ|tiếng)/i);
  if (!match) return null;
  const val = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  if (unit === 'giây') return val;
  if (unit === 'phút') return val * 60;
  if (unit === 'giờ' || unit === 'tiếng') return val * 3600;
  return null;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function CookingModeScreen({ route, navigation }: Props) {
  const { colors, typography } = useAppTheme();
  const { steps, dishName, ingredients, tips, dishImage } = route.params;

  useKeepAwake();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [progress] = useState(new Animated.Value(0));
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Smart Timer
  const [timerActive, setTimerActive] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartTime = useRef(Date.now());

  // Text Scaling
  const [textScale, setTextScale] = useState(1);

  // Modals
  const [showIngredients, setShowIngredients] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [showPhotoDiary, setShowPhotoDiary] = useState(false);

  // Photo Diary
  const [stepPhotos, setStepPhotos] = useState<Record<number, string[]>>({});

  // Portion Scaling
  const [portionMultiplier, setPortionMultiplier] = useState(1);

  // Shake Detection
  const [shakeEnabled, setShakeEnabled] = useState(true);
  const lastShakeTime = useRef(0);

  const detectedSeconds = useMemo(() => extractTimerSeconds(steps[currentStep]), [currentStep]);
  const highlightedCurrentStep = useMemo(
    () => highlightStepText(steps[currentStep], themeColors.purple, themeColors.textPrimary, textScale),
    [currentStep, themeColors.purple, themeColors.textPrimary, textScale]
  );

  // --- Swipe Gesture (fix: chỉ kích hoạt khi vuốt ngang rõ ràng, tránh conflict ScrollView) ---
  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 40 && Math.abs(gs.dy) < 30 && Math.abs(gs.vx) > 0.3,
    onPanResponderMove: (_, gs) => slideAnim.setValue(gs.dx),
    onPanResponderRelease: (_, gs) => {
      if (gs.dx < -80 && Math.abs(gs.vx) > 0.3) {
        Animated.timing(slideAnim, { toValue: -width, duration: 200, useNativeDriver: true }).start(() => {
          nextStepDirect();
          slideAnim.setValue(0);
        });
      } else if (gs.dx > 80 && Math.abs(gs.vx) > 0.3) {
        Animated.timing(slideAnim, { toValue: width, duration: 200, useNativeDriver: true }).start(() => {
          prevStepDirect();
          slideAnim.setValue(0);
        });
      } else {
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
      }
    },
  })).current;

  // --- Shake Detection (fix: threshold tăng 2.2 tránh false positive, loại bỏ currentStep khỏi deps) ---
  useEffect(() => {
    if (!shakeEnabled) return;
    const THRESHOLD = 2.2;
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const total = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();
      if (total > THRESHOLD && now - lastShakeTime.current > 1500) {
        lastShakeTime.current = now;
        Vibration.vibrate(100);
        nextStepDirect();
      }
    });
    Accelerometer.setUpdateInterval(150);
    return () => sub.remove();
  }, [shakeEnabled]);

  // Direct step changers (no dependency issues)
  const nextStepDirect = () => {
    setCurrentStep(prev => {
      if (prev < steps.length - 1) return prev + 1;
      return prev;
    });
  };
  const prevStepDirect = () => {
    setCurrentStep(prev => (prev > 0 ? prev - 1 : prev));
  };

  // --- Photo Diary ---
  const takeStepPhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: false });
    if (!result.canceled && result.assets[0]) {
      setStepPhotos(prev => ({
        ...prev,
        [currentStep]: [...(prev[currentStep] || []), result.assets[0].uri],
      }));
    }
  };

  // --- YouTube Quick Search (fix: rút gọn query tránh URL quá dài) ---
  const searchYouTube = () => {
    const stepSnippet = steps[currentStep].substring(0, 50).replace(/[.,!?]+$/, '');
    const query = encodeURIComponent(`cách ${stepSnippet} ${dishName}`);
    Linking.openURL(`https://www.youtube.com/results?search_query=${query}`);
  };

  // --- Portion Scaling ---
  const scaleIngredient = (text: string): string => {
    if (portionMultiplier === 1) return text;
    return text.replace(/(\d+([.,]\d+)?)\s*(g|kg|ml|lít|thìa|muỗng|chén|bát|cốc|quả|trái|củ|lát|miếng)/gi,
      (match, num) => {
        const scaled = (parseFloat(num.replace(',', '.')) * portionMultiplier).toFixed(1).replace(/\.0$/, '');
        return match.replace(num, scaled);
      }
    );
  };

  const totalPhotos = Object.values(stepPhotos).reduce((sum, arr) => sum + arr.length, 0);

  // --- Timer Logic ---
  const startTimer = useCallback((seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRemaining(seconds);
    setTimerActive(true);
    timerRef.current = setInterval(() => {
      setTimerRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setTimerActive(false);
          Vibration.vibrate([0, 500, 200, 500, 200, 500]);
          Speech.speak('Hết giờ rồi!', { language: 'vi-VN', rate: 0.9 });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setTimerActive(false);
    setTimerRemaining(0);
  }, []);

  useEffect(() => {
    speakCurrentStep();
    updateProgress();
    stopTimer();
    return () => { Speech.stop(); };
  }, [currentStep]);

  // Cleanup tất cả khi unmount
  useEffect(() => {
    return () => {
      Speech.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);


  useEffect(() => {
    if (isSpeaking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(0);
    }
  }, [isSpeaking]);

  const updateProgress = () => {
    Animated.timing(progress, {
      toValue: ((currentStep + 1) / steps.length) * width,
      duration: 500, useNativeDriver: false,
    }).start();
  };

  const speakCurrentStep = () => {
    Speech.stop();
    setIsSpeaking(true);
    Speech.speak(`Bước ${currentStep + 1}. ${steps[currentStep]}`, {
      language: 'vi-VN', pitch: 1.0, rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    else {
      stopTimer();
      Speech.stop();
      const cookingTimeSec = Math.floor((Date.now() - sessionStartTime.current) / 1000);
      navigation.replace('CookingComplete', {
        dishName,
        totalSteps: steps.length,
        cookingTime: cookingTimeSec,
        photosCount: totalPhotos,
        dishImage,
      });
    }
  };

  const prevStep = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); };

  const toggleSpeech = () => {
    if (isSpeaking) { Speech.stop(); setIsSpeaking(false); }
    else speakCurrentStep();
  };

  const cycleTextScale = () => {
    setTextScale(prev => {
      if (prev <= 0.85) return 1;
      if (prev <= 1) return 1.25;
      return 0.85;
    });
  };

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  const scaleLabel = textScale <= 0.85 ? 'Nhỏ' : textScale <= 1 ? 'Vừa' : 'Lớn';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bgPrimary }]}>
      {/* Ambient Orbs */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />
      <View style={styles.orb3} />
      
      {/* Header */}
      <View style={styles.header}>
        <AnimatedButton activeOpacity={0.7} onPress={() => {
          AlertManager.alert('Thoát chế độ nấu?', 'Timer và ảnh chụp sẽ bị mất.', [
            { text: 'Ở lại', style: 'cancel' },
            { text: 'Thoát', style: 'destructive', onPress: () => { stopTimer(); Speech.stop(); navigation.goBack(); } },
          ]);
        }} style={styles.closeBtn}>
          <Ionicons name="close" size={28} color={themeColors.textPrimary} />
        </AnimatedButton>
        <View style={styles.headerTitleBox}>
          <Text style={[typography.caption, { color: themeColors.purple, fontWeight: 'bold' }]}>CHẾ ĐỘ NẤU ĂN</Text>
          <Text style={[typography.h3, { color: themeColors.textPrimary }]} numberOfLines={1}>{dishName}</Text>
        </View>
        {/* Header Right Actions */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {/* Text Scale Button */}
          <AnimatedButton activeOpacity={0.7} onPress={cycleTextScale} style={styles.headerIconBtn}>
            <Ionicons name="text" size={20} color={themeColors.purple} />
            <Text style={{ fontSize: 8, color: themeColors.purple, fontWeight: 'bold' }}>{scaleLabel}</Text>
          </AnimatedButton>
        </View>
      </View>

      {/* Progress Badge & Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressBarContainer}>
          <View
            style={[styles.progressBar, { width: `${((currentStep + 1) / steps.length) * 100}%`, height: 2, backgroundColor: '#7F77DD' }]}
          />
        </View>
      </View>

      {/* Main Content - Swipeable */}
      <Animated.View style={[styles.content, { transform: [{ translateX: slideAnim }] }]} {...panResponder.panHandlers}>
        <View style={[styles.stepCard, { padding: 0 }]}>
          {/* Main Step Image from API or Dish Image */}
          <View style={styles.stepImageContainer}>
            <RealImage 
              query={dishName} 
              initialUri={dishImage} 
              style={styles.stepImage} 
            />
            <LinearGradient
              colors={['transparent', 'rgba(30, 10, 60, 0.95)']}
              style={styles.stepImageGradient}
            />
          </View>
          <ScrollView contentContainerStyle={[styles.stepScrollContent, { padding: 20, paddingTop: 10 }]} showsVerticalScrollIndicator={false}>
          {/* Main Step Image from API */}
          {/* Step Indicator */}
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 13, color: '#A89FFF', fontWeight: '600' }}>Bước {currentStep + 1} / {steps.length}</Text>
          </View>

          {highlightedCurrentStep}

          {/* Step Photo Thumbnails */}
          {stepPhotos[currentStep] && stepPhotos[currentStep].length > 0 && (
            <View style={styles.photoRow}>
              {stepPhotos[currentStep].map((uri, i) => (
                <Image key={i} source={{ uri }} style={styles.photoThumb} />
              ))}
            </View>
          )}

          {/* Smart Timer Button */}
          {detectedSeconds && !timerActive && (
            <View style={styles.timerRow}>
              <Ionicons name="timer-outline" size={20} color={themeColors.purple} />
              <Text style={[styles.timerRowText, { color: themeColors.textSecondary }]}>
                Phát hiện: {formatTime(detectedSeconds)}
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => startTimer(detectedSeconds)}
                style={styles.timerStartBtn}
              >
                <LinearGradient
                  colors={['#7c3aed', '#a855f7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.timerStartGradient}
                >
                  <Text style={styles.timerStartText}>Bắt đầu</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Active Timer Display */}
          {timerActive && (
            <View style={[styles.timerDisplay, { backgroundColor: timerRemaining <= 10 ? 'rgba(255,100,200,0.1)' : `${themeColors.purple}10`, borderColor: timerRemaining <= 10 ? themeColors.pink : themeColors.purple }]}>
              <Ionicons name="timer" size={24} color={timerRemaining <= 10 ? themeColors.pink : themeColors.purple} />
              <Text style={[styles.timerText, { color: timerRemaining <= 10 ? themeColors.pink : themeColors.purple }]}>
                {formatTime(timerRemaining)}
              </Text>
              <AnimatedButton activeOpacity={0.7} onPress={stopTimer} style={styles.timerStopBtn}>
                <Ionicons name="close-circle" size={28} color={themeColors.textSecondary} />
              </AnimatedButton>
            </View>
          )}

          {/* Next Step Preview */}
          {currentStep < steps.length - 1 && (
            <View style={styles.nextPreview}>
              <Text style={[styles.nextLabel, { color: themeColors.textSecondary }]}>TIẾP THEO:</Text>
              <Text style={[styles.nextText, { color: themeColors.textSecondary }]} numberOfLines={2}>
                {steps[currentStep + 1]}
              </Text>
            </View>
          )}
        </ScrollView>
        </View>
      </Animated.View>

      {/* Action Tabs */}
      <View style={styles.actionTabsContainer}>
        <View style={styles.quickBar}>
          <TouchableOpacity activeOpacity={0.75} style={styles.quickAction} onPress={() => setShowIngredients(true)}>
            <Ionicons name="list" size={20} color={showIngredients ? "#7F77DD" : "rgba(255,255,255,0.4)"} />
            <Text style={[styles.quickActionText, { color: showIngredients ? "#7F77DD" : "rgba(255,255,255,0.4)" }]}>Nguyên liệu</Text>
          </TouchableOpacity>
          
          <TouchableOpacity activeOpacity={0.75} style={styles.quickAction} onPress={searchYouTube}>
            <Ionicons name="logo-youtube" size={20} color="rgba(255,255,255,0.4)" />
            <Text style={[styles.quickActionText, { color: "rgba(255,255,255,0.4)" }]}>Video</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.75} style={styles.quickAction} onPress={takeStepPhoto}>
            <Ionicons name="camera" size={20} color="rgba(255,255,255,0.4)" />
            <Text style={[styles.quickActionText, { color: "rgba(255,255,255,0.4)" }]}>Chụp</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Step Navigator - Fixed UI */}
      <View style={styles.stepNavigator}>
        <TouchableOpacity 
          activeOpacity={0.75} 
          onPress={prevStep} 
          disabled={currentStep === 0}
          style={[styles.navBtn, currentStep === 0 && { opacity: 0.3 }]}
        >
          <Ionicons name="arrow-back" size={20} color="#E0DEFF" />
          <Text style={styles.navLabel}>Bước trước</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={toggleSpeech} 
          style={styles.voiceBtn}
        >
          <Ionicons name={isSpeaking ? "pause" : "volume-high"} size={24} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.75} 
          onPress={nextStep} 
          style={[styles.navBtn, currentStep === steps.length - 1 ? styles.completeBtn : {}]}
        >
          <Text style={[styles.navLabel, currentStep === steps.length - 1 ? { color: '#FFF' } : {}]}>
            {currentStep === steps.length - 1 ? 'Hoàn thành' : 'Bước tiếp'}
          </Text>
          <Ionicons 
            name={currentStep === steps.length - 1 ? "checkmark-circle" : "arrow-forward"} 
            size={20} 
            color={currentStep === steps.length - 1 ? "#FFF" : "#E0DEFF"} 
          />
        </TouchableOpacity>
      </View>

      {/* Footer Indicators */}
      <View style={styles.footer}>
        <AnimatedButton onPress={() => setShakeEnabled(!shakeEnabled)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name={shakeEnabled ? 'phone-portrait' : 'phone-portrait-outline'} size={12} color={shakeEnabled ? themeColors.purple : themeColors.textSecondary} />
          <Text style={{ fontSize: 10, color: shakeEnabled ? themeColors.purple : themeColors.textSecondary }}>Lắc: {shakeEnabled ? 'BẬT' : 'TẮT'}</Text>
        </AnimatedButton>
        <Text style={{ fontSize: 10, color: themeColors.textSecondary, marginLeft: 16 }}>Vuốt trái/phải để chuyển bước</Text>
      </View>

      {/* Ingredients Modal with Portion Scaling */}
      <Modal visible={showIngredients} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.bottomSheet, { ...borderPresets.cardPurple, borderBottomWidth: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, backgroundColor: themeColors.bgBottomNav }]}>
            <View style={[styles.sheetHandle, { backgroundColor: themeColors.borderCard }]} />
            <View style={styles.sheetHeader}>
              <Text style={[typography.h2, { color: themeColors.textPrimary }]}>Nguyên liệu</Text>
              <AnimatedButton activeOpacity={0.7} onPress={() => setShowIngredients(false)}>
                <Ionicons name="close-circle" size={30} color={themeColors.textSecondary} />
              </AnimatedButton>
            </View>
            {/* Portion Scaling Controls */}
            <View style={[styles.portionRow, { borderColor: themeColors.borderCard }]}>
              <Text style={[typography.caption, { color: themeColors.textSecondary }]}>Khẩu phần:</Text>
              {[0.5, 1, 2, 3].map(m => (
                <AnimatedButton key={m} activeOpacity={0.7} onPress={() => setPortionMultiplier(m)}
                  style={[styles.portionBtn, { backgroundColor: portionMultiplier === m ? themeColors.purple : `${themeColors.purple}15` }]}>
                  <Text style={{ color: portionMultiplier === m ? themeColors.textPrimary : themeColors.purple, fontWeight: 'bold', fontSize: 13 }}>x{m}</Text>
                </AnimatedButton>
              ))}
            </View>
            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {(ingredients || []).map((ing: string, i: number) => (
                <View key={i} style={[styles.ingredientRow, { borderBottomColor: themeColors.borderCard }]}>
                  <View style={[styles.ingredientDot, { backgroundColor: themeColors.purple }]} />
                  <Text style={[typography.body, { color: themeColors.textPrimary, flex: 1 }]}>{scaleIngredient(ing)}</Text>
                  {portionMultiplier !== 1 && <Text style={{ fontSize: 11, color: themeColors.textSecondary }}>x{portionMultiplier}</Text>}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Tips Modal (fix: overlay có thể nhấn để đóng, card dùng layout thường thay vì absolute) */}
      <Modal visible={showTips} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setShowTips(false)} style={styles.tipsOverlay}>
          <TouchableOpacity activeOpacity={1} style={[styles.tipsCard, { ...glass.card, backgroundColor: themeColors.bgBottomNav }]}>
            <View style={[styles.tipsIconBg, { backgroundColor: `${themeColors.purple}15` }]}>
              <Ionicons name="bulb" size={32} color={themeColors.purple} />
            </View>
            <Text style={[typography.h3, { color: themeColors.textPrimary, marginTop: 16, marginBottom: 12, textAlign: 'center' }]}>Mẹo nấu ăn</Text>
            <Text style={[typography.body, { color: themeColors.textSecondary, lineHeight: 24, textAlign: 'center' }]}>{tips}</Text>
            <AnimatedButton
              activeOpacity={0.7}
              style={[styles.tipsCloseBtn, { backgroundColor: themeColors.purple, ...glow.button, shadowColor: themeColors.purple }]}
              onPress={() => setShowTips(false)}
            >
              <Text style={{ color: themeColors.textPrimary, fontWeight: 'bold', fontSize: 16 }}>Xong</Text>
            </AnimatedButton>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Photo Diary Modal */}
      <Modal visible={showPhotoDiary} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.bottomSheet, { ...borderPresets.cardPurple, borderBottomWidth: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, backgroundColor: themeColors.bgBottomNav }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={[typography.h2, { color: themeColors.textPrimary }]}>Nhật ký nấu ăn</Text>
              <AnimatedButton activeOpacity={0.7} onPress={() => setShowPhotoDiary(false)}>
                <Ionicons name="close-circle" size={30} color={themeColors.textSecondary} />
              </AnimatedButton>
            </View>
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              {steps.map((step: string, si: number) => (
                <View key={si}>
                  <Text style={[typography.caption, { color: themeColors.textSecondary, fontWeight: 'bold', marginTop: 12 }]}>Bước {si + 1}</Text>
                  {stepPhotos[si] && stepPhotos[si].length > 0 ? (
                    <View style={styles.photoRow}>
                      {stepPhotos[si].map((uri, pi) => (
                        <Image key={pi} source={{ uri }} style={styles.diaryPhoto} />
                      ))}
                    </View>
                  ) : (
                    <Text style={{ color: themeColors.borderCard, fontSize: 13, fontStyle: 'italic' }}>Chưa có ảnh</Text>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <CustomAlert />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  // Ambient Orbs
  orb1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(130,40,255,0.18)',
    top: -60,
    left: -60,
    zIndex: 0,
  },
  orb2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(200,40,220,0.14)',
    top: 100,
    right: -50,
    zIndex: 0,
  },
  orb3: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(110,30,220,0.10)',
    top: '55%',
    left: -40,
    zIndex: 0,
  },
  
  header: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(30, 10, 60, 0.8)',
    borderBottomWidth: borderWidth.thin,
    borderBottomColor: borderColors.purple.subtle,
  },
  headerTitleBox: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
  closeBtn: {
    padding: 8,
    backgroundColor: 'rgba(30, 10, 60, 0.8)',
    ...borderPresets.button,
  },
  headerIconBtn: { alignItems: 'center', justifyContent: 'center', width: 40 },
  
  // Progress Section
  progressSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  stepBadge: {
    alignSelf: 'center',
    ...borderPresets.chip,
    backgroundColor: 'rgba(168,85,247,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
  },
  stepBadgeText: {
    color: '#d8b4fe',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  progressBarContainer: {
    height: 4,
    width: '100%',
    backgroundColor: 'rgba(30, 10, 60, 0.8)',
    borderRadius: borderRadius.xs,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: borderRadius.xs,
  },
  
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 10, zIndex: 1 },
  
  // Step Card
  stepCard: {
    flex: 1,
    backgroundColor: 'rgba(30, 10, 60, 0.8)',
    ...borderPresets.cardPurple,
    shadowColor: '#a855f7',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
    overflow: 'hidden',
  },
  
  stepImageContainer: { height: 180, width: '100%', position: 'relative' },
  stepImage: { width: '100%', height: '100%' },
  stepImageGradient: { ...StyleSheet.absoluteFillObject },
  
  stepScrollContent: { flexGrow: 1, justifyContent: 'center', paddingBottom: 10 },
  stepText: { fontWeight: '700', textAlign: 'center' },
  
  // Timer Row
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...borderPresets.cardPurple,
    padding: 12,
    marginTop: 20,
    gap: 10,
  },
  timerRowText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  timerStartBtn: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#a855f7',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  timerStartGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  timerStartText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  
  timerDisplay: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, paddingHorizontal: 20, borderRadius: borderRadius.xl,
    borderWidth: borderWidth.heavy, marginTop: 24, gap: 12,
  },
  timerText: { fontSize: 36, fontWeight: '900', fontVariant: ['tabular-nums'] },
  timerStopBtn: { marginLeft: 8 },
  
  // Next preview
  nextPreview: { marginTop: 40, alignItems: 'center', opacity: 0.4 },
  nextLabel: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 14 },
  nextText: { fontSize: 16, textAlign: 'center', fontStyle: 'italic', paddingHorizontal: 20, lineHeight: 24 },
  
  actionTabsContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  quickBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  quickAction: {
    alignItems: 'center',
    gap: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },

  // Step Navigator
  stepNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1A0B3B',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 10, 60, 0.8)',
    gap: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  completeBtn: {
    backgroundColor: '#10b981',
  },
  navLabel: {
    color: '#E0DEFF',
    fontSize: 14,
    fontWeight: '600',
  },
  voiceBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#7F77DD',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7F77DD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  
  footer: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingBottom: 20,
  },
  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    borderTopLeftRadius: borderRadius['3xl'], borderTopRightRadius: borderRadius['3xl'],
    padding: 24, paddingBottom: 40,
  },
  sheetHandle: {
    width: 40, height: 5, borderRadius: borderRadius.xs,
    alignSelf: 'center', marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  ingredientRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: borderWidth.normal, gap: 12,
  },
  ingredientDot: { width: 8, height: 8, borderRadius: borderRadius.xs },
  tipsOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  tipsCard: {
    width: '100%', 
    padding: 30, 
    alignItems: 'center',
    backgroundColor: 'rgba(30, 10, 60, 0.95)',
    ...borderPresets.cardPurple,
    shadowColor: '#a855f7',
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
  },
  tipsIconBg: {
    width: 64, height: 64, borderRadius: borderRadius.full,
    justifyContent: 'center', alignItems: 'center',
  },
  tipsCloseBtn: {
    marginTop: 24, paddingVertical: 14, paddingHorizontal: 40,
    borderRadius: borderRadius['2xl'],
  },
  // Photos
  photoRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16,
  },
  photoThumb: {
    width: 56, height: 56, borderRadius: borderRadius.md,
  },
  diaryPhoto: {
    width: 80, height: 80, borderRadius: borderRadius.md,
  },
  // Portion Scaling
  portionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, marginBottom: 12,
    borderBottomWidth: borderWidth.normal,
  },
  portionBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: borderRadius.lg,
  },
});


