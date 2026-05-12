import AlertManager from '../components/CustomAlert';
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themeColors, gradients } from '../theme';
import { glass } from '../theme/glass';
import { glow } from '../theme/glow';
import { borderWidth, borderRadius, borderColors, borderPresets } from '../theme/borders';

type Props = NativeStackScreenProps<RootStackParamList, 'ShoppingList'>;

interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
  recipeTitle?: string;
  price?: number;
}

export default function ShoppingListScreen({ navigation }: Props) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Tính tổng tiền
  const totalPrice = items.reduce((sum, item) => sum + (item.price || 0), 0);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const storedItems = await AsyncStorage.getItem('shoppingList');
      if (storedItems) {
        setItems(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error('Failed to load shopping list', error);
    } finally {
      setLoading(false);
    }
  };

  const saveItems = async (newItems: ShoppingItem[]) => {
    try {
      await AsyncStorage.setItem('shoppingList', JSON.stringify(newItems));
      setItems(newItems);
    } catch (error) {
      console.error('Failed to save shopping list', error);
    }
  };

  const toggleItem = (id: string) => {
    const newItems = items.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    saveItems(newItems);
  };

  const removeItem = (id: string) => {
    AlertManager.alert(
      'Xóa nguyên liệu',
      'Bạn có chắc muốn xóa món này khỏi danh sách?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: () => {
          const newItems = items.filter(item => item.id !== id);
          saveItems(newItems);
        }}
      ]
    );
  };

  const clearChecked = () => {
    AlertManager.alert(
      'Dọn dẹp',
      'Xóa tất cả món đã mua?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đồng ý', onPress: () => {
          const newItems = items.filter(item => !item.checked);
          saveItems(newItems);
        }}
      ]
    );
  };

  const clearAll = () => {
    AlertManager.alert(
      'Xóa tất cả',
      'Bạn có chắc chắn muốn xóa toàn bộ danh sách mua sắm không?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa sạch', style: 'destructive', onPress: () => saveItems([]) }
      ]
    );
  };

  const renderItem = ({ item }: { item: ShoppingItem }) => (
    <View style={[styles.itemRow, { ...glass.card, backgroundColor: themeColors.bgCard, borderRadius: borderRadius.md }]}>
      <TouchableOpacity 
        style={styles.checkArea} 
        onPress={() => toggleItem(item.id)}
      >
        <Ionicons 
          name={item.checked ? "checkbox" : "square-outline"} 
          size={24} 
          color={item.checked ? themeColors.purple : themeColors.borderCard} 
        />
        <View style={styles.textContainer}>
          <Text style={[
            typography.body, 
            { 
              color: item.checked ? themeColors.textSecondary : themeColors.textPrimary,
              textDecorationLine: item.checked ? 'line-through' : 'none',
              fontSize: 16
            }
          ]}>
            {item.name}
          </Text>
          {!!item.recipeTitle && (
            <Text style={[typography.caption, { color: themeColors.purple, fontSize: 11 }]}>
              Từ: {item.recipeTitle}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={20} color={themeColors.pink} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bgPrimary }]}>
      <View style={[styles.header, { borderBottomColor: themeColors.borderCard }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <Text style={[typography.h2, { color: themeColors.textPrimary, flex: 1, textAlign: 'center' }]}>Danh sách mua sắm</Text>
        <TouchableOpacity onPress={clearAll} style={styles.clearBtn}>
          <Text style={[typography.caption, { color: themeColors.pink, fontWeight: 'bold' }]}>Xóa hết</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={themeColors.purple} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <View style={[styles.emptyIconCircle, { backgroundColor: `${themeColors.purple}10` }]}>
            <Ionicons name="cart-outline" size={60} color={themeColors.purple} />
          </View>
          <Text style={[typography.h3, { color: themeColors.textPrimary, marginTop: 20 }]}>Giỏ hàng trống</Text>
          <Text style={[typography.body, { color: themeColors.textSecondary, textAlign: 'center', marginTop: 10, paddingHorizontal: 40 }]}>
            Hãy thêm nguyên liệu từ các công thức nấu ăn để quản lý việc đi chợ của bạn.
          </Text>
          <TouchableOpacity 
            style={[styles.startShoppingBtn, { ...glow.button, backgroundColor: themeColors.purple, borderRadius: borderRadius.lg }]}
            onPress={() => {
              navigation.navigate('AIResult', {
                initialRecipe: {
                  title: 'Gợi ý món mới',
                  ingredients: ['Thịt', 'Rau xanh', 'Gia vị'],
                  instructions: 'Đang tải...',
                  prep_time: '20 phút',
                  difficulty: 'Dễ',
                  calories: '300 kcal',
                  imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop'
                }
              });
            }}
          >
            <Text style={[typography.h3, { color: themeColors.textPrimary }]}>Tìm công thức ngay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: spacing.lg, paddingBottom: 150 }}
            showsVerticalScrollIndicator={false}
          />
          
          <View style={[styles.bottomSummary, { ...glass.bottomNav, backgroundColor: themeColors.bgBottomNav }]}>
            <View style={styles.totalRow}>
              <Text style={[typography.body, { color: themeColors.textSecondary }]}>Tổng ước tính:</Text>
              <Text style={[typography.h2, { color: themeColors.purple }]}>
                {totalPrice.toLocaleString('vi-VN')} đ
              </Text>
            </View>
          </View>

          {items.some(i => i.checked) && (
            <TouchableOpacity 
              style={[styles.floatingClearBtn, { ...glow.button, backgroundColor: themeColors.purple, shadowColor: themeColors.purple }]}
              onPress={clearChecked}
            >
              <Ionicons name="checkmark-done" size={20} color={themeColors.textPrimary} />
              <Text style={styles.floatingClearText}>Dọn dẹp món đã mua</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    height: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  clearBtn: { padding: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyIconCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
  startShoppingBtn: { marginTop: 30, paddingVertical: 14, paddingHorizontal: 30 },
  itemRow: { 
    flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 12,
    ...borderPresets.card,
  },
  checkArea: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  textContainer: { marginLeft: 12, flex: 1 },
  deleteBtn: { padding: 8 },
  floatingClearBtn: {
    position: 'absolute', bottom: 100, alignSelf: 'center', flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: borderRadius.round,
  },
  floatingClearText: { color: '#FFF', fontWeight: 'bold', marginLeft: 8 },
  bottomSummary: {
    position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 34,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});


