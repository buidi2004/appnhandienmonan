import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AlertManager from '../components/CustomAlert';
import { useFocusEffect } from '@react-navigation/native';
import { themeColors, gradients } from '../theme';
import { glass } from '../theme/glass';
import { glow } from '../theme/glow';
import { borderRadius as designBorderRadius, borderPresets } from '../theme/borders';


type Props = NativeStackScreenProps<RootStackParamList, 'NutritionDiary'>;
const { width } = Dimensions.get('window');

interface NutritionGoal {
  calorieTarget: number;
  waterTarget: number;
  currentCalories: number;
  currentWater: number;
  entries: NutritionEntry[];
}

interface NutritionEntry {
  id: string;
  meal: string;
  calories: number;
  time: string;
  date: string;
}

const DEFAULT_GOAL: NutritionGoal = {
  calorieTarget: 2000,
  waterTarget: 8,
  currentCalories: 0,
  currentWater: 0,
  entries: [],
};

export default function NutritionDiaryScreen({ navigation }: Props) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();
  const [goal, setGoal] = useState<NutritionGoal>(DEFAULT_GOAL);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [mealName, setMealName] = useState('');
  const [mealCalories, setMealCalories] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadGoal();
    }, [])
  );

  const loadGoal = async () => {
    try {
      const stored = await AsyncStorage.getItem('nutritionGoal');
      if (stored) {
        const data = JSON.parse(stored);
        // Reset daily entries if it's a new day
        const today = new Date().toDateString();
        const todayEntries = (data.entries || []).filter((e: NutritionEntry) => e.date === today);
        const todayCalories = todayEntries.reduce((sum: number, e: NutritionEntry) => sum + e.calories, 0);
        setGoal({ ...data, entries: todayEntries, currentCalories: todayCalories });
      }
    } catch (e) {
      console.error('Load goal error:', e);
    }
  };

  const saveGoal = async (newGoal: NutritionGoal) => {
    try {
      await AsyncStorage.setItem('nutritionGoal', JSON.stringify(newGoal));
      setGoal(newGoal);
    } catch (e) {
      console.error('Save goal error:', e);
    }
  };

  const addEntry = () => {
    if (!mealName.trim() || !mealCalories.trim()) return;
    const cal = parseInt(mealCalories);
    if (isNaN(cal)) return;

    const entry: NutritionEntry = {
      id: Date.now().toString(),
      meal: mealName.trim(),
      calories: cal,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toDateString(),
    };

    const newGoal = {
      ...goal,
      entries: [...goal.entries, entry],
      currentCalories: goal.currentCalories + cal,
    };
    saveGoal(newGoal);
    setMealName('');
    setMealCalories('');
    setShowAddEntry(false);
  };

  const addWater = () => {
    if (goal.currentWater < goal.waterTarget) {
      saveGoal({ ...goal, currentWater: goal.currentWater + 1 });
    }
  };

  const caloriePercent = Math.min((goal.currentCalories / goal.calorieTarget) * 100, 100);
  const waterPercent = Math.min((goal.currentWater / goal.waterTarget) * 100, 100);
  const remaining = Math.max(goal.calorieTarget - goal.currentCalories, 0);

  // Progress bar component (cleaner than circle hacks)
  const ProgressArc = ({ percent, size, color, strokeWidth = 8 }: { percent: number; size: number; color: string; strokeWidth?: number }) => {
    // Render quadrant-based arc for cleaner appearance
    const r = (size - strokeWidth) / 2;
    return (
      <View style={{ width: size, height: size }}>
        {/* Background ring */}
        <View style={{
          width: size, height: size, borderRadius: size / 2,
          borderWidth: strokeWidth, borderColor: `${color}15`,
          position: 'absolute',
        }} />
        {/* Active ring - quadrant approach */}
        <View style={{
          width: size, height: size, borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderLeftColor: percent > 0 ? color : 'transparent',
          borderBottomColor: percent > 25 ? color : 'transparent',
          borderRightColor: percent > 50 ? color : 'transparent',
          borderTopColor: percent > 75 ? color : 'transparent',
          position: 'absolute',
          transform: [{ rotate: '-90deg' }],
        }} />
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bgPrimary }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={[styles.backBtn, { ...glass.card, backgroundColor: themeColors.bgCard }]}>
          <Ionicons name="arrow-back" size={20} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity activeOpacity={0.7} onPress={() => {
          AlertManager.alert('Cài đặt mục tiêu', `Mục tiêu hiện tại: ${goal.calorieTarget} kcal/ngày.\nTính năng tùy chỉnh mục tiêu sẽ sớm ra mắt!`);
        }} style={[styles.settingsBtn, { ...glass.card, backgroundColor: themeColors.bgCard }]}>
          <Ionicons name="options-outline" size={20} color={themeColors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <Text style={[styles.screenTitle, { color: themeColors.textPrimary }]}>Nhật ký{'\n'}dinh dưỡng</Text>
        <Text style={[styles.dateLabel, { color: themeColors.textSecondary }]}>
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>

        {/* Main stat cards - bento layout */}
        <View style={styles.mainStats}>
          {/* Calorie card - large */}
          <View style={[styles.calorieCard, { ...glass.card, backgroundColor: themeColors.bgCard }]}>
            <View style={styles.calorieHeader}>
              <View>
                <Text style={[styles.calorieLabel, { color: themeColors.textSecondary }]}>Calories</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
                  <Text style={[styles.calorieValue, { color: caloriePercent > 90 ? '#FF3B30' : themeColors.textPrimary }]}>
                    {goal.currentCalories}
                  </Text>
                  <Text style={[styles.calorieTarget, { color: themeColors.textSecondary }]}>
                    /{goal.calorieTarget}
                  </Text>
                </View>
              </View>
              <View style={styles.calorieRingWrapper}>
                <ProgressArc percent={caloriePercent} size={64} color={caloriePercent > 90 ? '#FF3B30' : themeColors.purple} strokeWidth={6} />
                <View style={styles.calorieRingCenter}>
                  <Text style={[styles.caloriePercent, { color: caloriePercent > 90 ? '#FF3B30' : themeColors.purple }]}>
                    {Math.round(caloriePercent)}%
                  </Text>
                </View>
              </View>
            </View>
            {/* Progress bar */}
            <View style={[styles.progressBg, { backgroundColor: `${themeColors.purple}12` }]}>
              <View style={[styles.progressFill, { 
                width: `${caloriePercent}%`, 
                backgroundColor: caloriePercent > 90 ? '#FF3B30' : themeColors.purple 
              }]} />
            </View>
            <Text style={[styles.remainingText, { color: themeColors.textSecondary }]}>
              Còn lại {remaining} kcal
            </Text>
          </View>

          {/* Water card */}
          <TouchableOpacity activeOpacity={0.7} onPress={addWater} style={[styles.waterCard, { ...glass.card, backgroundColor: themeColors.bgCard }]}>
            <Ionicons name="water" size={22} color="#007AFF" />
            <Text style={[styles.waterValue, { color: themeColors.textPrimary }]}>
              {goal.currentWater}<Text style={{ color: themeColors.textSecondary, fontSize: 14 }}>/{goal.waterTarget}</Text>
            </Text>
            <View style={[styles.waterBarBg, { backgroundColor: '#007AFF15' }]}>
              <View style={[styles.waterBarFill, { height: `${waterPercent}%`, backgroundColor: '#007AFF' }]} />
            </View>
            <Text style={[styles.waterLabel, { color: themeColors.textSecondary }]}>ly nước</Text>
            <Text style={[styles.waterTap, { color: '#007AFF' }]}>+1</Text>
          </TouchableOpacity>
        </View>

        {/* Macros - horizontal strip */}
        <View style={styles.macroStrip}>
          {[
            { label: 'Carbs', value: '45%', color: '#FF9500', icon: 'nutrition-outline' },
            { label: 'Protein', value: '30%', color: '#34C759', icon: 'barbell-outline' },
            { label: 'Fat', value: '25%', color: '#5856D6', icon: 'water-outline' },
          ].map((macro, i) => (
            <View key={i} style={[styles.macroItem, { ...glass.card, backgroundColor: themeColors.bgCard }]}>
              <Ionicons name={macro.icon as any} size={16} color={macro.color} />
              <Text style={[styles.macroValue, { color: themeColors.textPrimary }]}>{macro.value}</Text>
              <Text style={[styles.macroLabel, { color: themeColors.textSecondary }]}>{macro.label}</Text>
            </View>
          ))}
        </View>

        {/* Today's Meals */}
        <View style={styles.mealsSection}>
          <View style={styles.mealsSectionHeader}>
            <Text style={[styles.mealsTitle, { color: themeColors.textPrimary }]}>Bữa ăn hôm nay</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.addMealBtn, { backgroundColor: themeColors.purple }]}
              onPress={() => setShowAddEntry(!showAddEntry)}
            >
              <Ionicons name={showAddEntry ? 'close' : 'add'} size={18} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Add Entry Form */}
          {showAddEntry && (
            <View style={[styles.addForm, { ...glass.card, backgroundColor: themeColors.bgCard }]}>
              <TextInput
                style={[styles.input, { backgroundColor: themeColors.bgPrimary, color: themeColors.textPrimary, borderColor: `${themeColors.borderCard}60` }]}
                placeholder="Tên bữa ăn (VD: Phở bò)"
                placeholderTextColor={`${themeColors.textSecondary}80`}
                value={mealName}
                onChangeText={setMealName}
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput
                  style={[styles.input, { backgroundColor: themeColors.bgPrimary, color: themeColors.textPrimary, borderColor: `${themeColors.borderCard}60`, flex: 1 }]}
                  placeholder="Calories (kcal)"
                  placeholderTextColor={`${themeColors.textSecondary}80`}
                  keyboardType="numeric"
                  value={mealCalories}
                  onChangeText={setMealCalories}
                />
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.saveEntryBtn, { ...glow.button, backgroundColor: themeColors.purple }]}
                  onPress={addEntry}
                >
                  <Text style={styles.saveEntryText}>Thêm</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Entries */}
          {goal.entries.length === 0 ? (
            <View style={[styles.emptyState, { ...glass.card, backgroundColor: themeColors.bgCard }]}>
              <Ionicons name="restaurant-outline" size={36} color={`${themeColors.textSecondary}40`} />
              <Text style={[styles.emptyTitle, { color: themeColors.textSecondary }]}>Chưa có bữa ăn nào</Text>
              <Text style={[styles.emptyDesc, { color: `${themeColors.textSecondary}80` }]}>
                Bấm "+" để ghi nhận bữa ăn đầu tiên
              </Text>
            </View>
          ) : (
            goal.entries.map((entry, index) => (
              <View key={entry.id} style={[styles.entryCard, { ...glass.card, backgroundColor: themeColors.bgCard }]}>
                <View style={[styles.entryDot, { backgroundColor: themeColors.purple }]} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={[styles.entryName, { color: themeColors.textPrimary }]}>{entry.meal}</Text>
                  <Text style={[styles.entryTime, { color: themeColors.textSecondary }]}>{entry.time}</Text>
                </View>
                <Text style={[styles.entryCal, { color: themeColors.purple }]}>+{entry.calories}</Text>
                <Text style={[styles.entryUnit, { color: themeColors.textSecondary }]}>kcal</Text>
              </View>
            ))
          )}
        </View>

        {/* Tip */}
        <View style={[styles.tipBox, { backgroundColor: `${themeColors.purple}08` }]}>
          <Ionicons name="bulb-outline" size={18} color={themeColors.purple} />
          <Text style={[styles.tipText, { color: themeColors.textSecondary }]}>
            Uống 1 ly nước trước bữa ăn 30 phút giúp giảm cảm giác thèm ăn và hỗ trợ tiêu hóa tốt hơn.
          </Text>
        </View>
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
  settingsBtn: { 
    width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
  },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  screenTitle: { fontSize: 32, fontWeight: '800', lineHeight: 40, marginTop: 16, letterSpacing: -0.5 },
  dateLabel: { fontSize: 14, marginTop: 6, marginBottom: 24, textTransform: 'capitalize' },

  // Main stats
  mainStats: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  calorieCard: { 
    flex: 2, padding: 20, 
    ...borderPresets.card,
    backgroundColor: 'rgba(30, 10, 60, 0.8)',
    shadowColor: '#a855f7', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 4,
  },
  calorieHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },

  // Water
  waterCard: { 
    flex: 1, padding: 16, alignItems: 'center', justifyContent: 'space-between',
    ...borderPresets.card,
    backgroundColor: 'rgba(30, 10, 60, 0.8)',
    shadowColor: '#a855f7', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 4,
  },
  waterValue: { fontSize: 24, fontWeight: '900', marginTop: 6, letterSpacing: -0.5 },
  waterBarBg: { width: 32, height: 50, borderRadius: 16, overflow: 'hidden', justifyContent: 'flex-end', marginVertical: 4 },
  waterBarFill: { width: '100%', borderRadius: 16 },
  waterLabel: { fontSize: 11, fontWeight: '500' },
  waterTap: { fontSize: 16, fontWeight: '800', marginTop: 2 },

  // Macros
  macroStrip: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  macroItem: { 
    flex: 1, padding: 14, alignItems: 'center',
    ...borderPresets.card,
    borderRadius: designBorderRadius.lg,
  },
  macroValue: { fontSize: 18, fontWeight: '800', marginTop: 6, letterSpacing: -0.3 },
  macroLabel: { fontSize: 11, fontWeight: '500', marginTop: 2 },

  // Meals
  mealsSection: { marginBottom: 24 },
  mealsSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  mealsTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  addMealBtn: { width: 34, height: 34, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  addForm: { padding: 16, borderRadius: 16, marginBottom: 16, gap: 10 },
  input: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1, fontSize: 14 },
  saveEntryBtn: { paddingHorizontal: 20, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  saveEntryText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  emptyState: { padding: 36, borderRadius: 18, alignItems: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '600', marginTop: 12 },
  emptyDesc: { fontSize: 12, marginTop: 4 },

  // Entry card
  entryCard: { 
    flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 8,
    ...borderPresets.card,
    borderRadius: designBorderRadius.lg,
  },
  entryDot: { width: 8, height: 8, borderRadius: 4 },
  entryName: { fontSize: 15, fontWeight: '600' },
  entryTime: { fontSize: 12, marginTop: 2 },
  entryCal: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  entryUnit: { fontSize: 11, marginLeft: 3 },

  // Tip
  tipBox: { flexDirection: 'row', padding: 16, borderRadius: 16, alignItems: 'flex-start' },
  tipText: { flex: 1, fontSize: 13, marginLeft: 12, lineHeight: 20 },
});
