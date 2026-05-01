import AlertManager from '../components/CustomAlert';
import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ActivityIndicator, 
  ScrollView, 
  Animated, 
  TouchableOpacity,
  Dimensions,
  Modal,
  ImageSourcePropType,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebaseConfig';
import API_CONFIG from '../config/apiConfig';
import { RealImage, SafeImage, fetchImageUrl } from '../components/RealImage';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedButton from '../components/AnimatedButton';
import GlassCard from '../components/GlassCard';
import EmptyState from '../components/EmptyState';

const { width, height } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 280;
const HEADER_MIN_HEIGHT = 100;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
const sentencesRegex = /[.!?](?:\s+|$)/;

type Props = NativeStackScreenProps<RootStackParamList, 'AIResult'>;

interface Recipe {
  title: string;
  ingredients: string[];
  instructions: string | string[];
  prep_time?: string;
  difficulty?: string;
  calories?: string;
  health_warning?: string;
  tips?: string;
  imageUrl?: string;
  available_ingredients?: string[];
  missing_ingredients?: string[];
  readiness?: 'ready' | 'missing_items' | 'health_check';
  health_score?: number;
  health_benefits?: string[];
  health_warnings?: string[];
  substitutions?: {original: string, replacement: string, reason: string}[];
  nutrition_detail?: {carbs: string, protein: string, fat: string, sugar: string, sodium: string};
}

export default function AIResultScreen({ route, navigation }: Props) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();
  const { imageUri, initialIngredients, initialRecipe } = route.params;
  const [isScanning, setIsScanning] = useState(!initialRecipe);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Đang khởi tạo...');
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipe ? [initialRecipe] : []);
  const [detectedIngredients, setDetectedIngredients] = useState<string[]>(initialIngredients || (initialRecipe ? initialRecipe.ingredients : []));

  // Hiệu ứng xoay vòng thông báo loading để tăng cảm giác phản hồi nhanh
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSuggesting || isScanning) {
      const messages = isScanning 
        ? ['Đang gửi ảnh lên máy chủ...', 'Đang nhận diện từng nguyên liệu...', 'Sắp xong rồi...']
        : [
            'Đang dựng món từ nguyên liệu trong bếp...',
            'Đang chọn công thức ít thiếu nguyên liệu nhất...',
            'Đang tính toán giá trị dinh dưỡng...',
            'Đang kiểm tra cảnh báo sức khỏe...',
            'Sắp xong rồi, chuẩn bị vào bếp nhé.',
          ];
      let i = 0;
      interval = setInterval(() => {
        i = (i + 1) % messages.length;
        setLoadingMessage(messages[i]);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isSuggesting, isScanning]);
  
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [bookmarked, setBookmarked] = useState<Record<number, boolean>>({});
  const [toast, setToast] = useState<{ visible: boolean, message: string } | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showToast = (message: string) => {
    setToast({ visible: true, message });
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(3000),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast(null));
  };

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const init = async () => {
      let healthProfile = null;
      try {
        const saved = await AsyncStorage.getItem('healthProfile');
        if (saved) healthProfile = JSON.parse(saved);
      } catch (e) {
        console.log('Error reading health profile:', e);
      }

      if (initialRecipe) {
        setIsScanning(false);
        checkIfBookmarked([initialRecipe]);
      } else if (initialIngredients && initialIngredients.length > 0) {
        await suggestRecipesDirectly(initialIngredients, healthProfile);
      } else if (imageUri) {
        await analyzeImage(healthProfile);
      } else {
        setIsScanning(false);
      }
    };
    init();
  }, []);

  const checkIfBookmarked = async (recipeList: Recipe[]) => {
    try {
      const user = auth.currentUser;
      const token = await user?.getIdToken();
      
      const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FAVORITES}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const currentFavorites = response.data || [];
      
      const newBookmarked: Record<number, boolean> = {};
      recipeList.forEach((recipe, index) => {
        if (currentFavorites.some((f: any) => f.title === recipe.title)) {
          newBookmarked[index] = true;
        }
      });
      setBookmarked(newBookmarked);
      
      // Sync lại local cho chắc chắn
      await AsyncStorage.setItem('favorites', JSON.stringify(currentFavorites));
    } catch (e) {
      console.error('Check Bookmark Error (DB failed, falling back to local):', e);
      // Fallback local
      const stored = await AsyncStorage.getItem('favorites');
      if (stored) {
        const currentFavorites = JSON.parse(stored);
        const newBookmarked: Record<number, boolean> = {};
        recipeList.forEach((recipe, index) => {
          if (currentFavorites.some((f: any) => f.title === recipe.title)) {
            newBookmarked[index] = true;
          }
        });
        setBookmarked(newBookmarked);
      }
    }
  };

  const addToShoppingList = async (recipe: Recipe) => {
    try {
      const stored = await AsyncStorage.getItem('shoppingList');
      const currentList = stored ? JSON.parse(stored) : [];
      
      const newItems = recipe.ingredients.map(ing => ({
        id: Math.random().toString(36).substr(2, 9),
        name: ing,
        checked: false,
        recipeTitle: recipe.title
      }));

      const updatedList = [...currentList, ...newItems];
      await AsyncStorage.setItem('shoppingList', JSON.stringify(updatedList));
      
      showToast(`Đã thêm ${newItems.length} nguyên liệu vào giỏ hàng!`);
    } catch (error: any) {
      console.log('Shopping List Error:', error.message);
      showToast('Không thể thêm vào danh sách.');
    }
  };

  const suggestRecipesDirectly = async (ingredients: string[], healthProfile: any = null) => {
    try {
      setIsSuggesting(true);
      setLoadingMessage('Đang dựng món từ nguyên liệu của bạn...');
      
      const payload: any = { ingredients: ingredients };
      if (healthProfile) {
        payload.health_profile = healthProfile;
      }

      const user = auth.currentUser;
      const token = await user?.getIdToken();
      
      const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SUGGEST_RECIPES}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.recipes) {
        setRecipes(response.data.recipes);
        checkIfBookmarked(response.data.recipes);
      }
      setIsSuggesting(false);
    } catch (error) {
      console.log('Suggest Error:', error);
      AlertManager.alert('Lỗi', 'Không thể lấy gợi ý món ăn.');
      setIsSuggesting(false);
    }
  };

  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (!selectedRecipe) setShowVideo(false);
  }, [selectedRecipe]);

  const analyzeImage = async (healthProfile: any = null) => {
    try {
      setIsScanning(true);
      setLoadingMessage('Đang phân tích nguyên liệu...');
      
      const scanUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SCAN_INGREDIENTS}`; 
      
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        name: 'photo.jpg',
        type: 'image/jpeg',
      } as any);
      if (healthProfile) {
        formData.append('health_profile', JSON.stringify(healthProfile));
      }

      const user = auth.currentUser;
      const token = await user?.getIdToken();

      // Bước 1: Chỉ quét nguyên liệu (Nhanh)
      const scanResponse = await axios.post(scanUrl, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setLoadingMessage(`Đang tải ảnh: ${percent}%`);
        }
      });
      
      const ingredients = scanResponse.data.ingredients || [];
      setDetectedIngredients(ingredients);
      setIsScanning(false); // Xong bước 1, hiện UI ngay
      
      // Increment scan count for profile
      try {
        const current = await AsyncStorage.getItem('scanCount');
        const newCount = (current ? parseInt(current) : 0) + 1;
        await AsyncStorage.setItem('scanCount', newCount.toString());
      } catch (e) {}
      
      // Bước 2: Gọi AI sáng tạo công thức (Chậm hơn)
      if (ingredients.length > 0) {
        setIsSuggesting(true);
        setLoadingMessage('Đang dựng món từ nguyên liệu trong bếp...');
        const suggestUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SUGGEST_RECIPES}`;
        
        const payload: any = { ingredients: ingredients };
        if (healthProfile) {
          payload.health_profile = healthProfile;
        }

        const suggestResponse = await axios.post(suggestUrl, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (suggestResponse.data && suggestResponse.data.recipes) {
          setRecipes(suggestResponse.data.recipes);
          checkIfBookmarked(suggestResponse.data.recipes);
        }
        setIsSuggesting(false);
      } else {
        throw new Error("AI không tìm thấy nguyên liệu nào trong ảnh.");
      }
    } catch (error: any) {
      console.error('AI Error:', error);
      AlertManager.alert(
        'Lỗi phân tích',
        error.response?.data?.error || 'Không thể kết nối với máy chủ AI. Vui lòng thử lại.',
        [{ text: 'Quay lại', onPress: () => navigation.goBack() }]
      );
      setIsScanning(false);
      setIsSuggesting(false);
    }
  };

  const suggestSubstitutions = async (ingredient: string) => {
    try {
      showToast(`Đang tìm nguyên liệu thay thế cho ${ingredient}...`);
      const res = await axios.get(`${API_CONFIG.BASE_URL}/suggest-substitutions?ingredient=${encodeURIComponent(ingredient)}`);
      if (res.data && res.data.substitutions) {
        AlertManager.alert(
          `Thay thế ${ingredient}`,
          `Bạn có thể dùng: ${res.data.substitutions.join(', ')}`,
          [{ text: 'Đã hiểu' }]
        );
      }
    } catch (e) {
      AlertManager.alert('Gợi ý', `Bạn có thể thử dùng nguyên liệu tương tự hoặc bỏ qua ${ingredient} nếu không cần thiết.`);
    }
  };

  const toggleIngredient = (title: string, index: number) => {
    const key = `${title}-${index}`;
    setCheckedIngredients(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleBookmark = async (index: number) => {
    const recipe = recipes[index];
    try {
      const user = auth.currentUser;
      const token = await user?.getIdToken();
      
      // Lấy danh sách hiện tại để xử lý xóa nếu cần
      const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FAVORITES}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      let currentFavorites = response.data || [];
      
      if (!bookmarked[index]) {
        // ... (existing logic)
        const newFav = { 
          // ... (existing logic)
        };
        
        await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FAVORITES}`, newFav, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showToast('Đã lưu vào mục yêu thích (Cloud)!');
      } else {
        // XÓA KHỎI DB
        const itemToDelete = currentFavorites.find((f: any) => f.title === recipe.title);
        if (itemToDelete && itemToDelete.id) {
          await axios.delete(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FAVORITES}/${itemToDelete.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          showToast('Đã xóa khỏi mục yêu thích.');
        }
      }
      
      setBookmarked(prev => ({ ...prev, [index]: !prev[index] }));
      
      // Update local cache
      const updatedResponse = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FAVORITES}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await AsyncStorage.setItem('favorites', JSON.stringify(updatedResponse.data));
      
    } catch (error) {
      console.error('Bookmark Error:', error);
      showToast('Lỗi kết nối Database.');
    }
  };

  const getRecipeDecision = (recipe: Recipe) => {
    const normalizedDetected = detectedIngredients.map(item => item.toLowerCase().trim());
    const inferredMissing = recipe.ingredients?.filter((ingredient) => {
      const normalized = ingredient.toLowerCase().trim();
      return normalizedDetected.length > 0 && !normalizedDetected.some(item => normalized.includes(item) || item.includes(normalized));
    }) || [];
    const missing = recipe.missing_ingredients && recipe.missing_ingredients.length > 0
      ? recipe.missing_ingredients
      : inferredMissing.slice(0, 3);
    const hasHealthRisk = Number(recipe.health_score || 100) < 50 || !!recipe.health_warning || ((recipe.health_warnings?.length || 0) > 0);

    if (hasHealthRisk) {
      return {
        icon: 'alert-circle' as const,
        title: 'Cần kiểm tra trước khi nấu',
        text: 'Món này có lưu ý sức khỏe. Đọc cảnh báo và thay thế nguyên liệu nếu cần.',
        tone: colors.warning,
      };
    }

    if (missing.length > 0) {
      return {
        icon: 'basket' as const,
        title: `Thiếu ${missing.length} nguyên liệu`,
        text: `Cần bổ sung: ${missing.join(', ')}.`,
        tone: colors.accent,
      };
    }

    return {
      icon: 'checkmark' as const,
      title: 'Có thể nấu ngay',
      text: `${recipe.ingredients?.length || 0} nguyên liệu cần chuẩn bị. Kiểm tra nhanh rồi chuyển sang chế độ nấu.`,
      tone: colors.primary,
    };
  };

  if (isScanning) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background, padding: 40 }]}>
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={colors.primary} />
          <View style={styles.loadingSteps}>
            <View style={styles.loadingStepRow}>
              <Ionicons name="cloud-upload-outline" size={20} color={loadingMessage.includes('Thiết kế') || loadingMessage.includes('thiết kế') ? colors.success : colors.primary} />
              <Text style={[styles.loadingStepText, { color: loadingMessage.includes('Thiết kế') || loadingMessage.includes('thiết kế') ? colors.textSecondary : colors.text }]}>Nhận diện nguyên liệu</Text>
            </View>
            <View style={styles.loadingStepRow}>
              <Ionicons name="sparkles-outline" size={20} color={colors.border} />
              <Text style={[styles.loadingStepText, { color: colors.textSecondary }]}>Thiết kế thực đơn</Text>
            </View>
          </View>
        </View>
        <Text style={[styles.loadingText, typography.body, { color: colors.textSecondary, marginTop: 20 }]}>{loadingMessage}</Text>
      </View>
    );
  }

  if (!isScanning && recipes.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: 20 }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>
        <EmptyState 
          icon="search-outline"
          title="Không tìm thấy món"
          description="Rất tiếc, AI không thể tìm thấy món ăn nào phù hợp với nguyên liệu của bạn. Hãy thử chụp ảnh rõ nét hơn hoặc nhập nguyên liệu khác nhé!"
          buttonText="Thử lại"
          onPress={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -HEADER_SCROLL_DISTANCE + 50],
    extrapolate: 'clamp',
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Collapsible Header */}
      <Animated.View style={[styles.header, { height: HEADER_MAX_HEIGHT, transform: [{ translateY: headerTranslateY }], zIndex: 10 }]}>
        <Animated.Image source={{ uri: imageUri || (recipes.length > 0 ? recipes[0].imageUrl : undefined) }} style={[styles.headerImage, { opacity: imageOpacity }]} />
        {/* Back Button */}
        <AnimatedButton 
          activeOpacity={0.7}
          onPress={() => navigation.goBack()} 
          style={styles.floatingBackBtn}
        >
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </AnimatedButton>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT }}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
      >
        <View style={[styles.content, { padding: spacing.lg }]}>
          {/* Section: Nguyên liệu đã nhận diện */}
          <View style={styles.sectionHeader}>
            <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}20` }]}>
              <Ionicons name="scan" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.sectionTitle, typography.h2, { color: colors.text }]}>Nguyên liệu trong bếp</Text>
          </View>
          
          <View style={[styles.tagsContainer, { marginBottom: spacing.xl }]}>
            {detectedIngredients.map((item, index) => (
              <View key={index} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, backgroundColor: `${colors.success}15`, borderColor: colors.success }}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} style={{ marginRight: 4 }} />
                <Text style={{ fontWeight: 'bold', fontSize: 13, color: colors.success }}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Section: Gợi ý món ăn */}
          <View style={[styles.sectionHeader, { justifyContent: 'space-between' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.iconCircle, { backgroundColor: `${colors.secondary}20` }]}>
                <Ionicons name="restaurant" size={20} color={colors.secondary} />
              </View>
              <Text style={[styles.sectionTitle, typography.h2, { color: colors.text }]}>Món có thể nấu</Text>
            </View>
            {isSuggesting && <ActivityIndicator size="small" color={colors.primary} />}
          </View>

            {isSuggesting && recipes.length === 0 ? (
              <View style={[styles.recipeLoadingCard, { backgroundColor: colors.card, borderRadius: borderRadius.lg, borderColor: colors.border }]}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[typography.body, { color: colors.textSecondary, marginLeft: 12 }]}>Đang xếp hạng món phù hợp nhất...</Text>
              </View>
            ) : (
            recipes.map((recipe, index) => {
              const decision = getRecipeDecision(recipe);
              return (
            <View key={index} style={[styles.recipeCard, { backgroundColor: colors.card, borderRadius: borderRadius.lg, marginBottom: spacing.xl }]}>
              {/* 1. Compact Card: Ảnh 200px */}
              <RealImage 
                query={recipe.title} 
                initialUri={recipe.imageUrl} 
                style={styles.recipeImage} 
              />
              
              <AnimatedButton activeOpacity={0.7} style={styles.bookmarkBtn} onPress={() => toggleBookmark(index)}>
                <Ionicons name={bookmarked[index] ? "heart" : "heart-outline"} size={26} color={bookmarked[index] ? colors.error : "#FFF"} />
              </AnimatedButton>

              <View style={{ padding: spacing.lg }}>
                <Text style={[styles.recipeName, typography.h2, { color: colors.text, marginBottom: spacing.xs }]}>{recipe.title}</Text>
                
                {/* 1. Tag (Thời gian, Độ khó, Kcal) */}
                <View style={[styles.metaDataRow, { marginBottom: spacing.md }]}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={16} color={colors.primary} />
                    <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 4 }]}>{recipe.prep_time}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="bar-chart-outline" size={16} color={colors.primary} />
                    <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 4 }]}>{recipe.difficulty}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="flame-outline" size={16} color="#FF9500" />
                    <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 4 }]}>{recipe.calories}</Text>
                  </View>
                </View>

                <View style={[styles.recipeDecisionBox, { backgroundColor: `${decision.tone}10`, borderColor: `${decision.tone}28` }]}>
                  <View style={[styles.recipeDecisionIcon, { backgroundColor: decision.tone }]}>
                    <Ionicons name={decision.icon} size={16} color="#FFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.recipeDecisionTitle, { color: colors.text }]}>{decision.title}</Text>
                    <Text style={[styles.recipeDecisionText, { color: colors.textSecondary }]}>
                      {decision.text}
                    </Text>
                  </View>
                </View>

                {/* Health Overview in Card */}
                {recipe.health_score !== undefined && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, marginTop: spacing.xs }}>
                    <View style={{ 
                      backgroundColor: Number(recipe.health_score) >= 80 ? `${colors.success}15` : Number(recipe.health_score) >= 50 ? '#FFCC0015' : `${colors.error}15`, 
                      paddingHorizontal: 10, 
                      paddingVertical: 6, 
                      borderRadius: 8, 
                      marginRight: 10, 
                      flexDirection: 'row', 
                      alignItems: 'center' 
                    }}>
                      <Ionicons 
                        name="shield-checkmark" 
                        size={14} 
                        color={Number(recipe.health_score) >= 80 ? colors.success : Number(recipe.health_score) >= 50 ? '#FFCC00' : colors.error} 
                        style={{ marginRight: 4 }} 
                      />
                      <Text style={{ 
                        color: Number(recipe.health_score) >= 80 ? colors.success : Number(recipe.health_score) >= 50 ? '#FFCC00' : colors.error, 
                        fontWeight: 'bold', 
                        fontSize: 12 
                      }}>
                        Độ an toàn: {recipe.health_score}%
                      </Text>
                    </View>
                    {Array.isArray(recipe.health_benefits) && recipe.health_benefits.length > 0 && (
                      <Text style={[typography.caption, { color: colors.success, flex: 1, fontWeight: '500' }]} numberOfLines={1}>
                        {recipe.health_benefits[0]}
                      </Text>
                    )}
                  </View>
                )}

                {/* Khối Cảnh báo (màu vàng) */}
                {!!(recipe.health_warning || (Array.isArray(recipe.health_warnings) && recipe.health_warnings.length > 0)) && (
                  <View style={[styles.warningBox, { backgroundColor: 'rgba(255, 149, 0, 0.1)', borderColor: 'rgba(255, 149, 0, 0.3)', borderWidth: 1, borderRadius: 12, padding: 12 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <Ionicons name="warning" size={16} color="#FF9500" />
                      <Text style={{ color: '#FF9500', fontWeight: 'bold', marginLeft: 6, fontSize: 13 }}>Lưu ý sức khỏe</Text>
                    </View>
                    <View>
                      {!!recipe.health_warning && <Text style={[typography.caption, { color: colors.textSecondary, lineHeight: 20 }]}>{recipe.health_warning}</Text>}
                      {Array.isArray(recipe.health_warnings) && recipe.health_warnings.map((w, i) => (
                        <Text key={i} style={[typography.caption, { color: colors.textSecondary, lineHeight: 20 }]}>• {w}</Text>
                      ))}
                    </View>
                  </View>
                )}

                {/* 1. Nút Xem công thức */}
                <AnimatedButton 
                  activeOpacity={0.7}
                  style={[styles.viewRecipeBtn, { backgroundColor: colors.primary, borderRadius: borderRadius.md }]} 
                  onPress={() => setSelectedRecipe(recipe)}
                >
                  <Text style={[styles.viewRecipeText, typography.h3, { color: '#FFF' }]}>Xem công thức</Text>
                  <Ionicons name="chevron-forward" size={18} color="#FFF" style={{ marginLeft: 4 }} />
                </AnimatedButton>
              </View>
            </View>
            );
            })
          )}
        </View>
      </Animated.ScrollView>

      {/* Recipe Detail Modal */}
      <Modal visible={!!selectedRecipe} animationType="slide" transparent={false}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <AnimatedButton activeOpacity={0.7} onPress={() => setSelectedRecipe(null)} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color={colors.text} />
            </AnimatedButton>
            <Text style={[typography.h3, { color: colors.text, flex: 1, textAlign: 'center', marginRight: 40 }]}>{selectedRecipe?.title}</Text>
          </View>
          
          <ScrollView contentContainerStyle={{ paddingBottom: 150 }}>
            {/* 1. Header Image Gallery */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              pagingEnabled
              style={styles.imageGallery}
            >
              {[
                { type: 'real', q: selectedRecipe?.title },
                { type: 'real', q: `${selectedRecipe?.title} plating` }
              ].map((img, idx) => (
                <View key={idx} style={styles.galleryItem}>
                  <RealImage query={img.q!} style={styles.galleryImage} />
                  <View style={styles.imageBadge}>
                    <Text style={styles.imageBadgeText}>{idx + 1}/2 Ảnh</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={{ padding: spacing.lg }}>
            
            {/* Embedded YouTube Section */}
            {!showVideo ? (
              <AnimatedButton 
                activeOpacity={0.7}
                style={[styles.youtubeBtn, { backgroundColor: '#FF0000' }]}
                onPress={() => setShowVideo(true)}
              >
                <Ionicons name="logo-youtube" size={20} color="#FFF" />
                <Text style={[typography.h3, { color: '#FFF', marginLeft: 10 }]}>Xem Video Hướng Dẫn</Text>
              </AnimatedButton>
            ) : (
              <View style={styles.videoWrapper}>
                <View style={styles.videoHeader}>
                  <Text style={[typography.caption, { color: '#FFF', fontWeight: 'bold' }]}>ĐANG XEM VIDEO HƯỚNG DẪN</Text>
                  <TouchableOpacity onPress={() => setShowVideo(false)}>
                    <Ionicons name="close-circle" size={24} color="#FFF" />
                  </TouchableOpacity>
                </View>
                <WebView 
                  source={{ uri: `https://www.youtube.com/results?search_query=${encodeURIComponent('cách nấu ' + selectedRecipe?.title)}` }}
                  style={styles.webView}
                  allowsFullscreenVideo
                />
              </View>
            )}

            {/* Nutritional Insights */}
            {selectedRecipe?.nutrition_detail && typeof selectedRecipe.nutrition_detail === 'object' && Object.keys(selectedRecipe.nutrition_detail).length > 0 && (
              <View style={[styles.nutritionCard, { backgroundColor: colors.card, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3, borderWidth: 0, marginBottom: 20 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ backgroundColor: `${colors.primary}15`, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="analytics" size={18} color={colors.primary} />
                  </View>
                  <Text style={[typography.h3, { color: colors.text, marginLeft: 10 }]}>Giá trị dinh dưỡng</Text>
                </View>
                
                <View style={[styles.nutritionRow, { backgroundColor: `${colors.background}`, padding: 16, borderRadius: 16 }]}>
                  <View style={styles.nutriItem}>
                    <Text style={[typography.h2, { color: colors.primary }]}>{selectedRecipe.nutrition_detail.protein || '-'}</Text>
                    <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>Protein</Text>
                  </View>
                  <View style={[styles.nutriDivider, { backgroundColor: colors.border, height: 40 }]} />
                  <View style={styles.nutriItem}>
                    <Text style={[typography.h2, { color: colors.secondary }]}>{selectedRecipe.nutrition_detail.carbs || '-'}</Text>
                    <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>Carbs</Text>
                  </View>
                  <View style={[styles.nutriDivider, { backgroundColor: colors.border, height: 40 }]} />
                  <View style={styles.nutriItem}>
                    <Text style={[typography.h2, { color: '#FF9500' }]}>{selectedRecipe.nutrition_detail.fat || '-'}</Text>
                    <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>Chất béo</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Substitutions */}
            {Array.isArray(selectedRecipe?.substitutions) && selectedRecipe.substitutions.length > 0 && (
              <View style={[styles.warningBox, { backgroundColor: `${colors.success}10`, borderColor: `${colors.success}30`, marginTop: 0, marginBottom: 24, padding: 16, borderRadius: 16, borderWidth: 1 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ backgroundColor: `${colors.success}20`, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                    <Ionicons name="swap-horizontal" size={18} color={colors.success} />
                  </View>
                  <Text style={[typography.h3, { color: colors.success }]}>Gợi ý thay thế nguyên liệu</Text>
                </View>
                
                <View style={{ gap: 12, paddingLeft: 42 }}>
                  {selectedRecipe.substitutions.map((sub, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success, marginTop: 8, marginRight: 8 }} />
                      <Text style={[typography.body, { color: colors.text, flex: 1, lineHeight: 22 }]}>
                        Dùng <Text style={{ fontWeight: 'bold', color: colors.success }}>{sub?.replacement}</Text> thay cho <Text style={{ fontWeight: 'bold' }}>{sub?.original}</Text> ({sub?.reason?.toLowerCase()})
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <Text style={[styles.subTitle, typography.h2, { color: colors.text, marginBottom: spacing.md }]}>Danh sách cần chuẩn bị</Text>
            
            <AnimatedButton 
              activeOpacity={0.7}
              style={[styles.addToCartAllBtn, { borderColor: colors.primary }]}
              onPress={() => selectedRecipe && addToShoppingList(selectedRecipe)}
            >
              <Ionicons name="cart" size={18} color={colors.primary} />
              <Text style={[typography.caption, { color: colors.primary, fontWeight: 'bold', marginLeft: 8 }]}>THÊM VÀO DANH SÁCH MUA</Text>
            </AnimatedButton>

            {selectedRecipe?.ingredients.map((ing, i) => {
              const isChecked = checkedIngredients[`${selectedRecipe.title}-${i}`];
              return (
                <AnimatedButton 
                  activeOpacity={0.7}
                  key={i} 
                  style={[styles.ingredientCard, { backgroundColor: colors.card, borderColor: colors.border }]} 
                  onPress={() => toggleIngredient(selectedRecipe.title, i)}
                >
                  <View style={[styles.ingredientThumb, { backgroundColor: `${colors.primary}15`, justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="nutrition" size={24} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={[
                      styles.listItemText, 
                      typography.body, 
                      { 
                        color: isChecked ? colors.textSecondary : colors.text,
                        textDecorationLine: isChecked ? 'line-through' : 'none',
                        opacity: isChecked ? 0.5 : 1,
                      }
                    ]}>
                      {ing}
                    </Text>
                    {!isChecked && (
                      <AnimatedButton onPress={() => suggestSubstitutions(ing)}>
                        <Text style={{ color: colors.primary, fontSize: 11, marginTop: 4, fontWeight: 'bold' }}>
                          Thay thế nguyên liệu
                        </Text>
                      </AnimatedButton>
                    )}
                  </View>
                  <Ionicons 
                    name={isChecked ? "checkmark-circle" : "add-circle-outline"} 
                    size={24} 
                    color={isChecked ? colors.success : colors.primary} 
                  />
                </AnimatedButton>
              );
            })}

            <Text style={[styles.subTitle, typography.h2, { color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md }]}>Các bước thực hiện:</Text>
            
            {(() => {
              const instructions = selectedRecipe?.instructions;
              const parsedSteps = Array.isArray(instructions) 
                ? instructions 
                : (typeof instructions === 'string' ? instructions.split(/Bước \d+:/).filter(Boolean).map(s => s.trim()) : []);
              return parsedSteps.map((inst, i) => (
              <View key={i} style={[styles.stepCard, { backgroundColor: colors.card }]}>
                <View style={styles.stepHeaderRow}>
                  <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                    <Text style={styles.stepNumberText}>{i + 1}</Text>
                  </View>
                  <Text style={[typography.h3, { color: colors.text, marginLeft: 8 }]}>Bước {i + 1}</Text>
                </View>
                <RealImage 
                  query={`${selectedRecipe?.title} ${inst.substring(0, 30)}`}
                  isStep={true}
                  style={styles.stepImage} 
                />
                <Text style={[styles.stepText, typography.body, { color: colors.text, marginTop: 12 }]}>{inst}</Text>
              </View>
            ));
            })()}

            {selectedRecipe?.tips && (
              <View style={[styles.tipBox, { backgroundColor: `${colors.primary}10`, marginTop: spacing.xl, marginBottom: 100 }]}>
                <View style={styles.tipIconHeader}>
                  <Ionicons name="bulb" size={18} color={colors.primary} />
                  <Text style={[typography.caption, { color: colors.primary, fontWeight: 'bold', marginLeft: 4 }]}>MẸO NẤU ĂN</Text>
                </View>
                <Text style={[typography.body, { color: colors.textSecondary, fontStyle: 'italic' }]}>{selectedRecipe.tips}</Text>
              </View>
            )}
            </View>
          </ScrollView>

          {/* Sticky Bottom Bar for Start Cooking */}
          <View style={[styles.stickyBottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <AnimatedButton 
              activeOpacity={0.8}
              style={styles.startCookingBtnWrapper}
              onPress={() => {
                if (selectedRecipe) {
                  const rawInstructions = selectedRecipe.instructions;
                  let steps: string[] = [];
                  if (Array.isArray(rawInstructions)) {
                    steps = rawInstructions;
                  } else if (typeof rawInstructions === 'string') {
                    const splitRegex = /(?:Bước|Step|B|S)?\s*\d+[:.]|(?:\r?\n|^)\s*[-*•]\s*/gi;
                    const parts = rawInstructions.split(splitRegex).filter(s => s.trim().length > 0);
                    if (parts.length > 1) {
                      steps = parts.map(s => s.trim());
                    } else {
                      const lines = rawInstructions.split(/\r?\n/).filter(s => s.trim().length > 5);
                      if (lines.length > 1) {
                        steps = lines.map(s => s.trim().replace(/^[-*•\d+.]\s*/, ''));
                      } else {
                        const sentences = sentencesRegex.exec(rawInstructions) ? rawInstructions.split(/[.!?](?:\s+|$)/).filter(s => s.trim().length > 5) : [rawInstructions.trim()];
                        steps = sentences.map(s => s.trim());
                      }
                    }
                  }
                  
                  setSelectedRecipe(null);
                  navigation.navigate('PrepChecklist', { 
                    steps: steps, 
                    dishName: selectedRecipe.title,
                    ingredients: selectedRecipe.ingredients,
                    tips: selectedRecipe.tips,
                  });
                }
              }}
            >
              <LinearGradient
                colors={[colors.primary, `${colors.primary}CC`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.startCookingBtn}
              >
                <View style={styles.startCookingIconWrapper}>
                  <Ionicons name="restaurant" size={16} color={colors.primary} />
                </View>
                <Text style={[typography.h3, { color: '#FFF', marginLeft: 12 }]}>BẮT ĐẦU CHẾ ĐỘ NẤU</Text>
              </LinearGradient>
            </AnimatedButton>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Global Custom Toast */}
      {!!toast && (
        <Animated.View 
          style={[
            styles.toastContainer, 
            { 
              opacity: toastOpacity,
              backgroundColor: 'rgba(0,0,0,0.85)',
              transform: [{ translateY: toastOpacity.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }]
            }
          ]}
        >
          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
          <Text style={[styles.toastText, { color: '#FFF' }]}>{toast.message}</Text>
          <TouchableOpacity 
            onPress={() => {
              setToast(null);
              navigation.navigate('ShoppingList');
            }}
          >
            <Text style={{ color: colors.primary, fontWeight: 'bold', marginLeft: 12 }}>XEM</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { textAlign: 'center' },
  header: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
  headerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  floatingBackBtn: { 
    position: 'absolute', top: 50, left: 20, zIndex: 20,
    width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center', alignItems: 'center',
  },
  content: {},
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  sectionTitle: { fontWeight: '800' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recipeCard: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 8, overflow: 'hidden' },
  recipeImage: { width: '100%', height: 200, resizeMode: 'cover' },
  bookmarkBtn: { position: 'absolute', top: 15, right: 15, backgroundColor: 'rgba(0,0,0,0.3)', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  recipeName: { fontWeight: '900' },
  metaDataRow: { flexDirection: 'row', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  recipeDecisionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
  },
  recipeDecisionIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  recipeDecisionTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  recipeDecisionText: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  warningBox: { flexDirection: 'column', padding: 12, borderWidth: 1, borderRadius: 12, marginBottom: 8 },
  addToCartAllBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    borderRadius: 12, 
    marginBottom: 20,
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
  },
  startCookingBtnWrapper: {
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  startCookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 50,
  },
  startCookingIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
  },
  viewRecipeBtn: { 
    height: 48, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 12,
    borderRadius: 50,
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  viewRecipeText: { fontWeight: 'bold' },
  modalHeader: { height: 60, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  closeBtn: { padding: 16 },
  subTitle: { fontWeight: 'bold' },
  youtubeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  videoWrapper: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#333'
  },
  videoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#1A1A1A'
  },
  webView: {
    flex: 1,
    backgroundColor: '#000'
  },
  nutritionCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  nutriItem: {
    alignItems: 'center',
  },
  nutriDivider: {
    width: 1,
    height: 30,
  },
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  toastText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  interactiveRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  listItemText: { fontSize: 16 },
  stepRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' },
  stepNumber: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2 },
  stepNumberText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  stepText: { flex: 1, lineHeight: 24, fontSize: 16 },
  tipBox: { padding: 16, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#F09035' },
  tipIconHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  imageGallery: { height: 300, marginBottom: 0 },
  galleryItem: { width: width, height: 300 },
  galleryImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageBadge: { position: 'absolute', bottom: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  imageBadgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  ingredientCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    borderRadius: 16, 
    marginBottom: 12, 
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  ingredientThumb: { width: 50, height: 50, borderRadius: 12 },
  stepCard: { padding: 16, borderRadius: 20, marginBottom: 24, overflow: 'hidden' },
  stepHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  stepImage: { width: '100%', height: 180, borderRadius: 16, resizeMode: 'cover' },
  loadingWrapper: { alignItems: 'center', width: '100%' },
  loadingSteps: { marginTop: 40, width: '100%', gap: 16 },
  loadingStepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  loadingStepText: { fontSize: 16, fontWeight: '500' },
  recipeLoadingCard: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderStyle: 'dashed',
    borderWidth: 1,
  },
});


