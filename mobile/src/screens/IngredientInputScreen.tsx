import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Dimensions, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedButton from '../components/AnimatedButton';

type Props = NativeStackScreenProps<RootStackParamList, 'IngredientInput'>;
const { width } = Dimensions.get('window');

const POPULAR_INGREDIENTS = [
  { name: 'Trứng gà', icon: 'egg-outline', color: '#FF9500' },
  { name: 'Thịt heo', icon: 'nutrition-outline', color: '#FF3B30' },
  { name: 'Thịt bò', icon: 'nutrition-outline', color: '#AF52DE' },
  { name: 'Tôm', icon: 'fish-outline', color: '#FF6B6B' },
  { name: 'Cà chua', icon: 'leaf-outline', color: '#FF3B30' },
  { name: 'Hành tây', icon: 'leaf-outline', color: '#8E8E93' },
  { name: 'Tỏi', icon: 'leaf-outline', color: '#FFCC00' },
  { name: 'Cà rốt', icon: 'leaf-outline', color: '#FF9500' },
  { name: 'Rau muống', icon: 'leaf-outline', color: '#34C759' },
  { name: 'Bông cải', icon: 'leaf-outline', color: '#30D158' },
  { name: 'Gạo', icon: 'grid-outline', color: '#8E8E93' },
  { name: 'Mì gói', icon: 'grid-outline', color: '#FFCC00' },
  { name: 'Đậu phụ', icon: 'cube-outline', color: '#F0E68C' },
  { name: 'Nấm', icon: 'leaf-outline', color: '#8B7355' },
  { name: 'Cá hồi', icon: 'fish-outline', color: '#FF6347' },
  { name: 'Khoai tây', icon: 'leaf-outline', color: '#D2B48C' },
];

export default function IngredientInputScreen({ navigation }: Props) {
  const { colors, typography } = useAppTheme();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [recentIngredients, setRecentIngredients] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<typeof POPULAR_INGREDIENTS>([]);

  useEffect(() => {
    loadRecent();
  }, []);

  useEffect(() => {
    if (query.trim().length > 0) {
      const filtered = POPULAR_INGREDIENTS.filter(i => 
        i.name.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const loadRecent = async () => {
    try {
      const stored = await AsyncStorage.getItem('recentIngredients');
      if (stored) setRecentIngredients(JSON.parse(stored));
    } catch (e) {}
  };

  const saveRecent = async (items: string[]) => {
    try {
      const unique = [...new Set([...items, ...recentIngredients])].slice(0, 20);
      await AsyncStorage.setItem('recentIngredients', JSON.stringify(unique));
      setRecentIngredients(unique);
    } catch (e) {}
  };

  const toggleIngredient = (name: string) => {
    if (selected.includes(name)) {
      setSelected(selected.filter(s => s !== name));
    } else {
      setSelected([...selected, name]);
    }
  };

  const addCustomIngredient = () => {
    const trimmed = query.trim();
    if (trimmed && !selected.includes(trimmed)) {
      setSelected([...selected, trimmed]);
      setQuery('');
      Keyboard.dismiss();
    }
  };

  const handleSearch = () => {
    if (selected.length === 0) return;
    saveRecent(selected);
    navigation.navigate('AIResult', { initialIngredients: selected });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <AnimatedButton activeOpacity={0.7} onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </AnimatedButton>
        <View style={{ flex: 1 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Title */}
        <Text style={[styles.screenTitle, { color: colors.text }]}>Bạn còn gì{'\n'}trong bếp?</Text>
        <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
          Chọn nguyên liệu đang có, AI sẽ ưu tiên món nấu được ngay và báo phần còn thiếu.
        </Text>

        {/* Search Input */}
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: query ? colors.primary : 'transparent' }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="VD: trứng, cà chua, thịt bò..."
            placeholderTextColor={`${colors.textSecondary}80`}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={addCustomIngredient}
            returnKeyType="done"
          />
          {query.length > 0 && (
            <AnimatedButton activeOpacity={0.7} onPress={addCustomIngredient} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
              <Ionicons name="add" size={18} color="#FFF" />
            </AnimatedButton>
          )}
        </View>

        {/* Autocomplete Suggestions */}
        {suggestions.length > 0 && (
          <View style={[styles.suggestionsBox, { backgroundColor: colors.card }]}>
            {suggestions.slice(0, 5).map((s, i) => (
              <AnimatedButton
                key={i}
                activeOpacity={0.7}
                style={[styles.suggestionItem, { borderBottomColor: `${colors.border}40` }]}
                onPress={() => { toggleIngredient(s.name); setQuery(''); Keyboard.dismiss(); }}
              >
                <Ionicons name={s.icon as any} size={18} color={s.color} />
                <Text style={[styles.suggestionText, { color: colors.text }]}>{s.name}</Text>
                {selected.includes(s.name) && <Ionicons name="checkmark" size={18} color={colors.primary} />}
              </AnimatedButton>
            ))}
          </View>
        )}

        {/* Selected Chips */}
        {selected.length > 0 && (
          <View style={styles.selectedSection}>
            <View style={styles.selectedHeader}>
              <Text style={[styles.selectedLabel, { color: colors.text }]}>
                Đã chọn ({selected.length})
              </Text>
              <AnimatedButton onPress={() => setSelected([])}>
                <Text style={[styles.clearText, { color: colors.textSecondary }]}>Xóa hết</Text>
              </AnimatedButton>
            </View>
            <View style={styles.chipGrid}>
              {selected.map((item, i) => (
                <AnimatedButton
                  key={i}
                  activeOpacity={0.7}
                  style={[styles.selectedChip, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}30` }]}
                  onPress={() => toggleIngredient(item)}
                >
                  <Text style={[styles.chipText, { color: colors.primary }]}>{item}</Text>
                  <Ionicons name="close" size={14} color={colors.primary} style={{ marginLeft: 6 }} />
                </AnimatedButton>
              ))}
            </View>
          </View>
        )}

        {/* Popular Ingredients */}
        <View style={styles.popularSection}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>GỢI Ý NHANH</Text>
          <View style={styles.popularGrid}>
            {POPULAR_INGREDIENTS.map((item, i) => {
              const isSelected = selected.includes(item.name);
              return (
                <AnimatedButton
                  key={i}
                  activeOpacity={0.7}
                  style={[
                    styles.popularChip,
                    { 
                      backgroundColor: isSelected ? `${colors.primary}12` : colors.card,
                      borderColor: isSelected ? `${colors.primary}40` : 'transparent',
                    }
                  ]}
                  onPress={() => toggleIngredient(item.name)}
                >
                  <Ionicons name={item.icon as any} size={16} color={isSelected ? colors.primary : item.color} />
                  <Text style={[styles.popularText, { color: isSelected ? colors.primary : colors.text }]}>{item.name}</Text>
                </AnimatedButton>
              );
            })}
          </View>
        </View>

        {/* Recent */}
        {recentIngredients.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ĐÃ DÙNG GẦN ĐÂY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recentIngredients.filter(r => !selected.includes(r)).slice(0, 10).map((item, i) => (
                <AnimatedButton
                  key={i}
                  activeOpacity={0.7}
                  style={[styles.recentChip, { backgroundColor: colors.card }]}
                  onPress={() => toggleIngredient(item)}
                >
                  <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.recentText, { color: colors.text }]}>{item}</Text>
                </AnimatedButton>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom CTA */}
      {selected.length > 0 && (
        <View style={[styles.bottomBar, { backgroundColor: colors.background }]}>
          <AnimatedButton activeOpacity={0.85} onPress={handleSearch}>
            <LinearGradient
              colors={[colors.primary, `${colors.primary}CC`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.searchBtn, { shadowColor: colors.primary }]}
            >
              <View style={styles.searchBtnIconWrapper}>
                <Ionicons name="sparkles" size={16} color={colors.primary} />
              </View>
              <Text style={styles.searchBtnText}>
                Dựng món từ {selected.length} nguyên liệu
              </Text>
            </LinearGradient>
          </AnimatedButton>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  backBtn: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20 },
  screenTitle: { fontSize: 32, fontWeight: '800', lineHeight: 40, marginTop: 16, letterSpacing: -0.5 },
  screenSubtitle: { fontSize: 14, marginTop: 6, marginBottom: 24, lineHeight: 22 },

  // Search
  searchBox: { 
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 4,
    borderRadius: 16, borderWidth: 1.5, marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 14, marginLeft: 10 },
  addBtn: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  // Suggestions
  suggestionsBox: { borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  suggestionItem: { 
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  suggestionText: { flex: 1, fontSize: 15, fontWeight: '500' },

  // Selected
  selectedSection: { marginBottom: 24 },
  selectedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  selectedLabel: { fontSize: 16, fontWeight: '700' },
  clearText: { fontSize: 13, fontWeight: '600' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectedChip: { 
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
  },
  chipText: { fontSize: 14, fontWeight: '600' },

  // Popular
  popularSection: { marginBottom: 24 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 14 },
  popularGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  popularChip: { 
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
  },
  popularText: { fontSize: 13, fontWeight: '600' },

  // Recent
  recentSection: { marginBottom: 24 },
  recentChip: { 
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginRight: 8,
  },
  recentText: { fontSize: 13, fontWeight: '500' },

  // Bottom
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 34 },
  searchBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 30,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  searchBtnIconWrapper: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center',
  },
  searchBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
