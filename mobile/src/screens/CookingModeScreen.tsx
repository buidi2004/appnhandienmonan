import AlertManager, { CustomAlert } from '../components/CustomAlert';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ScrollView, Modal, Animated, Dimensions, Vibration,
  PanResponder, Linking, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useKeepAwake } from 'expo-keep-awake';
import { Accelerometer } from 'expo-sensors';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RealImage } from '../components/RealImage';
import AnimatedButton from '../components/AnimatedButton';
import GlassCard from '../components/GlassCard';

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
  if (parts.length === 0) return <Text style={[styles.stepText, { color: textColor, fontSize: 24 * scale, lineHeight: 34 * scale }]}>{text}</Text>;
  return (
    <Text style={[styles.stepText, { color: textColor, fontSize: 24 * scale, lineHeight: 34 * scale }]}>
      {parts.map((part, i) =>
        part.highlight
          ? <Text key={i} style={{ color: accentColor, fontWeight: '900' }}>{part.text}</Text>
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
  const { steps, dishName, ingredients, tips } = route.params;

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
    () => highlightStepText(steps[currentStep], colors.primary, colors.text, textScale),
    [currentStep, colors.primary, colors.text, textScale]
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <AnimatedButton activeOpacity={0.7} onPress={() => {
          AlertManager.alert('Thoát chế độ nấu?', 'Timer và ảnh chụp sẽ bị mất.', [
            { text: 'Ở lại', style: 'cancel' },
            { text: 'Thoát', style: 'destructive', onPress: () => { stopTimer(); Speech.stop(); navigation.goBack(); } },
          ]);
        }} style={styles.closeBtn}>
          <Ionicons name="close" size={28} color={colors.text} />
        </AnimatedButton>
        <View style={styles.headerTitleBox}>
          <Text style={[typography.caption, { color: colors.primary, fontWeight: 'bold' }]}>CHẾ ĐỘ NẤU ĂN</Text>
          <Text style={[typography.h3, { color: colors.text }]} numberOfLines={1}>{dishName}</Text>
        </View>
        {/* Header Right Actions */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {/* Text Scale Button */}
          <AnimatedButton activeOpacity={0.7} onPress={cycleTextScale} style={styles.headerIconBtn}>
            <Ionicons name="text" size={20} color={colors.primary} />
            <Text style={{ fontSize: 8, color: colors.primary, fontWeight: 'bold' }}>{scaleLabel}</Text>
          </AnimatedButton>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
        <Animated.View style={[styles.progressBar, { width: progress, backgroundColor: colors.primary }]} />
      </View>

      {/* Step Dots */}
      <View style={styles.stepDotsRow}>
        {steps.map((_, i) => (
          <View key={i} style={[styles.stepDot, {
            backgroundColor: i <= currentStep ? colors.primary : colors.border,
            width: i === currentStep ? 20 : 8,
          }]} />
        ))}
      </View>

      {/* Main Content - Swipeable */}
      <Animated.View style={[styles.content, { transform: [{ translateX: slideAnim }] }]} {...panResponder.panHandlers}>
        <Text style={[styles.stepNumber, { color: colors.primary }]}>BƯỚC {currentStep + 1} / {steps.length}</Text>

        <ScrollView contentContainerStyle={styles.stepScrollContent} showsVerticalScrollIndicator={false}>
          {/* Main Step Image from API */}
          <RealImage 
            query={`${dishName} ${steps[currentStep].substring(0, 30)}`}
            isStep={true}
            style={{ width: '100%', height: 200, borderRadius: 12, marginBottom: 16 }} 
          />

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
            <AnimatedButton
              activeOpacity={0.7}
              style={[styles.smartTimerBtn, { backgroundColor: `${colors.primary}15`, borderColor: colors.primary }]}
              onPress={() => startTimer(detectedSeconds)}
            >
              <Ionicons name="timer" size={22} color={colors.primary} />
              <Text style={[styles.smartTimerText, { color: colors.primary }]}>
                Bắt đầu đếm ngược {formatTime(detectedSeconds)}
              </Text>
            </AnimatedButton>
          )}

          {/* Active Timer Display */}
          {timerActive && (
            <View style={[styles.timerDisplay, { backgroundColor: timerRemaining <= 10 ? '#FF3B3015' : `${colors.primary}10`, borderColor: timerRemaining <= 10 ? '#FF3B30' : colors.primary }]}>
              <Ionicons name="timer" size={24} color={timerRemaining <= 10 ? '#FF3B30' : colors.primary} />
              <Text style={[styles.timerText, { color: timerRemaining <= 10 ? '#FF3B30' : colors.primary }]}>
                {formatTime(timerRemaining)}
              </Text>
              <AnimatedButton activeOpacity={0.7} onPress={stopTimer} style={styles.timerStopBtn}>
                <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
              </AnimatedButton>
            </View>
          )}

          {/* Next Step Preview */}
          {currentStep < steps.length - 1 && (
            <View style={styles.nextPreview}>
              <Text style={[styles.nextLabel, { color: colors.textSecondary }]}>TIẾP THEO:</Text>
              <Text style={[styles.nextText, { color: colors.textSecondary }]} numberOfLines={2}>
                {steps[currentStep + 1]}
              </Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {/* Contextual Quick Action Bar (fix: ScrollView ngang tránh tràn) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.quickBar, { borderTopColor: colors.border }]} style={{ flexGrow: 0, borderTopWidth: 1, borderTopColor: colors.border }}>
        {ingredients && ingredients.length > 0 && (
          <AnimatedButton activeOpacity={0.7} style={[styles.quickAction, { backgroundColor: `${colors.success}12` }]} onPress={() => setShowIngredients(true)}>
            <Ionicons name="list" size={18} color={colors.success} />
            <Text style={[styles.quickActionText, { color: colors.success }]}>Nguyên liệu</Text>
          </AnimatedButton>
        )}
        <AnimatedButton activeOpacity={0.7} style={[styles.quickAction, { backgroundColor: '#FF000012' }]} onPress={searchYouTube}>
          <Ionicons name="logo-youtube" size={18} color="#FF0000" />
          <Text style={[styles.quickActionText, { color: '#FF0000' }]}>Video</Text>
        </AnimatedButton>
        <AnimatedButton activeOpacity={0.7} style={[styles.quickAction, { backgroundColor: `${colors.primary}12` }]} onPress={takeStepPhoto}>
          <Ionicons name="camera" size={18} color={colors.primary} />
          <Text style={[styles.quickActionText, { color: colors.primary }]}>{totalPhotos > 0 ? `${totalPhotos} ảnh` : 'Chụp'}</Text>
        </AnimatedButton>
        {totalPhotos > 0 && (
          <AnimatedButton activeOpacity={0.7} style={[styles.quickAction, { backgroundColor: `${colors.textSecondary}12` }]} onPress={() => setShowPhotoDiary(true)}>
            <Ionicons name="images" size={18} color={colors.textSecondary} />
            <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>Nhật ký</Text>
          </AnimatedButton>
        )}
        {!!tips && (
          <AnimatedButton activeOpacity={0.7} style={[styles.quickAction, { backgroundColor: `${colors.primary}12` }]} onPress={() => setShowTips(true)}>
            <Ionicons name="bulb" size={18} color={colors.primary} />
            <Text style={[styles.quickActionText, { color: colors.primary }]}>Mẹo</Text>
          </AnimatedButton>
        )}
      </ScrollView>

      {/* Controls */}
      <View style={styles.controls}>
        <AnimatedButton activeOpacity={0.7} onPress={prevStep} style={[styles.smallControl, { opacity: currentStep === 0 ? 0.2 : 1 }]} disabled={currentStep === 0}>
          <Ionicons name="play-back" size={32} color={colors.text} />
        </AnimatedButton>

        <View style={styles.mainControlWrapper}>
          {isSpeaking && (
            <Animated.View style={[styles.pulseRing, { backgroundColor: colors.primary, transform: [{ scale: pulseScale }], opacity: pulseOpacity }]} />
          )}
          <AnimatedButton activeOpacity={0.8} onPress={toggleSpeech} style={[styles.mainControl, { backgroundColor: colors.primary }]}>
            <Ionicons name={isSpeaking ? "pause" : "volume-high"} size={40} color="#FFF" />
          </AnimatedButton>
        </View>

        <AnimatedButton activeOpacity={0.7} onPress={nextStep} style={styles.smallControl}>
          <Ionicons name="play-forward" size={32} color={colors.text} />
        </AnimatedButton>
      </View>

      {/* Footer Indicators */}
      <View style={styles.footer}>
        <AnimatedButton onPress={() => setShakeEnabled(!shakeEnabled)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name={shakeEnabled ? 'phone-portrait' : 'phone-portrait-outline'} size={12} color={shakeEnabled ? colors.primary : colors.textSecondary} />
          <Text style={{ fontSize: 10, color: shakeEnabled ? colors.primary : colors.textSecondary }}>Lắc: {shakeEnabled ? 'BẬT' : 'TẮT'}</Text>
        </AnimatedButton>
        <Text style={{ fontSize: 10, color: colors.textSecondary, marginLeft: 16 }}>Vuốt trái/phải để chuyển bước</Text>
      </View>

      {/* Ingredients Modal with Portion Scaling */}
      <Modal visible={showIngredients} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.bottomSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <View style={styles.sheetHeader}>
              <Text style={[typography.h2, { color: colors.text }]}>Nguyên liệu</Text>
              <AnimatedButton activeOpacity={0.7} onPress={() => setShowIngredients(false)}>
                <Ionicons name="close-circle" size={30} color={colors.textSecondary} />
              </AnimatedButton>
            </View>
            {/* Portion Scaling Controls */}
            <View style={[styles.portionRow, { borderColor: colors.border }]}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>Khẩu phần:</Text>
              {[0.5, 1, 2, 3].map(m => (
                <AnimatedButton key={m} activeOpacity={0.7} onPress={() => setPortionMultiplier(m)}
                  style={[styles.portionBtn, { backgroundColor: portionMultiplier === m ? colors.primary : `${colors.primary}15` }]}>
                  <Text style={{ color: portionMultiplier === m ? '#FFF' : colors.primary, fontWeight: 'bold', fontSize: 13 }}>x{m}</Text>
                </AnimatedButton>
              ))}
            </View>
            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              {(ingredients || []).map((ing, i) => (
                <View key={i} style={[styles.ingredientRow, { borderBottomColor: colors.border }]}>
                  <View style={[styles.ingredientDot, { backgroundColor: colors.primary }]} />
                  <Text style={[typography.body, { color: colors.text, flex: 1 }]}>{scaleIngredient(ing)}</Text>
                  {portionMultiplier !== 1 && <Text style={{ fontSize: 11, color: colors.textSecondary }}>x{portionMultiplier}</Text>}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Tips Modal (fix: overlay có thể nhấn để đóng, card dùng layout thường thay vì absolute) */}
      <Modal visible={showTips} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setShowTips(false)} style={styles.tipsOverlay}>
          <TouchableOpacity activeOpacity={1} style={[styles.tipsCard, { backgroundColor: colors.card }]}>
            <View style={[styles.tipsIconBg, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="bulb" size={32} color={colors.primary} />
            </View>
            <Text style={[typography.h3, { color: colors.text, marginTop: 16, marginBottom: 12, textAlign: 'center' }]}>Mẹo nấu ăn</Text>
            <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 24, textAlign: 'center' }]}>{tips}</Text>
            <AnimatedButton
              activeOpacity={0.7}
              style={[styles.tipsCloseBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowTips(false)}
            >
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Xong</Text>
            </AnimatedButton>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Photo Diary Modal */}
      <Modal visible={showPhotoDiary} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.bottomSheet, { backgroundColor: colors.card }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={[typography.h2, { color: colors.text }]}>Nhật ký nấu ăn</Text>
              <AnimatedButton activeOpacity={0.7} onPress={() => setShowPhotoDiary(false)}>
                <Ionicons name="close-circle" size={30} color={colors.textSecondary} />
              </AnimatedButton>
            </View>
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              {steps.map((step, si) => (
                <View key={si}>
                  <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: 'bold', marginTop: 12 }]}>Bước {si + 1}</Text>
                  {stepPhotos[si] && stepPhotos[si].length > 0 ? (
                    <View style={styles.photoRow}>
                      {stepPhotos[si].map((uri, pi) => (
                        <Image key={pi} source={{ uri }} style={styles.diaryPhoto} />
                      ))}
                    </View>
                  ) : (
                    <Text style={{ color: colors.border, fontSize: 13, fontStyle: 'italic' }}>Chưa có ảnh</Text>
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
  header: {
    height: 70, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20,
  },
  headerTitleBox: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
  closeBtn: { padding: 4 },
  headerIconBtn: { alignItems: 'center', justifyContent: 'center', width: 40 },
  progressBarContainer: { height: 4, width: '100%' },
  progressBar: { height: '100%' },
  stepDotsRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 10, gap: 6,
  },
  stepDot: { height: 8, borderRadius: 4 },
  content: { flex: 1, paddingHorizontal: 30, paddingTop: 10 },
  stepNumber: { fontSize: 14, fontWeight: '900', letterSpacing: 2, marginBottom: 16, textAlign: 'center' },
  stepScrollContent: { flexGrow: 1, justifyContent: 'center', paddingBottom: 10 },
  stepText: { fontWeight: '700', textAlign: 'center' },
  // Smart Timer
  smartTimerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, paddingHorizontal: 20, borderRadius: 16,
    borderWidth: 1.5, borderStyle: 'dashed', marginTop: 24, gap: 10,
  },
  smartTimerText: { fontSize: 16, fontWeight: '700' },
  timerDisplay: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, paddingHorizontal: 20, borderRadius: 20,
    borderWidth: 2, marginTop: 24, gap: 12,
  },
  timerText: { fontSize: 36, fontWeight: '900', fontVariant: ['tabular-nums'] },
  timerStopBtn: { marginLeft: 8 },
  // Next preview
  nextPreview: { marginTop: 40, alignItems: 'center', opacity: 0.4 },
  nextLabel: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1.5, marginBottom: 14 },
  nextText: { fontSize: 16, textAlign: 'center', fontStyle: 'italic', paddingHorizontal: 20, lineHeight: 24 },
  // Quick Action Bar
  quickBar: {
    flexDirection: 'row', justifyContent: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 16,
  },
  quickAction: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
    paddingHorizontal: 14, borderRadius: 20, gap: 6,
  },
  quickActionText: { fontSize: 13, fontWeight: '600' },
  // Controls
  controls: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-evenly', paddingVertical: 20,
  },
  mainControlWrapper: {
    width: 100, height: 100, justifyContent: 'center',
    alignItems: 'center', position: 'relative',
  },
  pulseRing: { position: 'absolute', width: 100, height: 100, borderRadius: 50 },
  mainControl: {
    width: 90, height: 90, borderRadius: 45,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#FF9500', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 10, zIndex: 2,
  },
  smallControl: {
    width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
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
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
  },
  sheetHandle: {
    width: 40, height: 5, borderRadius: 3,
    alignSelf: 'center', marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  ingredientRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, gap: 12,
  },
  ingredientDot: { width: 8, height: 8, borderRadius: 4 },
  tipsOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  tipsCard: {
    width: '100%', borderRadius: 28, padding: 30, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15, shadowRadius: 30, elevation: 20,
  },
  tipsIconBg: {
    width: 64, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center',
  },
  tipsCloseBtn: {
    marginTop: 24, paddingVertical: 14, paddingHorizontal: 40,
    borderRadius: 25,
  },
  // Photos
  photoRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16,
  },
  photoThumb: {
    width: 56, height: 56, borderRadius: 12,
  },
  diaryPhoto: {
    width: 80, height: 80, borderRadius: 12,
  },
  // Portion Scaling
  portionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, marginBottom: 12,
    borderBottomWidth: 1,
  },
  portionBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
  },
});


