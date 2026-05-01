import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = NativeStackScreenProps<RootStackParamList, 'CookingComplete'>;
const { width } = Dimensions.get('window');

const CONFETTI_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFD93D', '#6C5CE7', '#FF9FF3'];

interface AchievementUnlock {
  icon: string;
  title: string;
  color: string;
}

export default function CookingCompleteScreen({ route, navigation }: Props) {
  const { colors, typography } = useAppTheme();
  const { dishName, totalSteps, cookingTime, photosCount } = route.params;

  const [totalCooked, setTotalCooked] = useState(0);
  const [newAchievement, setNewAchievement] = useState<AchievementUnlock | null>(null);
  const [xpGained] = useState(Math.floor(Math.random() * 20) + 15);

  // Memoize confetti positions so they don't move on re-render
  const confettiDots = useMemo(() => 
    [...Array(12)].map((_, i) => ({
      size: 4 + Math.random() * 6,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      left: `${10 + Math.random() * 80}%` as any,
      top: `${5 + Math.random() * 30}%` as any,
      drift: 10 + Math.random() * 20,
    }))
  , []);

  // Animations
  const checkScale = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    saveCookingData();
    runEntryAnimation();
  }, []);

  const saveCookingData = async () => {
    try {
      // Increment cooked count
      const current = await AsyncStorage.getItem('cookedCount');
      const newCount = (current ? parseInt(current) : 0) + 1;
      await AsyncStorage.setItem('cookedCount', newCount.toString());
      setTotalCooked(newCount);

      // Save to cooking history
      const historyRaw = await AsyncStorage.getItem('cookingHistory');
      const history = historyRaw ? JSON.parse(historyRaw) : [];
      history.push({ 
        dishName, 
        date: new Date().toISOString(), 
        steps: totalSteps,
        cookingTime,
        photosCount,
      });
      await AsyncStorage.setItem('cookingHistory', JSON.stringify(history));

      // Check achievements
      const thresholds: Record<number, AchievementUnlock> = {
        1: { icon: 'restaurant', title: 'Bữa đầu tiên', color: '#E65100' },
        5: { icon: 'ribbon', title: 'Tập sự bếp', color: '#4527A0' },
        10: { icon: 'flame', title: 'Đam mê bếp núc', color: '#C62828' },
        20: { icon: 'star', title: 'Tay nghề khá', color: '#F57F17' },
        50: { icon: 'trophy', title: 'Đầu bếp Pro', color: '#6A1B9A' },
      };
      if (thresholds[newCount]) {
        setNewAchievement(thresholds[newCount]);
      }
    } catch (e) {
      console.error('Save cooking data error:', e);
    }
  };

  const runEntryAnimation = () => {
    Animated.sequence([
      // 1. Check mark bounces in
      Animated.spring(checkScale, {
        toValue: 1, friction: 4, tension: 80, useNativeDriver: true,
      }),
      // 2. Title fades in
      Animated.timing(titleOpacity, {
        toValue: 1, duration: 400, useNativeDriver: true,
      }),
      // 3. Stats slide up
      Animated.timing(statsOpacity, {
        toValue: 1, duration: 400, useNativeDriver: true,
      }),
      // 4. Buttons appear
      Animated.timing(buttonsOpacity, {
        toValue: 1, duration: 300, useNativeDriver: true,
      }),
    ]).start();

    // Confetti loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(confettiAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(confettiAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins} phút`;
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}h ${remainMins}p`;
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Tôi vừa hoàn thành món ${dishName} với Smart Cooking! Đã nấu tổng cộng ${totalCooked} món rồi.`,
      });
    } catch (e) {}
  };

  const handleDone = () => {
    // Navigate back to MainTabs, skipping the CookingMode and AIResult screens
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  const handleViewHistory = () => {
    navigation.replace('CookingHistory');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Decorative confetti dots */}
      {confettiDots.map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            styles.confettiDot,
            {
              width: dot.size, height: dot.size, borderRadius: dot.size / 2,
              backgroundColor: dot.color,
              left: dot.left,
              top: dot.top,
              opacity: confettiAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.2, 0.8, 0.2],
              }),
              transform: [{
                translateY: confettiAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, dot.drift],
                })
              }]
            }
          ]}
        />
      ))}

      <View style={styles.content}>
        {/* Success Icon */}
        <Animated.View style={[styles.checkContainer, { transform: [{ scale: checkScale }] }]}>
          <LinearGradient
            colors={['#34C759', '#30D158']}
            style={styles.checkCircle}
          >
            <Ionicons name="checkmark" size={48} color="#FFF" />
          </LinearGradient>
        </Animated.View>

        {/* Title */}
        <Animated.View style={[styles.titleSection, { opacity: titleOpacity }]}>
          <Text style={[styles.congratsText, { color: colors.textSecondary }]}>Tuyệt vời!</Text>
          <Text style={[styles.dishName, { color: colors.text }]}>{dishName}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>đã hoàn thành</Text>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View style={[styles.statsGrid, { opacity: statsOpacity }]}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Ionicons name="time-outline" size={20} color="#007AFF" />
            <Text style={[styles.statCardValue, { color: colors.text }]}>{formatTime(cookingTime)}</Text>
            <Text style={[styles.statCardLabel, { color: colors.textSecondary }]}>Thời gian</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Ionicons name="list-outline" size={20} color="#FF9500" />
            <Text style={[styles.statCardValue, { color: colors.text }]}>{totalSteps}</Text>
            <Text style={[styles.statCardLabel, { color: colors.textSecondary }]}>Bước</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Ionicons name="camera-outline" size={20} color="#AF52DE" />
            <Text style={[styles.statCardValue, { color: colors.text }]}>{photosCount}</Text>
            <Text style={[styles.statCardLabel, { color: colors.textSecondary }]}>Ảnh</Text>
          </View>
        </Animated.View>

        {/* XP Badge */}
        <Animated.View style={[styles.xpBadge, { backgroundColor: `${colors.primary}10`, opacity: statsOpacity }]}>
          <Ionicons name="sparkles" size={18} color={colors.primary} />
          <Text style={[styles.xpText, { color: colors.primary }]}>+{xpGained} XP kinh nghiệm</Text>
          <Text style={[styles.totalCooked, { color: colors.textSecondary }]}>Tổng cộng {totalCooked} món</Text>
        </Animated.View>

        {/* Achievement Unlock */}
        {newAchievement && (
          <Animated.View style={[styles.achievementBanner, { backgroundColor: colors.card, opacity: statsOpacity }]}>
            <View style={[styles.achievementIcon, { backgroundColor: `${newAchievement.color}15` }]}>
              <Ionicons name={newAchievement.icon as any} size={24} color={newAchievement.color} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[styles.achievementLabel, { color: colors.textSecondary }]}>Thành tích mới</Text>
              <Text style={[styles.achievementTitle, { color: colors.text }]}>{newAchievement.title}</Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color="#34C759" />
          </Animated.View>
        )}
      </View>

      {/* Bottom Actions */}
      <Animated.View style={[styles.bottomActions, { opacity: buttonsOpacity }]}>
        <View style={styles.actionRow}>
          <TouchableOpacity 
            activeOpacity={0.7}
            style={[styles.secondaryBtn, { backgroundColor: colors.card }]} 
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={20} color={colors.text} />
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Chia sẻ</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            activeOpacity={0.7}
            style={[styles.secondaryBtn, { backgroundColor: colors.card }]} 
            onPress={handleViewHistory}
          >
            <Ionicons name="stats-chart-outline" size={20} color={colors.text} />
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Thống kê</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity activeOpacity={0.85} onPress={handleDone}>
          <LinearGradient
            colors={[colors.primary, `${colors.primary}CC`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.doneButton, { shadowColor: colors.primary }]}
          >
            <View style={styles.doneBtnIconWrapper}>
              <Ionicons name="home" size={16} color={colors.primary} />
            </View>
            <Text style={styles.doneButtonText}>Về trang chủ</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },

  // Confetti
  confettiDot: { position: 'absolute' },

  // Check icon
  checkContainer: { marginBottom: 32 },
  checkCircle: { 
    width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#34C759', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },

  // Title
  titleSection: { alignItems: 'center', marginBottom: 32 },
  congratsText: { fontSize: 16, fontWeight: '500', letterSpacing: 0.5 },
  dishName: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginTop: 6, textAlign: 'center', lineHeight: 36 },
  subtitle: { fontSize: 16, fontWeight: '500', marginTop: 4 },

  // Stats
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 20, width: '100%' },
  statCard: { 
    flex: 1, alignItems: 'center', paddingVertical: 18, borderRadius: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  statCardValue: { fontSize: 22, fontWeight: '800', marginTop: 8, letterSpacing: -0.5 },
  statCardLabel: { fontSize: 11, fontWeight: '500', marginTop: 3 },

  // XP
  xpBadge: { 
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, 
    flexWrap: 'wrap', gap: 6, marginBottom: 16, width: '100%',
  },
  xpText: { fontSize: 15, fontWeight: '700' },
  totalCooked: { fontSize: 13, marginLeft: 'auto' },

  // Achievement
  achievementBanner: { 
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, width: '100%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  achievementIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  achievementLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  achievementTitle: { fontSize: 16, fontWeight: '800', marginTop: 2 },

  // Bottom
  bottomActions: { paddingHorizontal: 20, paddingBottom: 20 },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  secondaryBtn: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 16,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '600' },
  doneButton: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    gap: 10,
  },
  doneBtnIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
