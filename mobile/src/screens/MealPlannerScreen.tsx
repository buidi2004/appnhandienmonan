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
import { RootStackParamList } from '../../App';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnimatedButton from '../components/AnimatedButton';
import GlassCard from '../components/GlassCard';

type Props = NativeStackScreenProps<RootStackParamList, 'MealPlanner'>;

interface MealSlot {
  breakfast: string;
  lunch: string;
  dinner: string;
}

interface WeeklyPlan {
  [day: string]: MealSlot;
}

const DAYS = [
  { id: 'Mon', label: 'Thứ 2' },
  { id: 'Tue', label: 'Thứ 3' },
  { id: 'Wed', label: 'Thứ 4' },
  { id: 'Thu', label: 'Thứ 5' },
  { id: 'Fri', label: 'Thứ 6' },
  { id: 'Sat', label: 'Thứ 7' },
  { id: 'Sun', label: 'Chủ Nhật' },
];

export default function MealPlannerScreen({ navigation }: Props) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [plan, setPlan] = useState<WeeklyPlan>({});
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSlot, setEditingSlot] = useState<'breakfast' | 'lunch' | 'dinner' | null>(null);
  const [mealText, setMealText] = useState('');

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    try {
      const stored = await AsyncStorage.getItem('mealPlan');
      if (stored) {
        setPlan(JSON.parse(stored));
      } else {
        // Khởi tạo kế hoạch trống
        const initial: WeeklyPlan = {};
        DAYS.forEach(d => initial[d.id] = { breakfast: '', lunch: '', dinner: '' });
        setPlan(initial);
      }
    } catch (error) {
      console.error('Failed to load meal plan', error);
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async (newPlan: WeeklyPlan) => {
    try {
      await AsyncStorage.setItem('mealPlan', JSON.stringify(newPlan));
      setPlan(newPlan);
    } catch (error) {
      console.error('Failed to save meal plan', error);
    }
  };

  const openEdit = (slot: 'breakfast' | 'lunch' | 'dinner') => {
    setEditingSlot(slot);
    setMealText(plan[selectedDay]?.[slot] || '');
    setModalVisible(true);
  };

  const handleSaveMeal = () => {
    if (editingSlot) {
      const newPlan = { ...plan };
      newPlan[selectedDay] = { ...newPlan[selectedDay], [editingSlot]: mealText };
      savePlan(newPlan);
      setModalVisible(false);
    }
  };

  const renderSlot = (title: string, icon: string, slot: 'breakfast' | 'lunch' | 'dinner', color: string) => (
    <AnimatedButton 
      activeOpacity={0.7}
      style={[styles.slotCard, { backgroundColor: colors.card, borderRadius: borderRadius.lg }]}
      onPress={() => openEdit(slot)}
    >
      <View style={[styles.slotIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.slotContent}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{title}</Text>
        <Text style={[typography.body, { color: plan[selectedDay]?.[slot] ? colors.text : colors.border, marginTop: 4 }]} numberOfLines={1}>
          {plan[selectedDay]?.[slot] || 'Chưa có kế hoạch...'}
        </Text>
      </View>
      <Ionicons name="create-outline" size={20} color={colors.border} />
    </AnimatedButton>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <AnimatedButton activeOpacity={0.7} onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </AnimatedButton>
        <Text style={[typography.h2, { color: colors.text, flex: 1, textAlign: 'center' }]}>Kế hoạch tuần</Text>
        <View style={{ width: 24 }} /> {/* Placeholder to balance back button */}
      </View>

      {/* Day Selector */}
      <View style={styles.daySelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg }}>
          {DAYS.map(day => (
            <AnimatedButton 
              activeOpacity={0.7}
              key={day.id}
              onPress={() => setSelectedDay(day.id)}
              style={[
                styles.dayPill, 
                { 
                  backgroundColor: selectedDay === day.id ? colors.primary : colors.card,
                  borderColor: selectedDay === day.id ? colors.primary : colors.border,
                }
              ]}
            >
              <Text style={[styles.dayText, { color: selectedDay === day.id ? '#FFF' : colors.text }]}>
                {day.label}
              </Text>
            </AnimatedButton>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg }}>
        <View style={styles.summaryCard}>
          <View style={[styles.summaryItem, { borderRightWidth: 1, borderRightColor: colors.border }]}>
            <Text style={[typography.h2, { color: colors.primary }]}>2,100</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Kcal dự kiến</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[typography.h2, { color: colors.success }]}>3/3</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Bữa đã lên lịch</Text>
          </View>
        </View>

        <Text style={[typography.h3, { color: colors.text, marginBottom: 16, marginTop: 10 }]}>Thực đơn hôm nay</Text>
        
        {renderSlot('Bữa sáng', 'sunny-outline', 'breakfast', '#FF9500')}
        {renderSlot('Bữa trưa', 'restaurant-outline', 'lunch', colors.primary)}
        {renderSlot('Bữa tối', 'moon-outline', 'dinner', '#5856D6')}

        <View style={[styles.tipBox, { backgroundColor: `${colors.primary}10`, marginTop: 20, marginBottom: 20 }]}>
          <Ionicons name="bulb-outline" size={20} color={colors.primary} />
          <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 10, flex: 1 }]}>
            Mẹo: Lập kế hoạch trước giúp bạn tiết kiệm 30% thời gian đi chợ và chuẩn bị món ăn!
          </Text>
        </View>

        {/* PRO FEATURE: Auto AI Plan */}
        <AnimatedButton 
          activeOpacity={0.8}
          style={[styles.proButton, { backgroundColor: '#FFD700' }]}
          onPress={() => {
            AlertManager.alert(
              'Tính năng Cao cấp', 
              'Tính năng "Tự động lên lịch bằng AI" chỉ dành riêng cho tài khoản Pro. Nâng cấp ngay để tận hưởng đặc quyền này?',
              [
                { text: 'Để sau', style: 'cancel' },
                { text: 'Nâng cấp Pro', onPress: () => navigation.navigate('ProUpgrade' as any) }
              ]
            );
          }}
        >
          <Ionicons name="sparkles" size={20} color="#000" />
          <Text style={[typography.h3, { color: '#000', marginLeft: 8 }]}>Tự động gợi ý lịch ăn (Pro)</Text>
        </AnimatedButton>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, borderRadius: borderRadius.xl }]}>
            <Text style={[typography.h3, { color: colors.text, marginBottom: 16 }]}>
              {editingSlot === 'breakfast' ? 'Lên lịch Bữa sáng' : editingSlot === 'lunch' ? 'Lên lịch Bữa trưa' : 'Lên lịch Bữa tối'}
            </Text>
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderRadius: borderRadius.md }]}
              placeholder="Tên món ăn hoặc tên công thức..."
              placeholderTextColor={colors.textSecondary}
              value={mealText}
              onChangeText={setMealText}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <AnimatedButton activeOpacity={0.7} style={[styles.modalBtn, { backgroundColor: colors.border }]} onPress={() => setModalVisible(false)}>
                <Text style={{ color: colors.textSecondary }}>Hủy</Text>
              </AnimatedButton>
              <AnimatedButton activeOpacity={0.7} style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={handleSaveMeal}>
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Lưu kế hoạch</Text>
              </AnimatedButton>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    height: 60, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  daySelector: { paddingVertical: 16 },
  dayPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
  },
  dayText: { fontWeight: 'bold' },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.02)',
    paddingVertical: 20,
    borderRadius: 20,
    marginBottom: 24,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  slotIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  slotContent: { flex: 1 },
  tipBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: { padding: 24 },
  input: { padding: 16, fontSize: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  modalBtn: { flex: 0.48, padding: 16, borderRadius: 12, alignItems: 'center' },
  proButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 40,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  }
});
