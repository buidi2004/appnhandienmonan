import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import AlertManager from '../components/CustomAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themeColors, gradients, glass, glow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'HealthProfile'>;

export interface HealthProfileData {
  conditions: string[];
  symptoms: string[];
  diet: string;
  allergies: string[];
}

const CONDITIONS = ['Tiểu đường', 'Huyết áp cao', 'Gout', 'Mỡ máu cao', 'Bệnh thận', 'Đau dạ dày'];
const SYMPTOMS = ['Sốt', 'Ho', 'Đau họng', 'Cảm cúm', 'Mệt mỏi', 'Tiêu chảy'];
const DIETS = ['Bình thường', 'Ăn chay', 'Ăn chay trường', 'Low-carb', 'Keto', 'Eat Clean'];

export default function HealthProfileScreen({ navigation }: Props) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();
  
  const [conditions, setConditions] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [diet, setDiet] = useState<string>('Bình thường');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const saved = await AsyncStorage.getItem('healthProfile');
      if (saved) {
        const data: HealthProfileData = JSON.parse(saved);
        setConditions(data.conditions || []);
        setSymptoms(data.symptoms || []);
        setDiet(data.diet || 'Bình thường');
        setAllergies(data.allergies || []);
      }
    } catch (e) {
      console.error('Lỗi khi tải hồ sơ sức khỏe', e);
    }
  };

  const saveProfile = async () => {
    try {
      const data: HealthProfileData = { conditions, symptoms, diet, allergies };
      await AsyncStorage.setItem('healthProfile', JSON.stringify(data));
      AlertManager.alert('Thành công', 'Hồ sơ sức khỏe đã được cập nhật!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      AlertManager.alert('Lỗi', 'Không thể lưu hồ sơ sức khỏe.');
    }
  };

  const toggleSelection = (item: string, list: string[], setList: (val: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const addAllergy = () => {
    if (allergyInput.trim() !== '' && !allergies.includes(allergyInput.trim())) {
      setAllergies([...allergies, allergyInput.trim()]);
      setAllergyInput('');
    }
  };

  const removeAllergy = (item: string) => {
    setAllergies(allergies.filter(a => a !== item));
  };

  const Chip = ({ label, selected, onPress }: { label: string, selected: boolean, onPress: () => void }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.chip,
        { 
          ...glass.card,
          backgroundColor: selected ? themeColors.purple : themeColors.bgCard,
          borderWidth: 1,
          borderColor: selected ? themeColors.purple : themeColors.borderCard,
        }
      ]}
      onPress={onPress}
    >
      <Text style={{ color: selected ? themeColors.textPrimary : themeColors.textSecondary, fontWeight: selected ? '600' : '500', fontSize: 14 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bgPrimary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.borderCard }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <Text style={[typography.h2, { color: themeColors.textPrimary, flex: 1, textAlign: 'center' }]}>Sức khỏe của bạn</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={saveProfile} style={styles.saveBtn}>
          <Text style={{ color: themeColors.purple, fontWeight: 'bold', fontSize: 16 }}>Lưu lại</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <View style={[styles.infoBanner, { backgroundColor: `${themeColors.purple}10`, borderColor: themeColors.borderCard, borderWidth: 1 }]}>
            <View style={[styles.iconWrapper, { backgroundColor: `${themeColors.purple}20` }]}>
              <Ionicons name="shield-checkmark" size={20} color={themeColors.purple} />
            </View>
            <Text style={[typography.body, { color: themeColors.textPrimary, marginLeft: 12, flex: 1, lineHeight: 22 }]}>
              Trợ lý bếp sẽ tự động điều chỉnh gia vị và nguyên liệu để đảm bảo an toàn tuyệt đối cho bạn.
            </Text>
          </View>

          {/* Bệnh mãn tính */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBg, { backgroundColor: `${themeColors.pink}15` }]}>
                <Ionicons name="heart" size={18} color={themeColors.pink} />
              </View>
              <View>
                <Text style={[typography.h3, { color: themeColors.textPrimary, marginLeft: 12 }]}>Tình trạng sức khỏe</Text>
                <Text style={{ fontSize: 12, color: themeColors.textSecondary, marginLeft: 12, marginTop: 2 }}>Các bệnh lý cần lưu ý</Text>
              </View>
            </View>
            <View style={styles.chipContainer}>
              {CONDITIONS.map(item => (
                <Chip 
                  key={item} 
                  label={item} 
                  selected={conditions.includes(item)} 
                  onPress={() => toggleSelection(item, conditions, setConditions)} 
                />
              ))}
            </View>
          </View>

          {/* Triệu chứng hiện tại */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBg, { backgroundColor: '#FF950015' }]}>
                <Ionicons name="thermometer" size={18} color="#FF9500" />
              </View>
              <View>
                <Text style={[typography.h3, { color: themeColors.textPrimary, marginLeft: 12 }]}>Dấu hiệu cơ thể</Text>
                <Text style={{ fontSize: 12, color: themeColors.textSecondary, marginLeft: 12, marginTop: 2 }}>Để gợi ý món giải cảm, dễ tiêu</Text>
              </View>
            </View>
            <View style={styles.chipContainer}>
              {SYMPTOMS.map(item => (
                <Chip 
                  key={item} 
                  label={item} 
                  selected={symptoms.includes(item)} 
                  onPress={() => toggleSelection(item, symptoms, setSymptoms)} 
                />
              ))}
            </View>
          </View>

          {/* Chế độ ăn */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBg, { backgroundColor: '#34C75915' }]}>
                <Ionicons name="leaf" size={18} color="#34C759" />
              </View>
              <View>
                <Text style={[typography.h3, { color: themeColors.textPrimary, marginLeft: 12 }]}>Thói quen ăn uống</Text>
                <Text style={{ fontSize: 12, color: themeColors.textSecondary, marginLeft: 12, marginTop: 2 }}>Phương pháp ăn kiêng của bạn</Text>
              </View>
            </View>
            <View style={styles.chipContainer}>
              {DIETS.map(item => (
                <Chip 
                  key={item} 
                  label={item} 
                  selected={diet === item} 
                  onPress={() => setDiet(item)} 
                />
              ))}
            </View>
          </View>

          {/* Dị ứng */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBg, { backgroundColor: '#FFCC0015' }]}>
                <Ionicons name="warning" size={18} color="#FF9500" />
              </View>
              <View>
                <Text style={[typography.h3, { color: themeColors.textPrimary, marginLeft: 12 }]}>Kiêng kỵ & Dị ứng</Text>
                <Text style={{ fontSize: 12, color: themeColors.textSecondary, marginLeft: 12, marginTop: 2 }}>Các nguyên liệu cần tuyệt đối tránh</Text>
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { ...glass.card, backgroundColor: themeColors.bgCard, color: themeColors.textPrimary, borderColor: themeColors.borderCard }]}
                placeholder="Nhập nguyên liệu (VD: Tôm, Đậu phộng)..."
                placeholderTextColor={themeColors.textMuted}
                value={allergyInput}
                onChangeText={setAllergyInput}
                onSubmitEditing={addAllergy}
              />
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: allergyInput.trim() ? themeColors.purple : themeColors.borderCard }]} onPress={addAllergy} disabled={!allergyInput.trim()}>
                <Ionicons name="add" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.chipContainer}>
              {allergies.map(item => (
                <TouchableOpacity
                  key={item}
                  style={[styles.allergyChip, { backgroundColor: `${themeColors.pink}10`, borderColor: `${themeColors.pink}30` }]}
                  onPress={() => removeAllergy(item)}
                >
                  <Text style={{ color: themeColors.pink, marginRight: 8, fontWeight: '500' }}>{item}</Text>
                  <Ionicons name="close-circle" size={18} color={themeColors.pink} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
    width: 40,
  },
  saveBtn: {
    padding: 4,
    width: 40,
    alignItems: 'flex-end',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 28,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  allergyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
});

