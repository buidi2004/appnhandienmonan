import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Dimensions,
  Animated,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabParamList, RootStackParamList } from '../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RealImage } from '../components/RealImage';
import API_CONFIG from '../config/apiConfig';
import axios from 'axios';
import { themeColors, gradients } from '../theme';
import { glass } from '../theme/glass';
import { glow } from '../theme/glow';
import { shadow } from '../theme/shadow';
import { typography as designTypography } from '../theme/typography';
import { borderWidth, borderRadius, borderColors, borderPresets } from '../theme/borders';

import { auth } from '../config/firebaseConfig';

type Props = BottomTabScreenProps<TabParamList, 'Favorites'>;

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1495195129352-aec325b55b65?q=80&w=600&auto=format&fit=crop';

const categories = ['Tất cả', 'Healthy', 'Món nước', 'Ăn nhanh', 'Đồ nướng'];

export default function FavoritesScreen({ navigation: tabNavigation }: Props) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<any[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [lastRemovedItem, setLastRemovedItem] = useState<any>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);

  const snackbarAnim = useRef(new Animated.Value(100)).current;
  const undoTimer = useRef<any>(null);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
      return () => {
        if (undoTimer.current) clearTimeout(undoTimer.current);
      };
    }, [])
  );

  useEffect(() => {
    filterData();
  }, [favorites, searchQuery, activeCategory]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      const token = await user?.getIdToken();

      // Gọi API lấy từ DB thay vì AsyncStorage
      const response = await axios.get(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FAVORITES}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data) {
        setFavorites(response.data);
      }
    } catch (e) {
      console.error('Failed to load favorites from DB', e);
      // Fallback về AsyncStorage nếu API lỗi (tùy chọn)
      const stored = await AsyncStorage.getItem('favorites');
      if (stored) setFavorites(JSON.parse(stored));
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let result = [...favorites];

    if (activeCategory !== 'Tất cả') {
      result = result.filter(f => f.category === activeCategory);
    }

    if (searchQuery.trim()) {
      result = result.filter(f =>
        f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredFavorites(result);
  };

  const removeFavorite = async (item: any) => {
    try {
      const originalFavorites = [...favorites];
      const updated = favorites.filter(f => (f.id || f.title) !== (item.id || item.title));
      setLastRemovedItem(item);
      setFavorites(updated);

      // Gọi API xóa trong DB
      if (item.id) {
        const user = auth.currentUser;
        const token = await user?.getIdToken();
        await axios.delete(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FAVORITES}/${item.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      // Đồng bộ lại local (tùy chọn)
      await AsyncStorage.setItem('favorites', JSON.stringify(updated));
      triggerSnackbar();
    } catch (e) {
      console.error('Lỗi khi xóa món ăn:', e);
      // Bạn có thể hoàn tác UI ở đây nếu cần
    }
  };

  const undoRemove = async () => {
    if (lastRemovedItem) {
      const updated = [...favorites, lastRemovedItem];
      setFavorites(updated);
      await AsyncStorage.setItem('favorites', JSON.stringify(updated));
      hideSnackbar();
    }
  };

  const triggerSnackbar = () => {
    setShowSnackbar(true);
    snackbarAnim.setValue(100);
    Animated.spring(snackbarAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
    }).start();

    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => {
      hideSnackbar();
    }, 4000);
  };

  const hideSnackbar = () => {
    Animated.timing(snackbarAnim, {
      toValue: 100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowSnackbar(false);
      setLastRemovedItem(null);
    });
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={[styles.title, typography.h1, { color: themeColors.textPrimary }]}>Món ăn yêu thích</Text>
      <Text style={[typography.body, { color: themeColors.textSecondary, marginBottom: spacing.lg }]}>
        {favorites.length > 0 ? `Bạn đã lưu ${favorites.length} công thức nấu ăn` : 'Bạn chưa có món ăn yêu thích nào'}
      </Text>

      <View style={styles.searchRow}>
        <View style={{
          flex: 1,
          height: 56,
          backgroundColor: 'rgba(30, 10, 60, 0.8)',
          borderRadius: borderRadius.round,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
          padding: 4,
          shadowColor: '#a855f7',
          shadowOpacity: 0.25,
          shadowRadius: 12,
          elevation: 3,
          marginRight: 12
        }}>
          <View style={{
            flex: 20,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(30, 10, 60, 0.8)',
            borderRadius: borderRadius.round,
            paddingHorizontal: 16,
            borderWidth: 0.5,
            borderColor: 'rgba(255,255,255,0.05)',
          }}>
            <Ionicons name="search-outline" size={20} color={themeColors.textSecondary} />
            <TextInput
              placeholder="Tìm trong danh sách..."
              placeholderTextColor="rgba(160, 138, 204, 0.5)"
              style={[typography.body, { color: themeColors.textPrimary, marginLeft: 10, flex: 1, paddingVertical: 0 }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity activeOpacity={0.7} onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={themeColors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.filterBtn, {
            backgroundColor: 'rgba(168,85,247,0.22)',
            borderRadius: borderRadius.round,
            borderWidth: 1,
            borderColor: 'rgba(168,85,247,0.5)',
            shadowColor: '#a855f7',
            shadowOpacity: 0.45,
            shadowRadius: 14,
            elevation: 8
          }]}
        >
          <Ionicons name="options-outline" size={20} color={themeColors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={[styles.categoriesContainer, { paddingRight: 40 }]}
      >
        {categories.map((cat, idx) => {
          const isActive = activeCategory === cat;
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              key={idx}
              onPress={() => setActiveCategory(cat)}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: isActive ? themeColors.purple : themeColors.bgCard,
                  borderRadius: borderRadius.round,
                  borderColor: isActive ? themeColors.purple : themeColors.borderCard,
                  borderWidth: 1
                }
              ]}
            >
              <Text style={[typography.body, { color: isActive ? themeColors.textPrimary : themeColors.textSecondary, fontWeight: isActive ? 'bold' : 'normal' }]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  if (loading && favorites.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.bgPrimary, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={themeColors.purple} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bgPrimary }]}>
      {/* Ambient Orbs */}
      <View style={{ position: 'absolute', top: -60, left: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(130,40,255,0.15)', zIndex: 0, pointerEvents: 'none' }} />
      <View style={{ position: 'absolute', top: 80, right: -50, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(200,40,220,0.12)', zIndex: 0, pointerEvents: 'none' }} />
      <View style={{ position: 'absolute', top: '45%', left: -30, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(110,30,220,0.10)', zIndex: 0, pointerEvents: 'none' }} />
      <View style={{ position: 'absolute', top: '50%', right: -40, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(180,40,200,0.10)', zIndex: 0, pointerEvents: 'none' }} />

      <FlatList
        data={filteredFavorites}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ padding: 20, paddingBottom: 150 }}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item, index) => (item.id || item.title || index.toString())}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={{
              width: 70, height: 70, borderRadius: 35,
              backgroundColor: 'rgba(168,85,247,0.10)',
              borderWidth: 0.5, borderColor: 'rgba(200,150,255,0.2)',
              shadowColor: '#c084fc', shadowOpacity: 0.5, shadowRadius: 30, elevation: 12,
              justifyContent: 'center', alignItems: 'center'
            }}>
              <Ionicons name="heart-dislike-outline" size={36} color={themeColors.purple} />
            </View>
            <Text style={[typography.h3, { color: themeColors.textSecondary, marginTop: 16 }]}>
              {favorites.length === 0 ? 'Chưa có món yêu thích' : 'Không tìm thấy kết quả'}
            </Text>
            <Text style={[typography.body, { color: themeColors.textSecondary, textAlign: 'center', marginTop: 8 }]}>
              {favorites.length === 0 ? 'Hãy khám phá và lưu lại những công thức bạn thích nhất!' : 'Thử tìm kiếm với từ khóa khác xem sao.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('AIResult', { initialRecipe: item, imageUri: item.image || item.imageUrl })}
            style={[styles.card, { ...glass.card, width: cardWidth, backgroundColor: themeColors.bgCard }]}
          >
            <View style={styles.imageContainer}>
              <RealImage
                query={item.title || 'mon an'}
                initialUri={item.image || item.imageUrl || DEFAULT_FOOD_IMAGE}
                style={[styles.cardImage, { borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl }]}
              />
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.ratingText}>{item.rating || '5.0'}</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.heartIcon, { ...glass.card, backgroundColor: themeColors.bgCard }]}
                onPress={() => removeFavorite(item)}
              >
                <Ionicons name="heart" size={20} color={themeColors.pink} />
              </TouchableOpacity>
            </View>

            <View style={[styles.cardInfo, { padding: spacing.md }]}>
              <Text style={[styles.categoryText, { color: themeColors.textSecondary, marginBottom: 4, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }]}>
                {item.category || 'Món ăn'}
              </Text>
              <Text numberOfLines={2} style={[styles.recipeName, typography.h3, { color: themeColors.textPrimary, height: 40 }]}>
                {item.name || item.title}
              </Text>

              <View style={styles.metaData}>
                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={14} color={themeColors.textSecondary} />
                  <Text style={[styles.metaText, typography.caption, { color: themeColors.textSecondary }]}>{item.time || item.prep_time || '15p'}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="flame-outline" size={14} color={themeColors.purple} />
                  <Text style={[styles.metaText, typography.caption, { color: themeColors.textSecondary }]}>{item.calories || '---'}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {showSnackbar && (
        <Animated.View style={[
          styles.snackbar,
          {
            backgroundColor: themeColors.textPrimary,
            transform: [{ translateY: snackbarAnim }]
          }
        ]}>
          <Text style={[typography.body, { color: themeColors.bgPrimary, flex: 1 }]}>
            Đã xóa khỏi mục yêu thích
          </Text>
          <TouchableOpacity activeOpacity={0.7} onPress={undoRemove}>
            <Text style={[typography.body, { color: themeColors.purple, fontWeight: 'bold' }]}>
              HOÀN TÁC
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    marginBottom: 20,
    marginTop: Platform.OS === 'ios' ? 20 : 10,
  },
  title: { fontWeight: 'bold', marginBottom: 4 },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 50, marginRight: 12,
  },
  searchInput: { flex: 1, marginLeft: 10, height: '100%' },
  filterBtn: { 
    width: 50, 
    height: 50, 
    justifyContent: 'center', 
    alignItems: 'center',
    ...borderPresets.button,
  },
  categoriesScroll: { marginHorizontal: -20 },
  categoriesContainer: { paddingHorizontal: 20, gap: 10 },
  categoryChip: { 
    paddingHorizontal: 20, 
    paddingVertical: 10,
    ...borderPresets.chip,
  },
  row: { justifyContent: 'space-between', marginBottom: 20 },
  card: { 
    overflow: 'hidden',
    ...borderPresets.cardPurple,
    shadowColor: '#a855f7',
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 4,
  },
  imageContainer: { position: 'relative', height: 140, width: '100%', backgroundColor: '#F3EFE9' },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  ratingBadge: {
    position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12,
  },
  ratingText: { color: '#FFF', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  heartIcon: {
    position: 'absolute', top: 10, right: 10, borderRadius: 16, width: 32, height: 32,
    justifyContent: 'center', alignItems: 'center',
  },
  cardInfo: {},
  categoryText: {},
  recipeName: { fontWeight: 'bold', lineHeight: 20, marginBottom: 8 },
  metaData: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: 'rgba(180,100,255,0.1)', paddingTop: 8,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { marginLeft: 4 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 40 },
  snackbar: {
    position: 'absolute', bottom: 110, left: 20, right: 20, flexDirection: 'row',
    padding: 16, alignItems: 'center',
    ...borderPresets.cardPurple,
    ...glow.button,
  }
});
