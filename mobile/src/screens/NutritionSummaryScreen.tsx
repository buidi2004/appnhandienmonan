import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/theme';
import { AppBackground } from '../components/ui/AppBackground';
import { GlassCard } from '../components/ui/GlassCard';
import { themeColors, gradients, glass, glow } from '../theme';

const DEFAULT_GOAL = {
  calorieTarget: 2000,
  waterTarget: 8,
  currentCalories: 0,
  currentWater: 0,
  entries: [],
};

type Props = NativeStackScreenProps<RootStackParamList, 'NutritionSummary'>;

type Entry = { id: string; meal: string; calories: number; time: string; date: string };

export default function NutritionSummaryScreen({ route, navigation }: Props) {
  const { dishName, calories, cookingTime, totalSteps } = route.params;
  const [logging, setLogging] = useState(false);

  const parseCalories = (value?: string) => {
    if (!value) return null;
    const match = value.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins} phút`;
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}h ${remainMins}p`;
  };

  const handleLog = async () => {
    const parsedCalories = parseCalories(calories);
    setLogging(true);
    try {
      const raw = await AsyncStorage.getItem('nutritionGoal');
      const goal = raw ? JSON.parse(raw) : DEFAULT_GOAL;
      const today = new Date().toDateString();
      const entry: Entry = {
        id: Date.now().toString(),
        meal: dishName,
        calories: parsedCalories || 0,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        date: today,
      };
      const entries = Array.isArray(goal.entries) ? [...goal.entries, entry] : [entry];
      const todayCalories = entries
        .filter((e: Entry) => e.date === today)
        .reduce((sum: number, e: Entry) => sum + (e.calories || 0), 0);
      const newGoal = { ...goal, entries, currentCalories: todayCalories };
      await AsyncStorage.setItem('nutritionGoal', JSON.stringify(newGoal));
      navigation.navigate('NutritionDiary', {});
    } catch (e) {
      navigation.navigate('NutritionDiary', { presetEntry: { meal: dishName, calories: parseCalories(calories) || undefined } });
    } finally {
      setLogging(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Mình vừa hoàn thành ${dishName}. Ước tính ${calories || 'chưa rõ'}!`,
      });
    } catch (e) {}
  };

  return (
    <AppBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}> 
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()}> 
          <GlassCard variant="default" style={{ ...glass.card, ...styles.backBtn }}>
            <Ionicons name="arrow-back" size={22} color={themeColors.textPrimary} />
          </GlassCard>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tổng kết dinh dưỡng</Text>
        <View style={{ width: 52 }} />
      </View>

      <GlassCard variant="default" style={{ ...glass.card, ...styles.card }}> 
        <View style={styles.row}>
          <View style={[styles.iconBadge, { backgroundColor: `${themeColors.purple}15` }]}>
            <Ionicons name="restaurant" size={20} color={themeColors.purple} />
          </View>
          <Text style={styles.title}>{dishName}</Text>
        </View>
        <View style={styles.metaRow}>
          <GlassCard variant="chip" style={{ ...glass.card, ...styles.metaItem }}> 
            <Ionicons name="flame-outline" size={14} color={themeColors.purple} />
            <Text style={[styles.metaText, { color: themeColors.purple }]}>{calories || 'Chưa rõ'}</Text>
          </GlassCard>
          <GlassCard variant="chip" style={{ ...glass.card, ...styles.metaItem }}> 
            <Ionicons name="time-outline" size={14} color={themeColors.pink} />
            <Text style={[styles.metaText, { color: themeColors.pink }]}>{formatTime(cookingTime)}</Text>
          </GlassCard>
          <GlassCard variant="chip" style={{ ...glass.card, ...styles.metaItem }}> 
            <Ionicons name="list-outline" size={14} color={themeColors.textSecondary} />
            <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>{totalSteps} bước</Text>
          </GlassCard>
        </View>
        <Text style={styles.desc}>Giá trị dinh dưỡng hiển thị dựa trên ước tính từ AI.</Text>
      </GlassCard>

      <View style={styles.actionRow}>
        <TouchableOpacity activeOpacity={0.8} style={{ flex: 1 }} onPress={handleShare}>
          <GlassCard variant="default" style={{ ...glass.card, ...styles.secondaryBtn }}>
            <Ionicons name="share-outline" size={20} color={themeColors.textPrimary} />
            <Text style={styles.secondaryText}>Chia sẻ</Text>
          </GlassCard>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} style={{ flex: 1 }} onPress={() => navigation.navigate('NutritionDiary', {})}>
          <GlassCard variant="default" style={{ ...glass.card, ...styles.secondaryBtn }}>
            <Ionicons name="nutrition-outline" size={20} color={themeColors.textPrimary} />
            <Text style={styles.secondaryText}>Nhật ký</Text>
          </GlassCard>
        </TouchableOpacity>
      </View>

      <TouchableOpacity activeOpacity={0.85} onPress={handleLog} disabled={logging}>
        <LinearGradient
          colors={gradients.button}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ ...glow.button, ...styles.primaryBtn }}
        >
          <Text style={styles.primaryText}>{logging ? 'Đang lưu...' : 'Ghi vào nhật ký dinh dưỡng'}</Text>
        </LinearGradient>
      </TouchableOpacity>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingVertical: 20 },
  header: { height: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, marginTop: 10 },
  backBtn: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: themeColors.textPrimary, letterSpacing: -0.5 },
  card: { padding: 24, borderRadius: 32, marginBottom: 32 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  iconBadge: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '900', color: themeColors.textPrimary, letterSpacing: -0.5 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  metaText: { fontSize: 13, fontWeight: '900' },
  desc: { fontSize: 13, lineHeight: 22, color: themeColors.textMuted, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 14, marginBottom: 24 },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 60, borderRadius: 20 },
  secondaryText: { fontSize: 15, fontWeight: '900', color: themeColors.textPrimary },
  primaryBtn: { height: 68, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: themeColors.textPrimary, fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});
