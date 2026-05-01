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
import { RootStackParamList } from '../../App';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    <View style={[styles.itemRow, { backgroundColor: colors.card, borderRadius: borderRadius.md }]}>
      <TouchableOpacity 
        style={styles.checkArea} 
        onPress={() => toggleItem(item.id)}
      >
        <Ionicons 
          name={item.checked ? "checkbox" : "square-outline"} 
          size={24} 
          color={item.checked ? colors.success : colors.border} 
        />
        <View style={styles.textContainer}>
          <Text style={[
            typography.body, 
            { 
              color: item.checked ? colors.textSecondary : colors.text,
              textDecorationLine: item.checked ? 'line-through' : 'none',
              fontSize: 16
            }
          ]}>
            {item.name}
          </Text>
          {!!item.recipeTitle && (
            <Text style={[typography.caption, { color: colors.primary, fontSize: 11 }]}>
              Từ: {item.recipeTitle}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={20} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[typography.h2, { color: colors.text, flex: 1, textAlign: 'center' }]}>Danh sách mua sắm</Text>
        <TouchableOpacity onPress={clearAll} style={styles.clearBtn}>
          <Text style={[typography.caption, { color: colors.error, fontWeight: 'bold' }]}>Xóa hết</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <View style={[styles.emptyIconCircle, { backgroundColor: `${colors.primary}10` }]}>
            <Ionicons name="cart-outline" size={60} color={colors.primary} />
          </View>
          <Text style={[typography.h3, { color: colors.text, marginTop: 20 }]}>Giỏ hàng trống</Text>
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: 10, paddingHorizontal: 40 }]}>
            Hãy thêm nguyên liệu từ các công thức nấu ăn để quản lý việc đi chợ của bạn.
          </Text>
          <TouchableOpacity 
            style={[styles.startShoppingBtn, { backgroundColor: colors.primary, borderRadius: borderRadius.lg }]}
            onPress={() => {
              navigation.navigate('AIResult', {
                initialRecipe: {
                  title: 'Gợi ý món mới',
                  description: 'AI đang phân tích các món ngon phù hợp nhất cho bạn hôm nay...',
                  ingredients: ['Thịt', 'Rau xanh', 'Gia vị'],
                  instructions: 'Đang tải...',
                  prep_time: '20 phút',
                  difficulty: 'Dễ',
                  calories: '300 kcal',
                  image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop',
                  imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop'
                }
              });
            }}
          >
            <Text style={[typography.h3, { color: '#FFF' }]}>Tìm công thức ngay</Text>
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
          
          <View style={[styles.bottomSummary, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <View style={styles.totalRow}>
              <Text style={[typography.body, { color: colors.textSecondary }]}>Tổng ước tính:</Text>
              <Text style={[typography.h2, { color: colors.primary }]}>
                {totalPrice.toLocaleString('vi-VN')} đ
              </Text>
            </View>
          </View>

          {items.some(i => i.checked) && (
            <TouchableOpacity 
              style={[styles.floatingClearBtn, { backgroundColor: colors.success, shadowColor: colors.success }]}
              onPress={clearChecked}
            >
              <Ionicons name="checkmark-done" size={20} color="#FFF" />
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
    height: 60, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  clearBtn: { padding: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyIconCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
  startShoppingBtn: { marginTop: 30, paddingVertical: 14, paddingHorizontal: 30 },
  itemRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  checkArea: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  textContainer: { marginLeft: 12, flex: 1 },
  deleteBtn: { padding: 8 },
  floatingClearBtn: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  floatingClearText: { color: '#FFF', fontWeight: 'bold', marginLeft: 8 },
  bottomSummary: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
});


