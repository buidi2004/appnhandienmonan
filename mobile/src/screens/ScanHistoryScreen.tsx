import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/theme';
import EmptyState from '../components/EmptyState';
import { AppBackground } from '../components/ui/AppBackground';
import { GlassCard } from '../components/ui/GlassCard';

const HISTORY_KEY = 'scanHistory';

type Props = NativeStackScreenProps<RootStackParamList, 'ScanHistory'>;

type ScanHistoryItem = {
  id: string;
  type: 'ingredient' | 'dish';
  title: string;
  imageUri?: string;
  ingredients?: string[];
  recipesCount?: number;
  dishName?: string;
  timestamp: string;
};

export default function ScanHistoryScreen({ navigation }: Props) {
  const { spacing } = useAppTheme();
  const [items, setItems] = useState<ScanHistoryItem[]>([]);
  const entryAnim = useRef(new Animated.Value(0)).current;

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(HISTORY_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      setItems(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      setItems([]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  useEffect(() => {
    Animated.timing(entryAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, [entryAnim]);

  const handleOpen = (item: ScanHistoryItem) => {
    if (item.type === 'dish' && item.imageUri) {
      navigation.navigate('DishResult', { imageUri: item.imageUri });
      return;
    }

    navigation.navigate('AIResult', {
      imageUri: item.imageUri,
      initialIngredients: item.ingredients,
      scanMode: 'quick',
    });
  };

  const renderItem = ({ item }: { item: ScanHistoryItem }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => handleOpen(item)}
    >
      <GlassCard variant="default" style={styles.card}>
        {item.imageUri ? (
          <Image source={{ uri: item.imageUri }} style={styles.preview} />
        ) : (
          <GlassCard variant="chip" style={styles.previewPlaceholder}>
            <Ionicons name="scan-outline" size={24} color="#7C4DFF" />
          </GlassCard>
        )}
        <View style={styles.cardBody}>
          <View style={styles.badgeRow}>
            <GlassCard variant="chip" style={styles.badge}>
              <Text style={[styles.badgeText, { color: item.type === 'dish' ? '#FF6584' : '#7C4DFF' }]}> 
                {item.type === 'dish' ? 'MÓN ĂN' : 'NGUYÊN LIỆU'}
              </Text>
            </GlassCard>
            <Text style={[styles.timeText, { color: 'rgba(255,255,255,0.65)' }]}>{new Date(item.timestamp).toLocaleString('vi-VN')}</Text>
          </View>
          <Text style={[styles.title, { color: '#FFFFFF' }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.65)' }]} numberOfLines={2}>
            {item.type === 'dish'
              ? `Món: ${item.dishName || item.title}`
              : `${item.ingredients?.length || 0} nguyên liệu · ${item.recipesCount || 0} gợi ý`}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.35)" />
      </GlassCard>
    </TouchableOpacity>
  );

  return (
    <AppBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}> 
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}> 
            <GlassCard variant="default" style={styles.backBtn}>
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </GlassCard>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lịch sử nhận diện</Text>
          <View style={{ width: 44 }} />
        </View>

        <Animated.View style={{ flex: 1, backgroundColor: 'transparent', opacity: entryAnim, transform: [{ translateY: entryAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
          {items.length === 0 ? (
            <EmptyState
              icon="scan-outline"
              title="Chưa có lịch sử"
              description="Các lần quét sẽ tự lưu để bạn mở lại công thức nhanh hơn."
              buttonText="Quét ngay"
              onPress={() => navigation.navigate('MainTabs')}
            />
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={{ padding: spacing.lg, paddingBottom: 30 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Animated.View>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 },
  backBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFFFFF', flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 12, borderRadius: 24 },
  preview: { width: 72, height: 72, borderRadius: 20 },
  previewPlaceholder: { width: 72, height: 72, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  cardBody: { flex: 1, marginLeft: 16 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  timeText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  title: { fontSize: 16, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontWeight: '600', lineHeight: 18 },
});
