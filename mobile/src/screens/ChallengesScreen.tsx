import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { AppBackground } from '../components/ui/AppBackground';
import { GlassCard } from '../components/ui/GlassCard';
import { shadow } from '../theme/shadow';
import { themeColors, gradients } from '../theme';
import { glass } from '../theme/glass';
import { glow } from '../theme/glow';
import { borderWidth, borderRadius, borderColors, borderPresets } from '../theme/borders';

interface Challenge {
  id: string;
  title: string;
  description: string;
  reward: number;
  progress: number;
  target: number;
  type: 'daily' | 'weekly';
  icon: string;
  color: string;
  isCompleted: boolean;
}

const mockChallenges: Challenge[] = [
  {
    id: '1',
    title: 'Đầu bếp Healthy',
    description: 'Nấu 3 món ăn ít calo trong tuần này',
    reward: 100,
    progress: 1,
    target: 3,
    type: 'weekly',
    icon: 'leaf',
    color: '#34C759',
    isCompleted: false,
  },
  {
    id: '2',
    title: 'Quét sạch tủ lạnh',
    description: 'Sử dụng 5 nguyên liệu sắp hết hạn',
    reward: 150,
    progress: 5,
    target: 5,
    type: 'daily',
    icon: 'cube',
    color: '#FF9500',
    isCompleted: true,
  },
  {
    id: '3',
    title: 'Nghệ sĩ ẩm thực',
    description: 'Chia sẻ 2 bài viết lên cộng đồng',
    reward: 50,
    progress: 0,
    target: 2,
    type: 'daily',
    icon: 'camera',
    color: '#5856D6',
    isCompleted: false,
  },
  {
    id: '4',
    title: 'Master Chef VN',
    description: 'Nấu 10 món truyền thống Việt Nam',
    reward: 500,
    progress: 4,
    target: 10,
    type: 'weekly',
    icon: 'trophy',
    color: '#FFD700',
    isCompleted: false,
  }
];

export default function ChallengesScreen({ navigation }: any) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();
  const [filter, setFilter] = useState<'all' | 'daily' | 'weekly'>('all');

  const filteredChallenges = mockChallenges.filter(c => 
    filter === 'all' ? true : c.type === filter
  );

  const renderChallenge = ({ item }: { item: Challenge }) => {
    const progressPercent = (item.progress / item.target) * 100;
    
    return (
      <GlassCard variant="default" style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: `${item.color}15` }]}>
            <Ionicons name={item.icon as any} size={28} color={item.color} />
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={[{ color: themeColors.textPrimary, fontSize: 18, fontWeight: '900', letterSpacing: -0.5 }]}>{item.title}</Text>
            <Text style={[{ color: themeColors.textSecondary, fontSize: 13, marginTop: 2, fontWeight: '500' }]}>{item.description}</Text>
          </View>
          <GlassCard variant="chip" style={styles.rewardBadge}>
            <Text style={[styles.rewardText, { color: themeColors.purple }]}>+{item.reward} XP</Text>
          </GlassCard>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Text style={[{ color: themeColors.textSecondary, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' }]}>Tiến độ</Text>
            <Text style={[{ color: themeColors.textPrimary, fontSize: 12, fontWeight: '900' }]}>
              {item.progress}/{item.target}
            </Text>
          </View>
          <View style={[styles.progressBarBase, { backgroundColor: 'rgba(30, 10, 60, 0.8)' }]}>
            <LinearGradient
              colors={[item.color, `${item.color}80`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
            />
          </View>
        </View>

        {item.isCompleted ? (
          <View style={styles.completedBtn}>
            <Ionicons name="checkmark-circle" size={22} color="#43E97B" />
            <Text style={styles.completedText}>Đã hoàn thành</Text>
          </View>
        ) : (
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate('Home');
            }}
          >
            <LinearGradient
              colors={gradients.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ ...glow.button, ...styles.actionBtn }}
            >
              <Text style={styles.actionBtnText}>THAM GIA NGAY</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </GlassCard>
    );
  };

  return (
    <AppBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()}>
            <GlassCard variant="default" style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={themeColors.textPrimary} />
            </GlassCard>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.textPrimary }]}>Thử thách nấu ăn</Text>
          <View style={{ width: 52 }} />
        </View>

        <View style={styles.filterContainer}>
          <FilterTab active={filter === 'all'} label="Tất cả" onPress={() => setFilter('all')} />
          <FilterTab active={filter === 'daily'} label="Hàng ngày" onPress={() => setFilter('daily')} />
          <FilterTab active={filter === 'weekly'} label="Hàng tuần" onPress={() => setFilter('weekly')} />
        </View>

        <FlatList
          data={filteredChallenges}
          renderItem={renderChallenge}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <GlassCard variant="default" style={styles.statsBanner}>
              <LinearGradient
                colors={gradients.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statsGradient}
              >
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>12</Text>
                  <Text style={styles.statLabel}>Hoàn thành</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>850</Text>
                  <Text style={styles.statLabel}>XP kiếm được</Text>
                </View>
              </LinearGradient>
            </GlassCard>
          }
        />
      </SafeAreaView>
    </AppBackground>
  );
}

function FilterTab({ active, label, onPress }: any) {
  const { colors, typography } = useAppTheme();
  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.filterTabWrapper}
    >
      <GlassCard 
        variant={active ? "purple" : "default"} 
        style={styles.filterTab}
      >
        <Text style={[
          styles.filterTabText, 
          { color: active ? '#FFF' : 'rgba(255,255,255,0.6)' }
        ]}>
          {label}
        </Text>
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginTop: 10 },
  headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5, flex: 1, textAlign: 'center' },
  backBtn: { width: 52, height: 52, justifyContent: 'center', alignItems: 'center', ...borderPresets.card, borderRadius: borderRadius.lg },
  filterContainer: { flexDirection: 'row', paddingHorizontal: 24, marginBottom: 24, gap: 12 },
  filterTabWrapper: { flex: 1 },
  filterTab: { paddingVertical: 14, alignItems: 'center', borderRadius: borderRadius.lg },
  filterTabText: { fontSize: 13, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  statsBanner: { marginBottom: 36, borderRadius: borderRadius.xl, overflow: 'hidden' },
  statsGradient: { flexDirection: 'row', padding: 32, alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: '#FFF', fontSize: 32, fontWeight: '900', letterSpacing: -1.5 },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 6 },
  statDivider: { width: 1, height: 44, backgroundColor: 'rgba(255,255,255,0.2)' },
  card: { padding: 24, marginBottom: 24, ...borderPresets.card },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  iconBox: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  rewardBadge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  rewardText: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  progressSection: { marginBottom: 28 },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  progressBarBase: { height: 12, borderRadius: 6, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 6 },
  actionBtn: { height: 64, justifyContent: 'center', alignItems: 'center', borderRadius: borderRadius.xl },
  actionBtnText: { color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 1.5 },
  completedBtn: { height: 64, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderRadius: 24, backgroundColor: 'rgba(67, 233, 123, 0.08)' },
  completedText: { marginLeft: 10, fontWeight: '900', fontSize: 15, letterSpacing: 1, textTransform: 'uppercase', color: '#43E97B' },
});
