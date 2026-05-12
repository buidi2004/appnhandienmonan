import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import API_CONFIG from '../config/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AlertManager from '../components/CustomAlert';
import RealImage from '../components/RealImage';
import { AppBackground } from '../components/ui/AppBackground';
import { GlassCard } from '../components/ui/GlassCard';
import { shadow } from '../theme/shadow';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

interface PantryItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  expiry_date: string;
}

export default function PantryScreen({ navigation }: any) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('g');

  useEffect(() => {
    fetchPantry();
  }, []);

  const fetchPantry = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/pantry`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.data) {
        setItems(data.data);
      }
    } catch (e) {
      console.error('Failed to fetch pantry', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemName) return;
    try {
      const token = await AsyncStorage.getItem('userToken');
      await fetch(`${API_CONFIG.BASE_URL}/api/pantry/update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newItemName,
          quantity: newItemQty,
          unit: newItemUnit,
          expiry_date: '2026-06-01' // Giả lập
        })
      });
      setShowAddModal(false);
      setNewItemName('');
      setNewItemQty('');
      fetchPantry();
    } catch (e) {
      AlertManager.alert('Lỗi', 'Không thể thêm nguyên liệu.');
    }
  };

  const renderItem = ({ item }: { item: PantryItem }) => {
    const isExpiring = true; // Giả lập logic kiểm tra ngày

    return (
      <GlassCard variant="default" style={styles.itemCard}>
        <View style={styles.imageBox}>
          <RealImage query={item.name} style={styles.ingredientImage} />
        </View>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={[{ color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: -0.3 }]}>{item.name}</Text>
          <Text style={[{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2, fontWeight: '600' }]}>
            {item.quantity} {item.unit} • Hết hạn: {item.expiry_date}
          </Text>
        </View>
        {isExpiring && (
          <GlassCard variant="pink" style={styles.alertBadge}>
            <Text style={styles.alertText}>Sắp hết hạn</Text>
          </GlassCard>
        )}
      </GlassCard>
    );
  };

  return (
    <AppBackground>
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={styles.backBtnWrapper}>
          <GlassCard variant="default" style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </GlassCard>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kệ thực phẩm</Text>
        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowAddModal(true);
          }}
        >
          <GlassCard variant="purple" style={styles.addBtnGlass}>
            <Ionicons name="add" size={24} color="#FFF" />
          </GlassCard>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#7C4DFF" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="cube-outline" size={80} color="rgba(255,255,255,0.15)" />
              <Text style={[typography.body, { color: 'rgba(255,255,255,0.65)', marginTop: 16 }]}>Tủ lạnh đang trống</Text>
            </View>
          }
        />
      )}

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <GlassCard variant="modal" style={styles.modalContent}>
            <Text style={[{ color: '#FFFFFF', marginBottom: 20, fontSize: 20, fontWeight: 'bold' }]}>Thêm nguyên liệu</Text>
            
            <GlassCard variant="input" style={styles.inputWrapper}>
              <TextInput 
                style={[styles.input, { color: '#FFFFFF' }]}
                placeholder="Tên nguyên liệu"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={newItemName}
                onChangeText={setNewItemName}
              />
            </GlassCard>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <GlassCard variant="input" style={[styles.inputWrapper, { flex: 1 }]}>
                <TextInput 
                  style={[styles.input, { color: '#FFFFFF' }]}
                  placeholder="Số lượng"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  keyboardType="numeric"
                  value={newItemQty}
                  onChangeText={setNewItemQty}
                />
              </GlassCard>
              <GlassCard variant="input" style={[styles.inputWrapper, { width: 80 }]}>
                <TextInput 
                  style={[styles.input, { color: '#FFFFFF' }]}
                  placeholder="Đơn vị"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={newItemUnit}
                  onChangeText={setNewItemUnit}
                />
              </GlassCard>
            </View>
            
            <TouchableOpacity 
              activeOpacity={0.85}
              style={{ width: '100%' }}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                handleAddItem();
              }}
            >
              <LinearGradient
                colors={['#7C4DFF', '#FF6584']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.submitBtn, { ...shadow.md }]}
              >
                <Text style={styles.submitText}>LƯU VÀO KHO</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setShowAddModal(false)}>
              <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 24, fontWeight: '900', textTransform: 'uppercase', fontSize: 11, letterSpacing: 1 }}>Đóng</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </Modal>
    </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 80, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, marginBottom: 10 },
  backBtnWrapper: { zIndex: 10 },
  backBtn: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFFFFF', flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  addBtnGlass: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  itemCard: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 16, borderRadius: 28 },
  imageBox: { width: 64, height: 64, borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(30, 10, 60, 0.8)' },
  ingredientImage: { width: '100%', height: '100%' },
  alertBadge: { paddingHorizontal: 10, paddingVertical: 4 },
  alertText: { color: '#FFF', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyBox: { marginTop: 100, alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { padding: 32, borderRadius: 40 },
  inputWrapper: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 20,
  },
  input: { height: 60, paddingHorizontal: 20, fontSize: 15, fontWeight: '600' },
  submitBtn: { height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  submitText: { color: '#FFF', fontWeight: '900', fontSize: 14, letterSpacing: 1 }
});
