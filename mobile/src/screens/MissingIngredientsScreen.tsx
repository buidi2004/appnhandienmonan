import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/theme';
import EmptyState from '../components/EmptyState';
import AlertManager from '../components/CustomAlert';
import { syncService } from '../services/syncService';
import { AppBackground } from '../components/ui/AppBackground';
import { GlassCard } from '../components/ui/GlassCard';
import { shadow } from '../theme/shadow';
import { LinearGradient } from 'expo-linear-gradient';

const MISSING_KEY = 'missingIngredientsHub';
const SHOPPING_KEY = 'shoppingList';

type Props = NativeStackScreenProps<RootStackParamList, 'MissingIngredients'>;

type MissingItem = {
  id: string;
  name: string;
  recipeTitle?: string;
  checked?: boolean;
  addedAt: string;
};

export default function MissingIngredientsScreen({ navigation }: Props) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();
  const [items, setItems] = useState<MissingItem[]>([]);
  const entryAnim = useRef(new Animated.Value(0)).current;

  const loadMissing = async () => {
    try {
      const stored = await AsyncStorage.getItem(MISSING_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      setItems(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      setItems([]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMissing();
    }, [])
  );

  useEffect(() => {
    Animated.timing(entryAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, [entryAnim]);

  const saveMissing = async (newItems: MissingItem[]) => {
    await AsyncStorage.setItem(MISSING_KEY, JSON.stringify(newItems));
    setItems(newItems);
  };

  const toggleChecked = (id: string) => {
    const newItems = items.map(item => item.id === id ? { ...item, checked: !item.checked } : item);
    saveMissing(newItems);
  };

  const addToShoppingList = async (target: MissingItem[]) => {
    try {
      const stored = await AsyncStorage.getItem(SHOPPING_KEY);
      const currentList = stored ? JSON.parse(stored) : [];
      const existingNames = new Set(currentList.map((item: any) => String(item.name).toLowerCase()));

      const newItems = target
        .filter(item => !existingNames.has(item.name.toLowerCase()))
        .map(item => ({
          id: Math.random().toString(36).substr(2, 9),
          name: item.name,
          checked: false,
          recipeTitle: item.recipeTitle,
        }));

      await AsyncStorage.setItem(SHOPPING_KEY, JSON.stringify([...currentList, ...newItems]));
      await syncService.syncShoppingList([...currentList, ...newItems]);
      AlertManager.alert('Đã thêm vào giỏ', `Đã thêm ${newItems.length} nguyên liệu vào danh sách mua.`);
    } catch (e) {
      AlertManager.alert('Lỗi', 'Không thể thêm vào danh sách mua.');
    }
  };

  const clearChecked = () => {
    AlertManager.alert('Xóa mục đã mua', 'Bạn có muốn xóa các nguyên liệu đã đánh dấu?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => saveMissing(items.filter(item => !item.checked)) },
    ]);
  };

  const renderItem = ({ item }: { item: MissingItem }) => (
    <GlassCard variant={item.checked ? 'default' : 'pink'} style={styles.itemRow}> 
      <TouchableOpacity style={styles.checkArea} onPress={() => toggleChecked(item.id)}>
        <Ionicons
          name={item.checked ? 'checkbox' : 'square-outline'}
          size={22}
          color={item.checked ? '#43E97B' : 'rgba(255,255,255,0.4)'}
        />
        <View style={styles.textContainer}>
          <Text style={[styles.itemName, { color: item.checked ? 'rgba(255,255,255,0.4)' : '#FFFFFF', textDecorationLine: item.checked ? 'line-through' : 'none' }]}>
            {item.name}
          </Text>
          {!!item.recipeTitle && (
            <Text style={[styles.itemRecipe, { color: 'rgba(255,255,255,0.4)' }]}>Từ: {item.recipeTitle}</Text>
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity activeOpacity={0.7} onPress={() => addToShoppingList([item])}>
        <GlassCard variant="chip" style={styles.cartIconWrapper}>
          <Ionicons name="cart" size={18} color="#7C4DFF" />
        </GlassCard>
      </TouchableOpacity>
    </GlassCard>
  );

  return (
    <AppBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}> 
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()}> 
          <GlassCard variant="default" style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </GlassCard>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Nguyên liệu thiếu</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={clearChecked}>
          <GlassCard variant="chip" style={styles.clearBtn}>
            <Text style={[styles.clearText, { color: '#FFFFFF' }]}>DỌN DẸP</Text>
          </GlassCard>
        </TouchableOpacity>
      </View>

      <Animated.View style={{ flex: 1, opacity: entryAnim, transform: [{ translateY: entryAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
        {items.length === 0 ? (
          <EmptyState
            icon="basket-outline"
            title="Đang đủ nguyên liệu"
            description="Tất cả nguyên liệu cần thiết đều đã có sẵn. Hãy bắt đầu nấu nướng thôi!"
            buttonText="Quay lại Home"
            onPress={() => navigation.goBack()}
          />

        ) : (
          <>
            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={{ padding: spacing.lg, paddingBottom: 140 }}
              showsVerticalScrollIndicator={false}
            />
            <Animated.View 
              style={[
                styles.bottomBar, 
                { 
                  backgroundColor: 'transparent',
                  opacity: entryAnim,
                  transform: [{ scale: entryAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }]
                }
              ]}
            > 
              <View style={{ gap: 12 }}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => addToShoppingList(items.filter(item => !item.checked))}
                >
                  <LinearGradient
                    colors={['#7C4DFF', '#FF6584']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.primaryBtn, { ...shadow.md }]}
                  >
                    <Ionicons name="cart-outline" size={20} color="#FFF" />
                    <Text style={styles.primaryBtnText}>CHUYỂN VÀO GIỎ HÀNG</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    const query = items.filter(i => !i.checked).map(i => i.name).join(', ');
                    const url = `https://shopeefood.vn/search?q=${encodeURIComponent(query)}`;
                    AlertManager.alert('Mua sắm online', 'Mở ShopeeFood để tìm mua các nguyên liệu này?', [
                      { text: 'Hủy', style: 'cancel' },
                      { text: 'Đồng ý', onPress: () => Linking.openURL(url) }
                    ]);
                  }}
                >
                  <GlassCard variant="default" style={styles.secondaryBtn}>
                    <Ionicons name="bicycle-outline" size={20} color="#FFFFFF" />
                    <Text style={[styles.primaryBtnText, { color: '#FFFFFF' }]}>MUA QUA SHOPEEFOOD</Text>
                  </GlassCard>
                </TouchableOpacity>
              </View>
            </Animated.View>

          </>
        )}
      </Animated.View>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  clearBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  clearText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, marginBottom: 12, borderRadius: 24 },
  cartIconWrapper: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  checkArea: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 16 },
  textContainer: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
  itemRecipe: { fontSize: 11, marginTop: 4, fontWeight: '600' },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 24, paddingBottom: 40 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 60, borderRadius: 20 },
  primaryBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 60, borderRadius: 20 },
});
