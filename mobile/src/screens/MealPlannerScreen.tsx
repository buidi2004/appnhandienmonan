import AlertManager from '../components/CustomAlert';
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnimatedButton from '../components/AnimatedButton';
import { GlassCard } from '../components/ui/GlassCard';
import { themeColors, gradients } from '../theme';
import { glass } from '../theme/glass';
import { glow } from '../theme/glow';
import { borderWidth, borderRadius, borderColors, borderPresets } from '../theme/borders';

type Props = NativeStackScreenProps<RootStackParamList, 'MealPlanner'>;

interface MealSlot {
  breakfast: string;
  lunch: string;
  dinner: string;
}

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
const MEALS = ['breakfast', 'lunch', 'dinner'] as const;

export default function MealPlannerScreen({ navigation }: Props) {
  const { typography, spacing } = useAppTheme();
  const [planner, setPlanner] = useState<Record<string, MealSlot>>({});
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [editMeal, setEditMeal] = useState<{day: string, type: typeof MEALS[number]} | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    loadPlanner();
  }, []);

  const loadPlanner = async () => {
    try {
      const saved = await AsyncStorage.getItem('mealPlanner');
      if (saved) {
        setPlanner(JSON.parse(saved));
      } else {
        const initial: Record<string, MealSlot> = {};
        DAYS.forEach(day => {
          initial[day] = { breakfast: '', lunch: '', dinner: '' };
        });
        setPlanner(initial);
      }
    } catch (e) {
      console.log('Error loading planner', e);
    }
  };

  const savePlanner = async (newPlanner: Record<string, MealSlot>) => {
    try {
      await AsyncStorage.setItem('mealPlanner', JSON.stringify(newPlanner));
    } catch (e) {
      console.log('Error saving planner', e);
    }
  };

  const handleEdit = (day: string, type: typeof MEALS[number]) => {
    setEditMeal({ day, type });
    setEditValue(planner[day]?.[type] || '');
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editMeal) {
      const newPlanner = {
        ...planner,
        [editMeal.day]: {
          ...planner[editMeal.day],
          [editMeal.type]: editValue
        }
      };
      setPlanner(newPlanner);
      savePlanner(newPlanner);
    }
    setIsEditing(false);
    setEditMeal(null);
  };

  const getMealIcon = (type: string) => {
    switch (type) {
      case 'breakfast': return 'sunny-outline';
      case 'lunch': return 'restaurant-outline';
      case 'dinner': return 'moon-outline';
      default: return 'fast-food-outline';
    }
  };

  const getMealTitle = (type: string) => {
    switch (type) {
      case 'breakfast': return 'Bữa sáng';
      case 'lunch': return 'Bữa trưa';
      case 'dinner': return 'Bữa tối';
      default: return '';
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bgPrimary }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[typography.h1, { color: themeColors.textPrimary }]}>Kế hoạch ăn uống</Text>
          <Text style={[typography.body, { color: themeColors.textSecondary }]}>Lên thực đơn cho cả tuần</Text>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.dayTabs}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
          {DAYS.map(day => (
            <TouchableOpacity 
              key={day}
              onPress={() => setSelectedDay(day)}
              style={[
                styles.dayTab,
                selectedDay === day && { backgroundColor: themeColors.purple }
              ]}
            >
              <Text style={[
                styles.dayTabText,
                selectedDay === day && { color: '#FFF' }
              ]}>{day}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.mealList}>
          {MEALS.map(mealType => (
            <GlassCard key={mealType} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <View style={styles.mealTitleRow}>
                  <Ionicons name={getMealIcon(mealType)} size={20} color={themeColors.purple} />
                  <Text style={[typography.h3, { color: themeColors.textPrimary, marginLeft: 10 }]}>
                    {getMealTitle(mealType)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleEdit(selectedDay, mealType)}>
                  <Ionicons name="create-outline" size={20} color={themeColors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.mealContent}>
                {planner[selectedDay]?.[mealType] ? (
                  <Text style={[typography.body, { color: themeColors.textPrimary }]}>
                    {planner[selectedDay][mealType]}
                  </Text>
                ) : (
                  <Text style={[typography.body, { color: themeColors.textMuted, fontStyle: 'italic' }]}>
                    Chưa có món ăn...
                  </Text>
                )}
              </View>
            </GlassCard>
          ))}
        </View>
      </ScrollView>

      <Modal visible={isEditing} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalCard}>
            <Text style={[typography.h2, { color: themeColors.textPrimary, marginBottom: 20 }]}>
              {editMeal ? `${getMealTitle(editMeal.type)} - ${editMeal.day}` : 'Thêm món'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Tên món ăn..."
              placeholderTextColor={themeColors.textMuted}
              value={editValue}
              onChangeText={setEditValue}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditing(false)}>
                <Text style={{ color: themeColors.textPrimary }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 20 },
  dayTabs: { marginVertical: 10, height: 50 },
  dayTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.round,
    backgroundColor: 'rgba(30, 10, 60, 0.8)',
    marginRight: 10,
    height: 36,
    justifyContent: 'center'
  },
  dayTabText: { color: themeColors.textSecondary, fontSize: 13, fontWeight: '600' },
  mealList: { padding: 20 },
  mealCard: { marginBottom: 16, padding: 16 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  mealTitleRow: { flexDirection: 'row', alignItems: 'center' },
  mealContent: { minHeight: 40, justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalCard: { padding: 24 },
  input: {
    backgroundColor: 'rgba(30, 10, 60, 0.8)',
    borderRadius: borderRadius.md,
    color: '#FFF',
    padding: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, height: 48, justifyContent: 'center', alignItems: 'center', borderRadius: borderRadius.md, backgroundColor: 'rgba(255,255,255,0.1)' },
  saveBtn: { flex: 2, height: 48, justifyContent: 'center', alignItems: 'center', borderRadius: borderRadius.md, backgroundColor: themeColors.purple },
});
