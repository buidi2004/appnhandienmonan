import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import API_CONFIG from '../config/apiConfig';
import EmptyState from '../components/EmptyState';
import AnimatedButton from '../components/AnimatedButton';
import AlertManager from '../components/CustomAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncService } from '../services/syncService';
import { AppBackground } from '../components/ui/AppBackground';
import { GlassCard } from '../components/ui/GlassCard';
import { themeColors, gradients, glow, borderRadius } from '../theme';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'DishResult'>;

interface DishInfo {
  dish_name?: string;
  description?: string;
  ingredients?: string[];
  instructions?: string | string[];
  prep_time?: string;
  difficulty?: string;
  calories?: string;
  tips?: string;
  origin?: string;
  confidence?: number;
  alternatives?: string[];
}

const splitInstructions = (instructions?: string | string[]) => {
  if (!instructions) return [];
  if (Array.isArray(instructions)) return instructions;
  const parts = instructions.split(/Bước\s*\d+[:.]|\r?\n+/).map(p => p.trim()).filter(Boolean);
  return parts.length > 0 ? parts : [instructions];
};

export default function DishResultScreen({ route, navigation }: Props) {
  const { spacing } = useAppTheme();
  const { imageUri } = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [dish, setDish] = useState<DishInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);
  const hasSavedHistory = useRef(false);

  const instructions = useMemo(() => splitInstructions(dish?.instructions).slice(0, 4), [dish?.instructions]);

  const fetchDish = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        name: 'dish.jpg',
        type: 'image/jpeg',
      } as any);

      const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.IDENTIFY_DISH}?mode=quick`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data?.dish) {
        setDish(response.data.dish);
      } else {
        setErrorMessage('Không thể nhận diện món ăn.');
      }
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.error || 'Không thể kết nối tới máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDish();
  }, [imageUri]);

  useEffect(() => {
    if (!dish || hasSavedHistory.current) return;
    const saveHistory = async () => {
      try {
        const stored = await AsyncStorage.getItem('scanHistory');
        const current = stored ? JSON.parse(stored) : [];
        const entry = {
          id: Date.now().toString(),
          type: 'dish',
          title: dish.dish_name || 'Nhận diện món',
          imageUri,
          dishName: dish.dish_name,
          timestamp: new Date().toISOString(),
        };
        const updated = [entry, ...current].slice(0, 50);
        await AsyncStorage.setItem('scanHistory', JSON.stringify(updated));
        await syncService.syncScanHistory(updated);
        hasSavedHistory.current = true;
      } catch (e) {}
    };
    saveHistory();
  }, [dish, imageUri]);

  const fetchDishDetail = async (): Promise<DishInfo | null> => {
    try {
      setIsFetchingDetail(true);
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        name: 'dish.jpg',
        type: 'image/jpeg',
      } as any);

      const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.IDENTIFY_DISH}?mode=detail`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return response.data?.dish || null;
    } catch (error: any) {
      AlertManager.alert('Lỗi nhận diện', error?.response?.data?.error || 'Không thể tải công thức chi tiết.');
      return null;
    } finally {
      setIsFetchingDetail(false);
    }
  };

  const handleViewRecipe = () => {
    if (!dish) return;
    fetchDishDetail().then((detail) => {
      if (!detail) return;
      navigation.navigate('AIResult', {
        imageUri,
        initialRecipe: {
          title: detail.dish_name || dish.dish_name || 'Món ăn mới',
          description: detail.description,
          ingredients: detail.ingredients || [],
          instructions: detail.instructions || '',
          prep_time: detail.prep_time,
          difficulty: detail.difficulty,
          calories: detail.calories,
          tips: detail.tips,
        },
      });
    });
  };

  if (isLoading) {
    return (
      <AppBackground>
        <SafeAreaView style={[styles.center, { backgroundColor: 'transparent' }]}>
          <ActivityIndicator size="large" color="#7C4DFF" />
          <Text style={[{ color: 'rgba(255,255,255,0.65)', marginTop: spacing.md }]}>Đang nhận diện món ăn...</Text>
        </SafeAreaView>
      </AppBackground>
    );
  }

  if (errorMessage || !dish) {
    return (
      <AppBackground>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
          <View style={{ padding: spacing.lg }}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()}>
              <GlassCard variant="default" style={styles.backBtnStatic}>
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              </GlassCard>
            </TouchableOpacity>
          </View>
          <EmptyState
            icon="restaurant-outline"
            title="Không nhận diện được món"
            description={errorMessage || 'Vui lòng thử chụp rõ hơn hoặc chọn ảnh khác.'}
            buttonText="Thử lại"
            onPress={fetchDish}
          />
        </SafeAreaView>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}> 
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.headerWrap}>
            <Image source={{ uri: imageUri }} style={styles.headerImage} />
            <LinearGradient colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']} style={styles.headerOverlay} />
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={styles.backBtnWrapper}>
              <GlassCard variant="default" style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </GlassCard>
            </TouchableOpacity>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>Kết quả nhận diện</Text>
              <Text style={styles.headerSubtitle}>Hãy kiểm tra lại thông tin bên dưới</Text>
            </View>
          </View>

          <View style={{ padding: spacing.lg }}>
            <View style={[styles.titleRow, { marginBottom: spacing.md }]}> 
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(124, 77, 255, 0.15)' }]}>
                <Ionicons name="restaurant-outline" size={18} color="#7C4DFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dishName}>{dish.dish_name || 'Món ăn mới'}</Text>
                {!!dish.origin && <Text style={styles.originText}>{dish.origin}</Text>}
              </View>
            </View>

            <View style={styles.noticeRow}>
              <Ionicons name="alert-circle" size={16} color="#FF9500" />
              <Text style={styles.noticeText}>Kết quả nhanh, có thể cần kiểm tra lại</Text>
            </View>

            {(dish.confidence !== undefined || (dish.alternatives && dish.alternatives.length > 0)) && (
              <GlassCard variant="default" style={styles.sectionCard}> 
                <Text style={styles.sectionTitle}>Độ tin cậy</Text>
                {dish.confidence !== undefined && (
                  <View style={styles.confidenceRow}>
                    <Ionicons name="speedometer-outline" size={16} color="#7C4DFF" />
                    <Text style={styles.confidenceText}>{dish.confidence}%</Text>
                  </View>
                )}
                {dish.alternatives && dish.alternatives.length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.alternativesLabel}>Gợi ý khác:</Text>
                    <View style={styles.chipWrap}>
                      {dish.alternatives.map((alt, idx) => (
                        <GlassCard key={idx} variant="chip" style={styles.chip}> 
                          <Ionicons name="restaurant" size={12} color="#7C4DFF" />
                          <Text style={styles.chipText}>{alt}</Text>
                        </GlassCard>
                      ))}
                    </View>
                  </View>
                )}
              </GlassCard>
            )}

            {(dish.prep_time || dish.difficulty || dish.calories) && (
              <View style={styles.metaRow}> 
                {!!dish.prep_time && (
                  <GlassCard variant="chip" style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color="#7C4DFF" />
                    <Text style={styles.metaText}>{dish.prep_time}</Text>
                  </GlassCard>
                )}
                {!!dish.difficulty && (
                  <GlassCard variant="chip" style={[styles.metaItem, { borderColor: 'rgba(255, 101, 132, 0.3)' }]}>
                    <Ionicons name="bar-chart-outline" size={14} color="#FF6584" />
                    <Text style={[styles.metaText, { color: '#FF6584' }]}>{dish.difficulty}</Text>
                  </GlassCard>
                )}
                {!!dish.calories && (
                  <GlassCard variant="chip" style={[styles.metaItem, { borderColor: 'rgba(255, 149, 0, 0.3)' }]}>
                    <Ionicons name="flame-outline" size={14} color="#FF9500" />
                    <Text style={[styles.metaText, { color: '#FF9500' }]}>{dish.calories}</Text>
                  </GlassCard>
                )}
              </View>
            )}

            {!!dish.description && (
              <GlassCard variant="default" style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Mô tả món ăn</Text>
                <Text style={styles.sectionText}>{dish.description}</Text>
              </GlassCard>
            )}

            {!!(dish.ingredients && dish.ingredients.length > 0) && (
              <GlassCard variant="default" style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Nguyên liệu chính</Text>
                <View style={styles.chipWrap}>
                  {dish.ingredients.map((item, idx) => (
                    <GlassCard key={idx} variant="chip" style={styles.ingChip}> 
                      <Ionicons name="checkmark-circle" size={14} color="#43E97B" />
                      <Text style={styles.ingChipText}>{item}</Text>
                    </GlassCard>
                  ))}
                </View>
              </GlassCard>
            )}

            {!!(instructions.length > 0) && (
              <GlassCard variant="default" style={styles.sectionCard}> 
                <Text style={styles.sectionTitle}>Hướng dẫn tóm tắt</Text>
                {instructions.map((step, idx) => (
                  <View key={idx} style={styles.stepRow}>
                    <View style={styles.stepBadge}> 
                      <Text style={styles.stepBadgeText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.stepTextContent}>{step}</Text>
                  </View>
                ))}
              </GlassCard>
            )}

            {!!dish.tips && (
              <GlassCard variant="purple" style={styles.tipBox}> 
                <Ionicons name="bulb" size={18} color="#7C4DFF" />
                <Text style={styles.tipText}>
                  <Text style={{ fontWeight: '900', color: '#7C4DFF' }}>Mẹo: </Text>
                  {dish.tips}
                </Text>
              </GlassCard>
            )}

            <View style={styles.actionRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.secondaryBtnWrapper}
                onPress={() => navigation.goBack()}
              >
                <GlassCard variant="default" style={styles.secondaryBtn}>
                  <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.secondaryBtnText}>Quét lại</Text>
                </GlassCard>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.primaryBtnWrapper}
                onPress={handleViewRecipe}
                disabled={isFetchingDetail}
              >
                <LinearGradient
                  colors={gradients.button}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ ...glow.button, ...styles.primaryBtn }}
                >
                  {isFetchingDetail ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Ionicons name="restaurant" size={18} color="#FFF" />
                  )}
                  <Text style={styles.primaryBtnText}>Xem công thức</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerWrap: { height: 380, width: '100%' },
  headerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  headerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  backBtnWrapper: { position: 'absolute', top: 50, left: 24, zIndex: 10 },
  backBtnStatic: { width: 56, height: 56, justifyContent: 'center', alignItems: 'center', borderRadius: borderRadius.lg },
  backBtn: { width: 56, height: 56, justifyContent: 'center', alignItems: 'center', borderRadius: borderRadius.lg },
  headerTextWrap: { position: 'absolute', bottom: 40, left: 24, right: 24 },
  headerTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -1, color: '#FFFFFF' },
  headerSubtitle: { fontSize: 16, marginTop: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconCircle: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  dishName: { fontSize: 38, fontWeight: '900', letterSpacing: -1.5, color: '#FFFFFF' },
  originText: { fontSize: 17, marginTop: 8, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  metaItem: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: borderRadius.lg },
  metaText: { fontSize: 14, fontWeight: '900', color: '#7C4DFF' },
  sectionCard: { padding: 32, marginBottom: 24, borderRadius: borderRadius.xl },
  sectionTitle: { fontSize: 20, fontWeight: '900', marginBottom: 18, color: '#FFFFFF', letterSpacing: -0.5 },
  sectionText: { fontSize: 16, lineHeight: 26, color: 'rgba(255,255,255,0.65)', fontWeight: '600' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  chip: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: borderRadius.lg },
  ingChip: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: borderRadius.xl },
  chipText: { fontSize: 14, fontWeight: '900', color: '#7C4DFF' },
  ingChipText: { fontSize: 15, fontWeight: '900', color: '#43E97B' },
  noticeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, paddingHorizontal: 20, borderRadius: borderRadius.xl, backgroundColor: 'rgba(255, 149, 0, 0.08)', borderWidth: 1, borderColor: 'rgba(255, 149, 0, 0.15)', marginBottom: 24 },
  noticeText: { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.7)' },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  confidenceText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '900' },
  alternativesLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '900', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1.5 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 20 },
  stepBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: themeColors.purple },
  stepBadgeText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  stepTextContent: { fontSize: 16, lineHeight: 26, color: 'rgba(255,255,255,0.75)', flex: 1, fontWeight: '600' },
  tipBox: { flexDirection: 'row', gap: 14, padding: 32, alignItems: 'flex-start', marginBottom: 40, borderRadius: borderRadius.xl },
  tipText: { flex: 1, fontSize: 16, lineHeight: 26, color: 'rgba(255,255,255,0.85)' },
  actionRow: { flexDirection: 'row', gap: 16, marginTop: 16 },
  secondaryBtnWrapper: { flex: 1 },
  secondaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, height: 72, borderRadius: borderRadius.xl },
  secondaryBtnText: { fontSize: 17, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
  primaryBtnWrapper: { flex: 1 },
  primaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, height: 72, borderRadius: borderRadius.xl },
  primaryBtnText: { color: '#FFF', fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
});
