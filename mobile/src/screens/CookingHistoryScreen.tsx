import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = NativeStackScreenProps<RootStackParamList, 'CookingHistory'>;

const { width } = Dimensions.get('window');

interface CookingStats {
  totalCooked: number;
  totalScans: number;
  totalFavorites: number;
  streak: number;
  weeklyData: number[];
}

const ACHIEVEMENTS = [
  { id: 'first', icon: 'restaurant', bg: '#FFF3E0', color: '#E65100', title: 'Bữa đầu tiên', desc: 'Nấu món đầu tiên', target: 1 },
  { id: 'five', icon: 'ribbon', bg: '#EDE7F6', color: '#4527A0', title: 'Tập sự bếp', desc: 'Nấu được 5 món', target: 5 },
  { id: 'ten', icon: 'flame', bg: '#FFEBEE', color: '#C62828', title: 'Đam mê bếp núc', desc: 'Nấu được 10 món', target: 10 },
  { id: 'twenty', icon: 'star', bg: '#FFFDE7', color: '#F57F17', title: 'Tay nghề khá', desc: 'Nấu được 20 món', target: 20 },
  { id: 'fifty', icon: 'trophy', bg: '#F3E5F5', color: '#6A1B9A', title: 'Đầu bếp Pro', desc: 'Nấu được 50 món', target: 50 },
  { id: 'hundred', icon: 'medal', bg: '#FFF8E1', color: '#FF8F00', title: 'Bậc thầy ẩm thực', desc: 'Nấu được 100 món', target: 100 },
  { id: 'scanner', icon: 'scan-circle', bg: '#E8F5E9', color: '#2E7D32', title: 'Thám tử bếp', desc: 'Quét AI 10 lần', target: 10 },
  { id: 'collector', icon: 'heart-circle', bg: '#FCE4EC', color: '#AD1457', title: 'Sưu tập gia', desc: 'Lưu 10 công thức', target: 10 },
];

export default function CookingHistoryScreen({ navigation }: Props) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();
  const [stats, setStats] = useState<CookingStats>({
    totalCooked: 0, totalScans: 0, totalFavorites: 0, streak: 0, weeklyData: [0,0,0,0,0,0,0]
  });

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const loadStats = async () => {
    try {
      const [cooked, scans, favs, history] = await Promise.all([
        AsyncStorage.getItem('cookedCount'),
        AsyncStorage.getItem('scanCount'),
        AsyncStorage.getItem('favorites'),
        AsyncStorage.getItem('cookingHistory'),
      ]);

      const favList = favs ? JSON.parse(favs) : [];
      const historyList = history ? JSON.parse(history) : [];

      // Calculate weekly data from history
      const weeklyData = [0,0,0,0,0,0,0];
      const now = new Date();
      historyList.forEach((entry: any) => {
        const date = new Date(entry.date);
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 7) {
          weeklyData[6 - diffDays] = (weeklyData[6 - diffDays] || 0) + 1;
        }
      });

      // Calculate streak
      let streak = 0;
      const dates = historyList.map((e: any) => new Date(e.date).toDateString());
      let checkDate = new Date();
      while (dates.includes(checkDate.toDateString())) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }

      setStats({
        totalCooked: parseInt(cooked || '0'),
        totalScans: parseInt(scans || '0'),
        totalFavorites: favList.length,
        streak,
        weeklyData,
      });
    } catch (e) {
      console.error('Load stats error:', e);
    }
  };

  const maxBarValue = Math.max(...stats.weeklyData, 1);
  const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const todayIndex = (new Date().getDay() + 6) % 7; // Monday = 0

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Custom header - asymmetric spacing */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Title section - left aligned, editorial feel */}
        <Text style={[styles.screenTitle, { color: colors.text }]}>Hành trình{'\n'}của bạn</Text>
        <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
          Theo dõi tiến bộ nấu ăn mỗi ngày
        </Text>

        {/* Empty State */}
        {stats.totalCooked === 0 && stats.totalScans === 0 && stats.totalFavorites === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: `${colors.primary}08` }]}>
              <Ionicons name="timer-outline" size={48} color={`${colors.textSecondary}40`} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Chưa có hoạt động</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              Bắt đầu quét nguyên liệu và nấu món đầu tiên để xem thống kê tại đây
            </Text>
            <TouchableOpacity 
              activeOpacity={0.8}
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.emptyBtnText}>Bắt đầu nấu ăn</Text>
            </TouchableOpacity>
          </View>
        ) : (
        <>
        {/* Streak Banner - only when active */}
        {stats.streak > 0 && (
          <LinearGradient
            colors={['#FF6B35', '#F7461E']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.6 }}
            style={styles.streakBanner}
          >
            <View style={styles.streakLeft}>
              <View style={styles.streakFireBg}>
                <Ionicons name="flame" size={22} color="#FFF" />
              </View>
              <View style={{ marginLeft: 14 }}>
                <Text style={styles.streakCount}>{stats.streak}</Text>
                <Text style={styles.streakLabel}>ngày liên tục</Text>
              </View>
            </View>
            <Text style={styles.streakMotivation}>Giữ vững nhé!</Text>
          </LinearGradient>
        )}

        {/* Stats - asymmetric bento grid */}
        <View style={styles.statsRow}>
          <View style={[styles.statLarge, { backgroundColor: colors.card }]}>
            <View style={[styles.statDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalCooked}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Món đã nấu</Text>
          </View>
          <View style={styles.statsCol}>
            <View style={[styles.statSmall, { backgroundColor: colors.card }]}>
              <Ionicons name="camera-outline" size={18} color="#5856D6" />
              <Text style={[styles.statSmValue, { color: colors.text }]}>{stats.totalScans}</Text>
              <Text style={[styles.statSmLabel, { color: colors.textSecondary }]}>Quét AI</Text>
            </View>
            <View style={[styles.statSmall, { backgroundColor: colors.card }]}>
              <Ionicons name="heart-outline" size={18} color="#FF3B30" />
              <Text style={[styles.statSmValue, { color: colors.text }]}>{stats.totalFavorites}</Text>
              <Text style={[styles.statSmLabel, { color: colors.textSecondary }]}>Yêu thích</Text>
            </View>
          </View>
        </View>

        {/* Weekly Chart - refined */}
        <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>7 ngày gần nhất</Text>
            <View style={[styles.chartBadge, { backgroundColor: `${colors.primary}12` }]}>
              <Text style={[styles.chartBadgeText, { color: colors.primary }]}>
                {stats.weeklyData.reduce((a, b) => a + b, 0)} món
              </Text>
            </View>
          </View>
          <View style={styles.chartContainer}>
            {stats.weeklyData.map((value, index) => {
              const isToday = index === todayIndex;
              const barHeight = Math.max((value / maxBarValue) * 100, 8);
              return (
                <View key={index} style={styles.chartBarWrapper}>
                  <View style={styles.chartBarContainer}>
                    <View style={[
                      styles.chartBar,
                      { 
                        height: `${barHeight}%`,
                        backgroundColor: value > 0 ? (isToday ? colors.primary : `${colors.primary}60`) : `${colors.border}40`,
                        borderRadius: 5,
                      }
                    ]} />
                  </View>
                  <Text style={[
                    styles.chartLabel,
                    { color: isToday ? colors.primary : colors.textSecondary, fontWeight: isToday ? '800' : '500' }
                  ]}>
                    {days[index]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Achievements - section header without emoji */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Thành tích</Text>
          <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
            {ACHIEVEMENTS.filter(a => {
              return (a.id === 'scanner' && stats.totalScans >= a.target) ||
                     (a.id === 'collector' && stats.totalFavorites >= a.target) ||
                     (!['scanner', 'collector'].includes(a.id) && stats.totalCooked >= a.target);
            }).length}/{ACHIEVEMENTS.length}
          </Text>
        </View>
        <View style={styles.achievementsGrid}>
          {ACHIEVEMENTS.map(a => {
            const unlocked = (a.id === 'scanner' && stats.totalScans >= a.target) ||
                             (a.id === 'collector' && stats.totalFavorites >= a.target) ||
                             (!['scanner', 'collector'].includes(a.id) && stats.totalCooked >= a.target);
            return (
              <View key={a.id} style={[
                styles.achievementCard,
                { backgroundColor: unlocked ? colors.card : `${colors.border}20` }
              ]}>
                <View style={[styles.achievementIconBg, { backgroundColor: unlocked ? a.bg : `${colors.border}30` }]}>
                  <Ionicons name={a.icon as any} size={24} color={unlocked ? a.color : `${colors.textSecondary}60`} />
                </View>
                <Text style={[styles.achievementTitle, { color: unlocked ? colors.text : `${colors.textSecondary}80` }]} numberOfLines={1}>{a.title}</Text>
                <Text style={[styles.achievementDesc, { color: unlocked ? colors.textSecondary : `${colors.textSecondary}50` }]}>{a.desc}</Text>
                {unlocked && (
                  <View style={styles.unlockedCheck}>
                    <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Pro CTA - editorial style */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('ProUpgrade')}>
          <LinearGradient
            colors={['#1C1C1E', '#2C2C2E']}
            style={styles.proCTA}
          >
            <View style={styles.proCTAContent}>
              <View style={styles.proIconWrapper}>
                <Ionicons name="diamond" size={20} color="#FFD700" />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.proCTATitle}>Mở khóa toàn bộ</Text>
                <Text style={styles.proCTADesc}>Thống kê nâng cao, AI không giới hạn</Text>
              </View>
              <View style={styles.proCTAArrow}>
                <Ionicons name="arrow-forward" size={16} color="#FFF" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
        </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4,
  },
  backBtn: { 
    width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
  },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  
  // Title - editorial
  screenTitle: { fontSize: 32, fontWeight: '800', lineHeight: 40, marginTop: 16, letterSpacing: -0.5 },
  screenSubtitle: { fontSize: 15, marginTop: 6, marginBottom: 24, lineHeight: 22 },

  // Streak
  streakBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 18, borderRadius: 22, marginBottom: 24,
  },
  streakLeft: { flexDirection: 'row', alignItems: 'center' },
  streakFireBg: { 
    width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', alignItems: 'center',
  },
  streakCount: { color: '#FFF', fontSize: 26, fontWeight: '900', lineHeight: 30 },
  streakLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '500' },
  streakMotivation: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },

  // Stats bento
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statLarge: { 
    flex: 1.2, padding: 24, borderRadius: 22, justifyContent: 'flex-end', minHeight: 140,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  statDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 16 },
  statValue: { fontSize: 42, fontWeight: '900', lineHeight: 46, letterSpacing: -1 },
  statLabel: { fontSize: 13, fontWeight: '500', marginTop: 4 },
  statsCol: { flex: 1, gap: 12 },
  statSmall: { 
    flex: 1, padding: 16, borderRadius: 18, justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  statSmValue: { fontSize: 22, fontWeight: '800', marginTop: 6, letterSpacing: -0.5 },
  statSmLabel: { fontSize: 11, fontWeight: '500', marginTop: 2 },

  // Chart
  chartCard: {
    padding: 22, borderRadius: 22, marginBottom: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  chartTitle: { fontSize: 17, fontWeight: '700' },
  chartBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  chartBadgeText: { fontSize: 12, fontWeight: '700' },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120 },
  chartBarWrapper: { alignItems: 'center', flex: 1 },
  chartBarContainer: { height: 90, width: 20, justifyContent: 'flex-end' },
  chartBar: { width: '100%', minHeight: 6 },
  chartLabel: { fontSize: 11, marginTop: 10 },

  // Achievements
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  sectionCount: { fontSize: 14, fontWeight: '600' },
  achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  achievementCard: {
    width: (width - 60) / 3, paddingVertical: 18, paddingHorizontal: 6, borderRadius: 18, alignItems: 'center',
  },
  achievementIconBg: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  achievementTitle: { fontSize: 12, fontWeight: '700', marginTop: 10, textAlign: 'center' },
  achievementDesc: { fontSize: 10, marginTop: 3, textAlign: 'center' },
  unlockedCheck: { position: 'absolute', top: 8, right: 8 },

  // Pro CTA
  proCTA: { borderRadius: 20, overflow: 'hidden', marginBottom: 8 },
  proCTAContent: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  proIconWrapper: { 
    width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,215,0,0.15)', 
    justifyContent: 'center', alignItems: 'center',
  },
  proCTATitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  proCTADesc: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 },
  proCTAArrow: { 
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyIcon: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  emptyBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 16 },
  emptyBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
