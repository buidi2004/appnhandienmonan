import React, { useState, useRef, useEffect } from 'react';
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
  Platform
} from 'react-native';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../../App';

type Props = BottomTabScreenProps<TabParamList, 'Favorites'>;

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1495195129352-aec325b55b65?q=80&w=600&auto=format&fit=crop';

const initialFavorites = [
  { id: '1', name: 'Phở Bò Gia Truyền', time: '45 phút', calories: '400 kcal', rating: 4.9, category: 'Món nước', image: '' }, // Rỗng để test fallback
  { id: '2', name: 'Salad Bơ Ức Gà', time: '10 phút', calories: '250 kcal', rating: 5.0, category: 'Healthy', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600&auto=format&fit=crop' },
  { id: '3', name: 'Bún Chả Hà Nội', time: '30 phút', calories: '450 kcal', rating: 4.8, category: 'Đồ nướng', image: 'https://images.unsplash.com/photo-1614332287897-cdc485fa562d?q=80&w=600&auto=format&fit=crop' },
  { id: '4', name: 'Bánh Mì Thịt Nướng', time: '15 phút', calories: '350 kcal', rating: 4.7, category: 'Ăn nhanh', image: '' }, // Rỗng để test fallback
];

const categories = ['Tất cả', 'Healthy', 'Món nước', 'Ăn nhanh', 'Đồ nướng'];

export default function FavoritesScreen({ navigation }: Props) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [favorites, setFavorites] = useState(initialFavorites);
  const [lastRemovedItem, setLastRemovedItem] = useState<any>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  
  const snackbarAnim = useRef(new Animated.Value(100)).current;
  const undoTimer = useRef<any>(null);

  const removeFavorite = (item: any) => {
    setLastRemovedItem(item);
    setFavorites(prev => prev.filter(f => f.id !== item.id));
    triggerSnackbar();
  };

  const undoRemove = () => {
    if (lastRemovedItem) {
      setFavorites(prev => [...prev, lastRemovedItem].sort((a, b) => a.id.localeCompare(b.id)));
      hideSnackbar();
    }
  };

  const triggerSnackbar = () => {
    setShowSnackbar(true);
    Animated.spring(snackbarAnim, {
      toValue: 0,
      useNativeDriver: true,
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
      {/* Tối ưu 3: Header gọn gàng hơn */}
      <Text style={[styles.title, typography.h1, { color: colors.text }]}>Món ăn yêu thích</Text>
      <Text style={[typography.body, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
        {favorites.length > 0 ? `Bạn đã lưu ${favorites.length} công thức nấu ăn` : 'Bạn chưa có món ăn yêu thích nào'}
      </Text>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderRadius: borderRadius.round }]}>
          <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
          <TextInput 
            placeholder="Tìm trong danh sách..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, typography.body, { color: colors.text }]}
          />
        </View>
        <TouchableOpacity style={[styles.filterBtn, { backgroundColor: colors.primary, borderRadius: borderRadius.round }]}>
          <Ionicons name="options-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Tối ưu 5: Padding Right cho Filter Scroll */}
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
              key={idx}
              onPress={() => setActiveCategory(cat)}
              style={[
                styles.categoryChip, 
                { 
                  backgroundColor: isActive ? colors.primary : colors.card,
                  borderRadius: borderRadius.round,
                  borderColor: isActive ? colors.primary : colors.border,
                  borderWidth: 1
                }
              ]}
            >
              <Text style={[typography.body, { color: isActive ? '#FFF' : colors.text, fontWeight: isActive ? 'bold' : 'normal' }]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={favorites.filter(f => activeCategory === 'Tất cả' || f.category === activeCategory)}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ padding: 20, paddingBottom: 150 }}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-dislike-outline" size={80} color={colors.border} />
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: 16 }]}>Danh sách đang trống</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.card, { width: cardWidth, backgroundColor: colors.card, borderRadius: borderRadius.lg }]}>
            <View style={styles.imageContainer}>
              {/* Tối ưu 1: Fallback Image */}
              <Image 
                source={{ uri: item.image || DEFAULT_FOOD_IMAGE }} 
                style={[styles.cardImage, { borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg }]} 
              />
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.ratingText}>{item.rating}</Text>
              </View>
              {/* Tối ưu 2: Xử lý Bỏ lưu với Snackbar */}
              <TouchableOpacity 
                style={styles.heartIcon} 
                onPress={() => removeFavorite(item)}
              >
                <Ionicons name="heart" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
            
            <View style={[styles.cardInfo, { padding: spacing.md }]}>
              <Text style={[styles.categoryText, { color: colors.secondary, marginBottom: 4, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }]}>
                {item.category}
              </Text>
              <Text numberOfLines={2} style={[styles.recipeName, typography.h3, { color: colors.text, height: 40 }]}>
                {item.name}
              </Text>
              
              <View style={styles.metaData}>
                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.metaText, typography.caption, { color: colors.textSecondary }]}>{item.time}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="flame-outline" size={14} color="#FF9500" />
                  <Text style={[styles.metaText, typography.caption, { color: colors.textSecondary }]}>{item.calories}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Snackbar Undo */}
      <Animated.View style={[
        styles.snackbar, 
        { 
          backgroundColor: colors.text,
          transform: [{ translateY: snackbarAnim }]
        }
      ]}>
        <Text style={[typography.body, { color: colors.background, flex: 1 }]}>
          Đã xóa khỏi mục yêu thích
        </Text>
        <TouchableOpacity onPress={undoRemove}>
          <Text style={[typography.body, { color: colors.primary, fontWeight: 'bold' }]}>
            HOÀN TÁC
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    marginBottom: 20,
    marginTop: Platform.OS === 'ios' ? 20 : 10,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    height: '100%',
  },
  filterBtn: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  categoriesScroll: {
    marginHorizontal: -20,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  imageContainer: {
    position: 'relative',
    height: 140,
    width: '100%',
    backgroundColor: '#F3EFE9', // Fallback background color
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  ratingBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  heartIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFF',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardInfo: {
  },
  categoryText: {
  },
  recipeName: {
    fontWeight: 'bold',
    lineHeight: 20,
    marginBottom: 8,
  },
  metaData: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  snackbar: {
    position: 'absolute',
    bottom: 110,
    left: 20,
    right: 20,
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  }
});
