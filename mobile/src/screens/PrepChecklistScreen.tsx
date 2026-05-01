import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AlertManager from '../components/CustomAlert';

type Props = NativeStackScreenProps<RootStackParamList, 'PrepChecklist'>;
const { width } = Dimensions.get('window');

interface ChecklistItem {
  id: string;
  text: string;
  category: 'tool' | 'prep' | 'ingredient';
  checked: boolean;
}

const COMMON_TOOLS = [
  'Chảo chống dính',
  'Nồi nấu',
  'Thớt + dao',
  'Muỗng / đũa nấu',
  'Bát / đĩa phục vụ',
];

const COMMON_PREP = [
  'Rửa sạch rau củ',
  'Sơ chế thịt / cá',
  'Thái / cắt nguyên liệu',
  'Pha gia vị / nước sốt',
  'Chuẩn bị nước sôi',
];

export default function PrepChecklistScreen({ route, navigation }: Props) {
  const { colors, typography } = useAppTheme();
  const { steps, dishName, ingredients = [], tips } = route.params;

  // Generate checklist from ingredients + common prep
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => {
    const items: ChecklistItem[] = [];
    
    // Tools
    COMMON_TOOLS.forEach((tool, i) => {
      items.push({ id: `tool-${i}`, text: tool, category: 'tool', checked: false });
    });
    
    // Prep steps  
    COMMON_PREP.forEach((prep, i) => {
      items.push({ id: `prep-${i}`, text: prep, category: 'prep', checked: false });
    });

    // Ingredients
    (ingredients || []).forEach((ing, i) => {
      items.push({ id: `ing-${i}`, text: ing, category: 'ingredient', checked: false });
    });
    
    return items;
  });

  const toggleItem = (id: string) => {
    setChecklist(checklist.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const checkedCount = checklist.filter(c => c.checked).length;
  const totalCount = checklist.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;
  const isReady = checkedCount >= Math.ceil(totalCount * 0.5); // At least 50% checked

  const sections = useMemo(() => [
    { 
      title: 'Dụng cụ cần thiết', 
      icon: 'construct-outline' as const, 
      color: '#5856D6',
      items: checklist.filter(c => c.category === 'tool') 
    },
    { 
      title: 'Nguyên liệu', 
      icon: 'nutrition-outline' as const, 
      color: '#34C759',
      items: checklist.filter(c => c.category === 'ingredient') 
    },
    { 
      title: 'Sơ chế', 
      icon: 'cut-outline' as const, 
      color: '#FF9500',
      items: checklist.filter(c => c.category === 'prep') 
    },
  ], [checklist]);

  const handleStart = () => {
    if (!isReady) {
      AlertManager.alert(
        'Bạn đã sẵn sàng?',
        'Có vẻ bạn chưa chuẩn bị xong các bước sơ chế quan trọng. Bạn vẫn muốn bắt đầu nấu chứ?',
        [
          { text: 'Kiểm tra lại', style: 'cancel' },
          { text: 'Bắt đầu luôn', onPress: () => navigation.replace('CookingMode', { steps, dishName, ingredients, tips }) }
        ]
      );
    } else {
      navigation.replace('CookingMode', { steps, dishName, ingredients, tips });
    }
  };

  const handleSkip = () => {
    AlertManager.alert(
      'Bỏ qua chuẩn bị?',
      'Bạn nên kiểm tra dụng cụ và sơ chế trước để việc nấu nướng suôn sẻ hơn.',
      [
        { text: 'Quay lại', style: 'cancel' },
        { text: 'Bỏ qua', style: 'destructive', onPress: () => navigation.replace('CookingMode', { steps, dishName, ingredients, tips }) }
      ]
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
        <TouchableOpacity activeOpacity={0.7} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>Bỏ qua</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <Text style={[styles.screenTitle, { color: colors.text }]}>Chuẩn bị{'\n'}trước khi nấu</Text>
        <Text style={[styles.dishLabel, { color: colors.primary }]}>{dishName}</Text>

        {/* Progress */}
        <View style={[styles.progressCard, { backgroundColor: colors.card }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressText, { color: colors.text }]}>
              {checkedCount}/{totalCount} hoàn thành
            </Text>
            <Text style={[styles.progressPercent, { color: colors.primary }]}>
              {Math.round(progress)}%
            </Text>
          </View>
          <View style={[styles.progressBg, { backgroundColor: `${colors.primary}12` }]}>
            <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.primary }]} />
          </View>
        </View>

        {/* Checklist Sections */}
        {sections.map((section, sIdx) => {
          if (section.items.length === 0) return null;
          const sectionChecked = section.items.filter(i => i.checked).length;
          return (
            <View key={sIdx} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBg, { backgroundColor: `${section.color}12` }]}>
                  <Ionicons name={section.icon} size={18} color={section.color} />
                </View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
                <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
                  {sectionChecked}/{section.items.length}
                </Text>
              </View>
              {section.items.map(item => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  style={[styles.checkItem, { backgroundColor: item.checked ? `${colors.success}06` : colors.card }]}
                  onPress={() => toggleItem(item.id)}
                >
                  <View style={[
                    styles.checkbox,
                    { 
                      backgroundColor: item.checked ? colors.success : 'transparent',
                      borderColor: item.checked ? colors.success : `${colors.border}80`,
                    }
                  ]}>
                    {item.checked && <Ionicons name="checkmark" size={14} color="#FFF" />}
                  </View>
                  <Text style={[
                    styles.checkText,
                    { 
                      color: item.checked ? colors.textSecondary : colors.text,
                      textDecorationLine: item.checked ? 'line-through' : 'none',
                    }
                  ]}>
                    {item.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}

        {/* Tips */}
        {tips ? (
          <View style={[styles.tipsContainer, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}30` }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="bulb-outline" size={20} color={colors.primary} />
              <Text style={[styles.tipsTitle, { color: colors.primary }]}>Mẹo chuẩn bị</Text>
            </View>
            <Text style={[styles.tipsText, { color: colors.textSecondary }]}>{tips}</Text>
          </View>
        ) : null}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { backgroundColor: colors.background }]}>
        <TouchableOpacity activeOpacity={0.85} onPress={handleStart}>
          <LinearGradient
            colors={isReady ? [colors.primary, `${colors.primary}CC`] : [`${colors.primary}80`, `${colors.primary}60`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.startBtn, { shadowColor: isReady ? colors.primary : '#000' }]}
          >
            <View style={styles.startBtnIconWrapper}>
              <Ionicons name="restaurant" size={16} color={isReady ? colors.primary : '#888'} />
            </View>
            <Text style={styles.startBtnText}>
              Bắt đầu nấu ăn
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        {!isReady && (
          <Text style={[styles.hintText, { color: colors.textSecondary }]}>
            Tick ít nhất 50% để sẵn sàng tốt hơn
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  backBtn: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  skipText: { fontSize: 15, fontWeight: '600' },
  scrollContent: { paddingHorizontal: 20 },
  screenTitle: { fontSize: 32, fontWeight: '800', lineHeight: 40, marginTop: 16, letterSpacing: -0.5 },
  dishLabel: { fontSize: 16, fontWeight: '600', marginTop: 6, marginBottom: 24 },

  // Progress
  progressCard: { padding: 18, borderRadius: 18, marginBottom: 28 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  progressText: { fontSize: 14, fontWeight: '600' },
  progressPercent: { fontSize: 18, fontWeight: '800' },
  progressBg: { height: 6, borderRadius: 3 },
  progressFill: { height: '100%', borderRadius: 3 },

  // Section
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sectionIconBg: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '700', flex: 1 },
  sectionCount: { fontSize: 13, fontWeight: '600' },

  // Checklist item
  checkItem: { 
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, marginBottom: 6,
  },
  checkbox: { 
    width: 24, height: 24, borderRadius: 8, borderWidth: 2, 
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  checkText: { flex: 1, fontSize: 15, fontWeight: '500' },

  // Tip
  tipBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 14, marginBottom: 20 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 20 },
  tipsContainer: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 20 },
  tipsTitle: { fontSize: 14, fontWeight: '800', marginLeft: 8 },
  tipsText: { fontSize: 13, lineHeight: 20 },

  // Bottom
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 34 },
  startBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 30,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  startBtnIconWrapper: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center',
  },
  startBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  hintText: { textAlign: 'center', fontSize: 12, marginTop: 10 },
});
