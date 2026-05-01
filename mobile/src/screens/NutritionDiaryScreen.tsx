import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AlertManager from '../components/CustomAlert';
import { useFocusEffect } from '@react-navigation/native';

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity activeOpacity={0.7} onPress={() => {
          AlertManager.alert('Cài đặt mục tiêu', `Mục tiêu hiện tại: ${goal.calorieTarget} kcal/ngày.\nTính năng tùy chỉnh mục tiêu sẽ sớm ra mắt!`);
        }} style={[styles.settingsBtn, { backgroundColor: colors.card }]}>
          <Ionicons name="options-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <Text style={[styles.screenTitle, { color: colors.text }]}>Nhật ký{'\n'}dinh dưỡng</Text>
        <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>

        {/* Main stat cards - bento layout */}
        <View style={styles.mainStats}>
          {/* Calorie card - large */}
          <View style={[styles.calorieCard, { backgroundColor: colors.card }]}>
            <View style={styles.calorieHeader}>
              <View>
                <Text style={[styles.calorieLabel, { color: colors.textSecondary }]}>Calories</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
                  <Text style={[styles.calorieValue, { color: caloriePercent > 90 ? '#FF3B30' : colors.text }]}>
                    {goal.currentCalories}
                  </Text>
                  <Text style={[styles.calorieTarget, { color: colors.textSecondary }]}>
                    /{goal.calorieTarget}
                  </Text>
                </View>
              </View>
              <View style={styles.calorieRingWrapper}>
                <ProgressArc percent={caloriePercent} size={64} color={caloriePercent > 90 ? '#FF3B30' : colors.primary} strokeWidth={6} />
                <View style={styles.calorieRingCenter}>
                  <Text style={[styles.caloriePercent, { color: caloriePercent > 90 ? '#FF3B30' : colors.primary }]}>
                    {Math.round(caloriePercent)}%
                  </Text>
                </View>
              </View>
            </View>
            {/* Progress bar */}
            <View style={[styles.progressBg, { backgroundColor: `${colors.primary}12` }]}>
              <View style={[styles.progressFill, { 
                width: `${caloriePercent}%`, 
                backgroundColor: caloriePercent > 90 ? '#FF3B30' : colors.primary 
              }]} />
            </View>
            <Text style={[styles.remainingText, { color: colors.textSecondary }]}>
              Còn lại {remaining} kcal
            </Text>
          </View>

          {/* Water card */}
          <TouchableOpacity activeOpacity={0.7} onPress={addWater} style={[styles.waterCard, { backgroundColor: colors.card }]}>
            <Ionicons name="water" size={22} color="#007AFF" />
            <Text style={[styles.waterValue, { color: colors.text }]}>
              {goal.currentWater}<Text style={{ color: colors.textSecondary, fontSize: 14 }}>/{goal.waterTarget}</Text>
            </Text>
            <View style={[styles.waterBarBg, { backgroundColor: '#007AFF15' }]}>
              <View style={[styles.waterBarFill, { height: `${waterPercent}%`, backgroundColor: '#007AFF' }]} />
            </View>
            <Text style={[styles.waterLabel, { color: colors.textSecondary }]}>ly nước</Text>
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
            <View key={i} style={[styles.macroItem, { backgroundColor: colors.card }]}>
              <Ionicons name={macro.icon as any} size={16} color={macro.color} />
              <Text style={[styles.macroValue, { color: colors.text }]}>{macro.value}</Text>
              <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>{macro.label}</Text>
            </View>
          ))}
        </View>

        {/* Today's Meals */}
        <View style={styles.mealsSection}>
          <View style={styles.mealsSectionHeader}>
            <Text style={[styles.mealsTitle, { color: colors.text }]}>Bữa ăn hôm nay</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.addMealBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowAddEntry(!showAddEntry)}
            >
              <Ionicons name={showAddEntry ? 'close' : 'add'} size={18} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Add Entry Form */}
          {showAddEntry && (
            <View style={[styles.addForm, { backgroundColor: colors.card }]}>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: `${colors.border}60` }]}
                placeholder="Tên bữa ăn (VD: Phở bò)"
                placeholderTextColor={`${colors.textSecondary}80`}
                value={mealName}
                onChangeText={setMealName}
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: `${colors.border}60`, flex: 1 }]}
                  placeholder="Calories (kcal)"
                  placeholderTextColor={`${colors.textSecondary}80`}
                  keyboardType="numeric"
                  value={mealCalories}
                  onChangeText={setMealCalories}
                />
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.saveEntryBtn, { backgroundColor: colors.primary }]}
                  onPress={addEntry}
                >
                  <Text style={styles.saveEntryText}>Thêm</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Entries */}
          {goal.entries.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <Ionicons name="restaurant-outline" size={36} color={`${colors.textSecondary}40`} />
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>Chưa có bữa ăn nào</Text>
              <Text style={[styles.emptyDesc, { color: `${colors.textSecondary}80` }]}>
                Bấm "+" để ghi nhận bữa ăn đầu tiên
              </Text>
            </View>
          ) : (
            goal.entries.map((entry, index) => (
              <View key={entry.id} style={[styles.entryCard, { backgroundColor: colors.card }]}>
                <View style={[styles.entryDot, { backgroundColor: colors.primary }]} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={[styles.entryName, { color: colors.text }]}>{entry.meal}</Text>
                  <Text style={[styles.entryTime, { color: colors.textSecondary }]}>{entry.time}</Text>
                </View>
                <Text style={[styles.entryCal, { color: colors.primary }]}>+{entry.calories}</Text>
                <Text style={[styles.entryUnit, { color: colors.textSecondary }]}>kcal</Text>
              </View>
            ))
          )}
        </View>

        {/* Tip */}
        <View style={[styles.tipBox, { backgroundColor: `${colors.primary}08` }]}>
          <Ionicons name="bulb-outline" size={18} color={colors.primary} />
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
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
    flex: 2, padding: 20, borderRadius: 22,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  calorieHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  calorieLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  calorieValue: { fontSize: 36, fontWeight: '900', lineHeight: 40, letterSpacing: -1 },
  calorieTarget: { fontSize: 14, fontWeight: '500', marginLeft: 2 },
  calorieRingWrapper: { width: 64, height: 64, justifyContent: 'center', alignItems: 'center' },
  calorieRingCenter: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  caloriePercent: { fontSize: 14, fontWeight: '800' },
  progressBg: { height: 6, borderRadius: 3, marginTop: 16 },
  progressFill: { height: '100%', borderRadius: 3 },
  remainingText: { fontSize: 12, marginTop: 8 },

  // Water
  waterCard: { 
    flex: 1, padding: 16, borderRadius: 22, alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  waterValue: { fontSize: 24, fontWeight: '900', marginTop: 6, letterSpacing: -0.5 },
  waterBarBg: { width: 32, height: 50, borderRadius: 16, overflow: 'hidden', justifyContent: 'flex-end', marginVertical: 4 },
  waterBarFill: { width: '100%', borderRadius: 16 },
  waterLabel: { fontSize: 11, fontWeight: '500' },
  waterTap: { fontSize: 16, fontWeight: '800', marginTop: 2 },

  // Macros
  macroStrip: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  macroItem: { 
    flex: 1, padding: 14, borderRadius: 16, alignItems: 'center',
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
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 8,
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
