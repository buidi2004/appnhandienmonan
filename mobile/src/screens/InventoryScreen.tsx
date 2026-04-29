import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert,
  TextInput,
  Modal,
  ScrollView
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

type Props = NativeStackScreenProps<RootStackParamList, 'Inventory'>;

interface InventoryItem {
  id: string;
  name: string;
  quantity: string;
  expiryDate: string; // ISO string
  category: string;
}

const CATEGORIES = ['Rau củ', 'Thịt & Cá', 'Trứng & Sữa', 'Gia vị', 'Đồ khô', 'Khác'];

export default function InventoryScreen({ navigation }: Props) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State cho Modal thêm món
  const [modalVisible, setModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Rau củ');
  const [expiryDate, setExpiryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem('inventory');
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load inventory', error);
    } finally {
      setLoading(false);
    }
  };

  const saveInventory = async (newItems: InventoryItem[]) => {
    try {
      await AsyncStorage.setItem('inventory', JSON.stringify(newItems));
      setItems(newItems);
    } catch (error) {
      console.error('Failed to save inventory', error);
    }
  };

  const addItem = () => {
    if (!newItemName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên thực phẩm');
      return;
    }

    const newItem: InventoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: newItemName,
      quantity: newItemQty || '1',
      category: newItemCategory,
      expiryDate: expiryDate.toISOString(),
    };

    const updated = [...items, newItem];
    saveInventory(updated);
    setModalVisible(false);
    setNewItemName('');
    setNewItemQty('');
    setExpiryDate(new Date());
  };

  const removeItem = (id: string) => {
    Alert.alert('Xóa thực phẩm', 'Bạn có chắc muốn xóa món này khỏi tủ lạnh?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => {
        const updated = items.filter(i => i.id !== id);
        saveInventory(updated);
      }}
    ]);
  };

  const getStatusColor = (expiryDateStr: string) => {
    const today = new Date();
    const expiry = new Date(expiryDateStr);
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return colors.error; // Đã hỏng
    if (diffDays <= 2) return '#FF9500'; // Sắp hỏng
    return colors.success; // Còn tươi
  };

  const getStatusText = (expiryDateStr: string) => {
    const today = new Date();
    const expiry = new Date(expiryDateStr);
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Đã hết hạn';
    if (diffDays === 0) return 'Hết hạn hôm nay';
    if (diffDays <= 2) return `Còn ${diffDays} ngày`;
    return `Hạn dùng: ${expiry.toLocaleDateString('vi-VN')}`;
  };

  const renderItem = ({ item }: { item: InventoryItem }) => {
    const statusColor = getStatusColor(item.expiryDate);
    return (
      <View style={[styles.itemCard, { backgroundColor: colors.card, borderRadius: borderRadius.lg }]}>
        <View style={[styles.categoryBar, { backgroundColor: statusColor }]} />
        <View style={styles.itemInfo}>
          <Text style={[typography.h3, { color: colors.text }]}>{item.name}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            Số lượng: {item.quantity} • {item.category}
          </Text>
          <Text style={[typography.caption, { color: statusColor, fontWeight: 'bold', marginTop: 4 }]}>
            {getStatusText(item.expiryDate)}
          </Text>
        </View>
        <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[typography.h2, { color: colors.text, flex: 1, textAlign: 'center' }]}>Tủ lạnh của bạn</Text>
        
        {items.length > 0 && (
          <TouchableOpacity 
            onPress={() => {
              const names = items.map(i => i.name);
              navigation.navigate('AIResult', { initialIngredients: names });
            }} 
            style={styles.magicBtn}
          >
            <Ionicons name="sparkles" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
          <Ionicons name="add-circle" size={32} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={items.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: spacing.lg }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="snow-outline" size={80} color={colors.border} />
            <Text style={[typography.h3, { color: colors.textSecondary, marginTop: 16 }]}>Tủ lạnh đang trống</Text>
            <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>
              Hãy thêm thực phẩm bạn đang có để AI gợi ý món ăn phù hợp nhất!
            </Text>
          </View>
        }
      />

      {/* Modal thêm thực phẩm */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, borderRadius: borderRadius.xl }]}>
            <Text style={[typography.h2, { color: colors.text, marginBottom: 20 }]}>Thêm thực phẩm</Text>
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderRadius: borderRadius.md }]}
              placeholder="Tên thực phẩm (vd: Thịt bò, Cải bó xôi...)"
              placeholderTextColor={colors.textSecondary}
              value={newItemName}
              onChangeText={setNewItemName}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderRadius: borderRadius.md, marginTop: 12 }]}
              placeholder="Số lượng (vd: 500g, 2 quả...)"
              placeholderTextColor={colors.textSecondary}
              value={newItemQty}
              onChangeText={setNewItemQty}
            />

            <Text style={[typography.caption, { color: colors.text, marginTop: 16, marginBottom: 8 }]}>Danh mục</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity 
                  key={cat}
                  onPress={() => setNewItemCategory(cat)}
                  style={[
                    styles.catPill, 
                    { 
                      backgroundColor: newItemCategory === cat ? colors.primary : colors.card,
                      borderRadius: 20
                    }
                  ]}
                >
                  <Text style={{ color: newItemCategory === cat ? '#FFF' : colors.text }}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity 
              style={[styles.dateBtn, { backgroundColor: colors.card, borderRadius: borderRadius.md }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={{ marginLeft: 10, color: colors.text }}>
                Hạn sử dụng: {expiryDate.toLocaleDateString('vi-VN')}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={expiryDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setExpiryDate(selectedDate);
                }}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.border }]} onPress={() => setModalVisible(false)}>
                <Text style={{ color: colors.textSecondary }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={addItem}>
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Thêm vào tủ</Text>
              </TouchableOpacity>
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
  magicBtn: { padding: 8, marginRight: 8 },
  addBtn: { padding: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  itemCard: {
    flexDirection: 'row',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryBar: { width: 6 },
  itemInfo: { flex: 1, padding: 16 },
  deleteBtn: { padding: 16, justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { padding: 24, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  input: { padding: 14, fontSize: 16 },
  catPill: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 8 },
  dateBtn: { flexDirection: 'row', alignItems: 'center', padding: 14, marginTop: 4 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  modalBtn: { flex: 0.48, padding: 16, borderRadius: 12, alignItems: 'center' },
});
