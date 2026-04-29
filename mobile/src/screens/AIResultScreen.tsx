import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ActivityIndicator, 
  ScrollView, 
  Alert, 
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
import API_CONFIG from '../config/apiConfig';

const { width, height } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 280;
const HEADER_MIN_HEIGHT = 100;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

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
}

// 2. Xử lý logic Ảnh Dự phòng (Fallback Image)
import { LinearGradient } from 'expo-linear-gradient';

const SafeImage = ({ uri, style }: { uri?: string, style: any }) => {
  const [error, setError] = useState(false);

  if (!uri || error) {
    return (
      <View style={[style, { backgroundColor: '#1A1A1A', overflow: 'hidden' }]}>
        <LinearGradient
          colors={['#2C2C2C', '#1A1A1A']}
          style={StyleSheet.absoluteFill}
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.2 }}>
          <Ionicons name="restaurant-outline" size={48} color="#FFF" />
        </View>
      </View>
    );
  }

  return (
    <Image 
      source={{ uri }} 
      style={style} 
      onError={() => setError(true)}
    />
  );
};
export default function AIResultScreen({ route, navigation }: Props) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();
  const { imageUri, initialIngredients, initialRecipe } = route.params;
  const [loading, setLoading] = useState(!initialRecipe);
  const [loadingMessage, setLoadingMessage] = useState(initialRecipe ? '' : 'Đang khởi tạo...');
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipe ? [initialRecipe] : []);
  const [detectedIngredients, setDetectedIngredients] = useState<string[]>(initialIngredients || (initialRecipe ? initialRecipe.ingredients : []));
  
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
    if (initialRecipe) {
      setLoading(false);
    } else if (initialIngredients && initialIngredients.length > 0) {
      suggestRecipesDirectly(initialIngredients);
    } else if (imageUri) {
      analyzeImage();
    } else {
      setLoading(false);
    }
  }, []);

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

  const suggestRecipesDirectly = async (ingredients: string[]) => {
    try {
      setLoading(true);
      setLoadingMessage('AI đang sáng tạo món ăn từ tủ lạnh của bạn...');
      
      const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SUGGEST_RECIPES}`, {
        ingredients: ingredients
      });
      
      if (response.data && response.data.recipes) {
        setRecipes(response.data.recipes);
      }
      setLoading(false);
    } catch (error) {
      console.log('Suggest Error:', error);
      Alert.alert('Lỗi', 'Không thể lấy gợi ý món ăn.');
      setLoading(false);
    }
  };

  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (!selectedRecipe) setShowVideo(false);
  }, [selectedRecipe]);

  const analyzeImage = async () => {
    try {
      setLoading(true);
      setLoadingMessage('AI đang phân tích ảnh và sáng tạo công thức...');
      
      const scanAndSuggestUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SCAN_AND_SUGGEST}`; 
      
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        name: 'photo.jpg',
        type: 'image/jpeg',
      } as any);

      const response = await axios.post(scanAndSuggestUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      if (response.data) {
        if (response.data.ingredients) setDetectedIngredients(response.data.ingredients);
        if (response.data.recipes) {
          setRecipes(response.data.recipes);
        }
      } else {
        throw new Error("Không nhận diện được dữ liệu");
      }
      
      setLoading(false);
    } catch (error: any) {
      console.log('API Error:', error.message);
      Alert.alert('Lỗi', 'Không thể kết nối với máy chủ AI hoặc ảnh không hợp lệ.');
      setLoading(false);
    }
  };

  const toggleIngredient = (title: string, index: number) => {
    const key = `${title}-${index}`;
    setCheckedIngredients(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleBookmark = (index: number) => {
    setBookmarked(prev => ({ ...prev, [index]: !prev[index] }));
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, typography.body, { color: colors.textSecondary, marginTop: spacing.md }]}>{loadingMessage}</Text>
      </View>
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
        <Animated.Image source={{ uri: imageUri }} style={[styles.headerImage, { opacity: imageOpacity }]} />
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
            <Text style={[styles.sectionTitle, typography.h2, { color: colors.text }]}>Nguyên liệu nhận diện</Text>
          </View>
          
          <View style={[styles.tagsContainer, { marginBottom: spacing.xl }]}>
            {detectedIngredients.map((item, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: `${colors.success}15`, borderColor: colors.success }]}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} style={{ marginRight: 4 }} />
                <Text style={[styles.tagText, { color: colors.success }]}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Section: Gợi ý món ăn */}
          <View style={styles.sectionHeader}>
            <View style={[styles.iconCircle, { backgroundColor: `${colors.secondary}20` }]}>
              <Ionicons name="restaurant" size={20} color={colors.secondary} />
            </View>
            <Text style={[styles.sectionTitle, typography.h2, { color: colors.text }]}>Gợi ý món ăn cho bạn</Text>
          </View>

          {recipes.map((recipe, index) => (
            <View key={index} style={[styles.recipeCard, { backgroundColor: colors.card, borderRadius: borderRadius.lg, marginBottom: spacing.xl }]}>
              {/* 1. Compact Card: Ảnh 200px */}
              <SafeImage uri={recipe.imageUrl} style={styles.recipeImage} />
              
              <TouchableOpacity style={styles.bookmarkBtn} onPress={() => toggleBookmark(index)}>
                <Ionicons name={bookmarked[index] ? "heart" : "heart-outline"} size={26} color={bookmarked[index] ? colors.error : "#FFF"} />
              </TouchableOpacity>

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

                {/* 1. Khối Cảnh báo (màu vàng) */}
                {recipe.health_warning && (
                  <View style={[styles.warningBox, { backgroundColor: '#FFF9E6', borderColor: '#FFE58F' }]}>
                    <Ionicons name="warning" size={20} color="#D48806" style={{ marginRight: 8 }} />
                    <Text style={[typography.caption, { color: '#856404', flex: 1, fontWeight: '500' }]}>{recipe.health_warning}</Text>
                  </View>
                )}

                {/* 1. Nút Xem công thức */}
                <TouchableOpacity 
                  style={[styles.viewRecipeBtn, { backgroundColor: colors.primary, borderRadius: borderRadius.md }]} 
                  onPress={() => setSelectedRecipe(recipe)}
                >
                  <Text style={[styles.viewRecipeText, typography.h3, { color: '#FFF' }]}>Xem công thức</Text>
                  <Ionicons name="chevron-forward" size={18} color="#FFF" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </Animated.ScrollView>

      {/* Recipe Detail Modal */}
      <Modal visible={!!selectedRecipe} animationType="slide" transparent={false}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setSelectedRecipe(null)} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
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
                selectedRecipe?.imageUrl,
                `https://source.unsplash.com/featured/800x600?${encodeURIComponent(selectedRecipe?.title || '')},dish`,
                `https://source.unsplash.com/featured/800x600?${encodeURIComponent(selectedRecipe?.title || '')},cooking`,
                `https://source.unsplash.com/featured/800x600?${encodeURIComponent(selectedRecipe?.title || '')},delicious`
              ].map((uri, idx) => (
                <View key={idx} style={styles.galleryItem}>
                  <SafeImage uri={uri} style={styles.galleryImage} />
                  <View style={styles.imageBadge}>
                    <Text style={styles.imageBadgeText}>{idx + 1}/4 Ảnh</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={{ padding: spacing.lg }}>
            
            {/* Embedded YouTube Section */}
            {!showVideo ? (
              <TouchableOpacity 
                style={[styles.youtubeBtn, { backgroundColor: '#FF0000' }]}
                onPress={() => setShowVideo(true)}
              >
                <Ionicons name="logo-youtube" size={20} color="#FFF" />
                <Text style={[typography.h3, { color: '#FFF', marginLeft: 10 }]}>Xem Video Hướng Dẫn</Text>
              </TouchableOpacity>
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

            {/* New: Nutritional Insights */}
            <View style={[styles.nutritionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: 'bold', marginBottom: 12 }]}>THÔNG TIN DINH DƯỠNG (ƯỚC TÍNH)</Text>
              <View style={styles.nutritionRow}>
                <View style={styles.nutriItem}>
                  <Text style={[typography.h3, { color: colors.primary }]}>25g</Text>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>Protein</Text>
                </View>
                <View style={[styles.nutriDivider, { backgroundColor: colors.border }]} />
                <View style={styles.nutriItem}>
                  <Text style={[typography.h3, { color: colors.secondary }]}>45g</Text>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>Carbs</Text>
                </View>
                <View style={[styles.nutriDivider, { backgroundColor: colors.border }]} />
                <View style={styles.nutriItem}>
                  <Text style={[typography.h3, { color: colors.error }]}>12g</Text>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>Chất béo</Text>
                </View>
              </View>
            </View>

            <Text style={[styles.subTitle, typography.h2, { color: colors.text, marginBottom: spacing.md }]}>Thành phần nguyên liệu:</Text>
            
            <TouchableOpacity 
              style={[styles.addToCartAllBtn, { borderColor: colors.primary }]}
              onPress={() => selectedRecipe && addToShoppingList(selectedRecipe)}
            >
              <Ionicons name="cart" size={18} color={colors.primary} />
              <Text style={[typography.caption, { color: colors.primary, fontWeight: 'bold', marginLeft: 8 }]}>THÊM TẤT CẢ VÀO GIỎ HÀNG</Text>
            </TouchableOpacity>

            {selectedRecipe?.ingredients.map((ing, i) => {
              const isChecked = checkedIngredients[`${selectedRecipe.title}-${i}`];
              return (
                <TouchableOpacity 
                  key={i} 
                  style={[styles.ingredientCard, { backgroundColor: colors.card, borderColor: colors.border }]} 
                  onPress={() => toggleIngredient(selectedRecipe.title, i)}
                >
                  <SafeImage 
                    uri={`https://source.unsplash.com/featured/100x100?${encodeURIComponent(ing.split(' ')[ing.split(' ').length-1])},food`} 
                    style={styles.ingredientThumb} 
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
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
                  </View>
                  <Ionicons 
                    name={isChecked ? "checkmark-circle" : "add-circle-outline"} 
                    size={24} 
                    color={isChecked ? colors.success : colors.primary} 
                  />
                </TouchableOpacity>
              );
            })}

            <Text style={[styles.subTitle, typography.h2, { color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md }]}>Các bước thực hiện:</Text>
            
            {(Array.isArray(selectedRecipe?.instructions) ? selectedRecipe?.instructions : selectedRecipe?.instructions.split(/Bước \d+:/).filter(Boolean).map(s => s.trim()))?.map((inst, i) => (
              <View key={i} style={[styles.stepCard, { backgroundColor: colors.card }]}>
                <View style={styles.stepHeaderRow}>
                  <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                    <Text style={styles.stepNumberText}>{i + 1}</Text>
                  </View>
                  <Text style={[typography.h3, { color: colors.text, marginLeft: 8 }]}>Bước {i + 1}</Text>
                </View>
                <SafeImage 
                  uri={`https://source.unsplash.com/featured/800x450?cooking,kitchen,step,${i}`} 
                  style={styles.stepImage} 
                />
                <Text style={[styles.stepText, typography.body, { color: colors.text, marginTop: 12 }]}>{inst}</Text>
              </View>
            ))}

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
            <TouchableOpacity 
              style={[styles.startCookingBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                if (selectedRecipe) {
                  const steps = Array.isArray(selectedRecipe.instructions) 
                    ? selectedRecipe.instructions 
                    : selectedRecipe.instructions.split(/Bước \d+:/).filter(Boolean).map(s => s.trim());
                  
                  setSelectedRecipe(null);
                  navigation.navigate('CookingMode', { 
                    steps: steps, 
                    dishName: selectedRecipe.title 
                  });
                }
              }}
            >
              <Ionicons name="restaurant" size={20} color="#FFF" />
              <Text style={[typography.h3, { color: '#FFF', marginLeft: 12 }]}>BẮT ĐẦU NẤU NGAY</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Global Custom Toast */}
      {toast && (
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
  content: {},
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  sectionTitle: { fontWeight: '800' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  tagText: { fontWeight: 'bold', fontSize: 13 },
  recipeCard: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 8, overflow: 'hidden' },
  recipeImage: { width: '100%', height: 200, resizeMode: 'cover' },
  bookmarkBtn: { position: 'absolute', top: 15, right: 15, backgroundColor: 'rgba(0,0,0,0.3)', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  recipeName: { fontWeight: '900' },
  metaDataRow: { flexDirection: 'row', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  warningBox: { flexDirection: 'row', padding: 12, borderWidth: 1, borderRadius: 12, marginBottom: 8 },
  addToCartAllBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    borderRadius: 12, 
    marginBottom: 20,
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
  },
  startCookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 50,
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
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
});
