import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, ScrollView, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import API_CONFIG from '../config/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import AlertManager from '../components/CustomAlert';
import { LinearGradient } from 'expo-linear-gradient';
import { AppBackground } from '../components/ui/AppBackground';
import { GlassCard } from '../components/ui/GlassCard';
import { borderWidth, borderRadius, borderColors } from '../theme/borders';

export default function MealAnalysisScreen({ navigation }: any) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const scannerAnim = useRef(new Animated.Value(0)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (result && !loading) {
      Animated.spring(resultAnim, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true
      }).start();
    } else {
      resultAnim.setValue(0);
    }
  }, [result, loading]);

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scannerAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(scannerAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      scannerAnim.setValue(0);
    }
  }, [loading]);

  const pickImage = async () => {
    setError(null);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      AlertManager.alert('Quyền truy cập', 'Vui lòng cấp quyền sử dụng camera để phân tích món ăn.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      analyzeMeal(result.assets[0].uri);
    }
  };

  const analyzeMeal = async (uri: string) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const formData = new FormData();
      formData.append('image', {
        uri,
        name: 'meal.jpg',
        type: 'image/jpeg',
      } as any);

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/ai/analyze-meal`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // 'Content-Type': 'multipart/form-data', // Fetch will set this automatically with boundary
        },
        body: formData,
      });

      const data = await response.json();
      if (data && data.success && data.data) {
        setResult(data.data);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Tặng 20 XP cho mỗi lần phân tích bữa ăn
        try {
          await fetch(`${API_CONFIG.BASE_URL}/api/user/add-xp`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ amount: 20, action: 'meal_analysis' }),
          });
        } catch (e) {}
      } else {
        setError(data.message || 'Không thể phân tích hình ảnh này.');
      }
    } catch (e) {
      console.error('Meal analysis failed', e);
      setError('Đã xảy ra lỗi khi kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.headerTitle}>Phân tích bữa ăn</Text>
          <View style={{ width: 52 }} />
        </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {error && (
          <GlassCard variant="default" style={styles.errorBox}>
            <Ionicons name="alert-circle" size={24} color="#FF4757" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)}>
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
          </GlassCard>
        )}
        {!image ? (
          <GlassCard 
            variant="default"
            style={styles.uploadBox} 
          >
            <TouchableOpacity 
              activeOpacity={0.8}
              style={{ width: '100%', alignItems: 'center' }}
              onPress={pickImage}
            >
              <View style={[styles.iconBox, { backgroundColor: 'rgba(124, 77, 255, 0.12)' }]}>
                <Ionicons name="camera" size={44} color="#7C4DFF" />
              </View>
              <Text style={styles.uploadTitle}>Chụp ảnh món ăn</Text>
              <Text style={styles.uploadSubtitle}>
                AI sẽ phân tích Calo & Dinh dưỡng{'\n'}từ hình ảnh thực tế
              </Text>
            </TouchableOpacity>
          </GlassCard>
        ) : (
          <View style={styles.resultContainer}>
            <View style={styles.imageWrapper}>
              <Image source={{ uri: image }} style={[styles.mainImage, { borderRadius: 44 }]} />
              {loading && (
                <View style={styles.scannerOverlay}>
                  <Animated.View style={[styles.scannerBar, { 
                    backgroundColor: '#7C4DFF',
                    transform: [{ translateY: scannerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 250]
                    }) }]
                  }]} />
                </View>
              )}
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7C4DFF" />
                <Text style={[{ color: 'rgba(255,255,255,0.65)', marginTop: 20, fontWeight: '700', fontSize: 14 }]}>Đang phân tích vi chất...</Text>
              </View>
            ) : result && (
              <Animated.View style={{ 
                width: '100%',
                opacity: resultAnim,
                transform: [{ scale: resultAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }]
              }}>
                <GlassCard variant="default" style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.dishNameText}>{result.dish_name}</Text>
                  <GlassCard variant="purple" style={styles.calorieBadge}>
                    <Text style={styles.calorieValueText}>{result.calories} kcal</Text>
                  </GlassCard>
                </View>
                
                <View style={styles.nutritionSection}>
                  <NutritionBar label="Protein" value={result.protein} target={60} color="#FF6584" />
                  <NutritionBar label="Carbs" value={result.carbs} target={250} color="#7C4DFF" />
                  <NutritionBar label="Fat" value={result.fat} target={70} color="#FFD700" />
                </View>

                {result.health_advice && (
                  <View style={styles.adviceBox}>
                    <View style={styles.adviceHeader}>
                      <Ionicons name="shield-checkmark" size={22} color="#43E97B" />
                      <Text style={styles.adviceTitleText}>AI Tư vấn</Text>
                      <View style={{ flex: 1 }} />
                      <GlassCard variant="chip" style={styles.scoreBadge}>
                        <Text style={styles.scoreText}>{result.health_score} ĐIỂM</Text>
                      </GlassCard>
                    </View>
                    <Text style={styles.adviceDescText}>
                      {result.health_advice}
                    </Text>
                  </View>
                )}

                <View style={styles.ingredientsSection}>
                  <Text style={styles.ingredientsLabel}>Nguyên liệu nhận diện</Text>
                  <View style={styles.ingredientsList}>
                    {result.ingredients?.map((ing: string, i: number) => (
                      <GlassCard key={i} variant="chip" style={styles.ingBadge}>
                        <Text style={styles.ingBadgeText}>{ing}</Text>
                      </GlassCard>
                    ))}
                  </View>
                </View>

                <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={async () => {
                    setLoading(true);
                    try {
                      const token = await AsyncStorage.getItem('userToken');
                      await fetch(`${API_CONFIG.BASE_URL}/api/community/post`, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          dish_name: result.dish_name,
                          image_url: image,
                          calories: result.calories,
                          macros: { protein: result.protein, carbs: result.carbs, fat: result.fat }
                        })
                      });
                      AlertManager.alert('Thành công', 'Đã chia sẻ món ăn lên cộng đồng! +50 XP');
                      navigation.navigate('Community');
                    } catch (e) {
                      AlertManager.alert('Lỗi', 'Không thể chia sẻ bài viết.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  <LinearGradient
                    colors={['#7C4DFF', '#FF6584']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.shareBtn}
                  >
                    <Ionicons name="share-social" size={20} color="#FFF" style={{ marginRight: 10 }} />
                    <Text style={styles.shareBtnText}>CHIA SẺ CỘNG ĐỒNG</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={() => { setImage(null); setResult(null); }}
                  style={{ marginTop: 12 }}
                >
                  <GlassCard variant="default" style={styles.resetBtn}>
                    <Ionicons name="camera-reverse" size={20} color="#FFFFFF" style={{ marginRight: 10 }} />
                    <Text style={styles.resetBtnText}>Chụp lại ảnh</Text>
                  </GlassCard>
                </TouchableOpacity>
              </GlassCard>
            </Animated.View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
    </AppBackground>
  );
}

function NutritionBar({ label, value, target, color }: any) {
  const percentage = Math.min((value / target) * 100, 100);

  return (
    <View style={styles.nutriBarContainer}>
      <View style={styles.nutriBarHeader}>
        <Text style={styles.nutriLabel}>{label}</Text>
        <Text style={styles.nutriValue}>{value}g / {target}g</Text>
      </View>
      <View style={styles.nutriBarBase}>
        <View style={[styles.nutriBarFill, { backgroundColor: color, width: `${percentage}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 80, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, marginBottom: 10 },
  backBtnWrapper: { zIndex: 10 },
  backBtn: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#FFFFFF', flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  uploadBox: { 
    height: 400, 
    borderWidth: borderWidth.normal, 
    borderStyle: 'dashed', 
    borderColor: borderColors.purple.subtle, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 32, 
    marginTop: 24, 
    borderRadius: borderRadius.xl, 
    overflow: 'hidden' 
  },
  iconBox: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center' },
  uploadTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '900', marginTop: 32, letterSpacing: -1 },
  uploadSubtitle: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 14, fontSize: 16, lineHeight: 26, fontWeight: '600' },
  resultContainer: { alignItems: 'center', width: '100%' },
  imageWrapper: { width: '100%', height: 340, position: 'relative', marginBottom: 32, overflow: 'hidden', borderRadius: 44 },
  mainImage: { width: '100%', height: '100%' },
  scannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.1)' },
  scannerBar: { height: 4, width: '100%', shadowColor: '#7C4DFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 15, elevation: 10 },
  loadingContainer: { padding: 40, alignItems: 'center' },
  resultCard: { width: '100%', padding: 32, marginBottom: 40, borderRadius: 44 },
  resultHeader: { alignItems: 'center', marginBottom: 36 },
  dishNameText: { color: '#FFFFFF', textAlign: 'center', fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  calorieBadge: { marginTop: 20, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 28 },
  calorieValueText: { fontSize: 32, fontWeight: '900', letterSpacing: -1.5, color: '#FFFFFF' },
  nutritionSection: { marginBottom: 36, gap: 28 },
  nutriBarContainer: { width: '100%' },
  nutriBarHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  nutriLabel: { fontSize: 14, fontWeight: '900', color: '#FFFFFF' },
  nutriValue: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.4)' },
  nutriBarBase: { height: 12, borderRadius: 6, overflow: 'hidden', backgroundColor: 'rgba(30, 10, 60, 0.8)' },
  nutriBarFill: { height: '100%', borderRadius: 6 },
  ingredientsSection: { borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.05)', paddingTop: 36, marginBottom: 36 },
  ingredientsLabel: { color: '#FFFFFF', marginBottom: 24, fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  ingredientsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  ingBadge: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 20 },
  ingBadgeText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  resetBtn: { height: 72, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderRadius: 28 },
  resetBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
  shareBtn: { height: 72, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderRadius: 28 },
  shareBtnText: { color: '#FFF', fontWeight: '900', fontSize: 17, letterSpacing: 1.5 },
  adviceBox: { padding: 28, borderRadius: 36, borderWidth: 1, backgroundColor: 'rgba(67, 233, 123, 0.03)', borderColor: 'rgba(67, 233, 123, 0.15)', marginBottom: 36 },
  adviceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  adviceTitleText: { color: '#43E97B', marginLeft: 12, fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  adviceDescText: { color: 'rgba(255,255,255,0.7)', marginTop: 6, lineHeight: 26, fontSize: 15, fontWeight: '600' },
  scoreBadge: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  scoreText: { color: '#43E97B', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  errorBox: { flexDirection: 'row', alignItems: 'center', padding: 20, marginBottom: 24, borderRadius: 20, backgroundColor: 'rgba(255, 71, 87, 0.1)', borderColor: 'rgba(255, 71, 87, 0.2)', borderWidth: 1, gap: 12 },
  errorText: { flex: 1, color: '#FF4757', fontWeight: '700', fontSize: 14 },
});
