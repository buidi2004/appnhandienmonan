import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  FlatList, 
  SafeAreaView, 
  Dimensions,
  ImageBackground,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { requestNotificationPermissions, scheduleDailyNotifications } from '../services/notificationService';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, TabParamList } from '../../App';

type HomeScreenProps = BottomTabScreenProps<TabParamList, 'Home'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');
const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1495195129352-aec325b55b65?q=80&w=600&auto=format&fit=crop';

const popularRecipes = [
  { id: '1', name: 'Phở bò gia truyền', time: '60 phút', difficulty: 'Khó', image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=600&auto=format&fit=crop', size: 'large', category: 'Món nước' },
  { id: '2', name: 'Bánh mì Sài Gòn', time: '15 phút', difficulty: 'Dễ', image: 'https://images.unsplash.com/photo-1600454021970-351feb4a5149?q=80&w=600&auto=format&fit=crop', size: 'small', category: 'Ăn nhanh' },
  { id: '3', name: 'Cơm tấm Long Xuyên', time: '40 phút', difficulty: 'Vừa', image: 'https://images.unsplash.com/photo-1567034680077-d64e43f1f727?q=80&w=600&auto=format&fit=crop', size: 'medium', category: 'Tất cả' },
  { id: '4', name: 'Bún chả Hà Nội', time: '45 phút', difficulty: 'Vừa', image: 'https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=600&auto=format&fit=crop', size: 'medium', category: 'Món nước' },
  { id: '5', name: 'Gỏi cuốn tôm nhảy', time: '20 phút', difficulty: 'Dễ', image: 'https://images.unsplash.com/photo-1539136788836-3bc8513c1419?q=80&w=600&auto=format&fit=crop', size: 'small', category: 'Healthy' },
  { id: '6', name: 'Lẩu Thái hải sản', time: '50 phút', difficulty: 'Vừa', image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?q=80&w=600&auto=format&fit=crop', size: 'large', category: 'Món nước' },
  { id: '7', name: 'Bún bò Huế', time: '55 phút', difficulty: 'Khó', image: 'https://images.unsplash.com/photo-1624538356391-7667232230da?q=80&w=600&auto=format&fit=crop', size: 'medium', category: 'Món nước' },
  { id: '8', name: 'Bánh xèo miền Tây', time: '35 phút', difficulty: 'Vừa', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=600&auto=format&fit=crop', size: 'medium', category: 'Ăn nhanh' },
  { id: '9', name: 'Cà phê muối Hội An', time: '10 phút', difficulty: 'Dễ', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=600&auto=format&fit=crop', size: 'small', category: 'Ăn nhanh' },
  { id: '10', name: 'Pizza Hải Sản', time: '40 phút', difficulty: 'Vừa', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=600&auto=format&fit=crop', size: 'large', category: 'Ăn nhanh' },
  { id: '11', name: 'Burger Bò Wagyu', time: '25 phút', difficulty: 'Dễ', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop', size: 'medium', category: 'Ăn nhanh' },
  { id: '12', name: 'Ramen Nhật Bản', time: '45 phút', difficulty: 'Vừa', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=600&auto=format&fit=crop', size: 'medium', category: 'Món nước' },
  { id: '13', name: 'Dimsum Tôm', time: '30 phút', difficulty: 'Vừa', image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?q=80&w=600&auto=format&fit=crop', size: 'small', category: 'Ăn nhanh' },
  { id: '14', name: 'Sườn Nướng BBQ', time: '50 phút', difficulty: 'Vừa', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop', size: 'large', category: 'Đồ nướng' },
  { id: '15', name: 'Pad Thái Tôm', time: '30 phút', difficulty: 'Vừa', image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=600&auto=format&fit=crop', size: 'medium', category: 'Ăn nhanh' },
  { id: '16', name: 'Tôm Hùm Bơ Tỏi', time: '45 phút', difficulty: 'Khó', image: 'https://images.unsplash.com/photo-1559740038-76508d5119be?q=80&w=600&auto=format&fit=crop', size: 'medium', category: 'Đồ nướng' },
];

const trendingRecipes = [
  { id: '101', name: 'Mì Ý sốt bò băm', time: '30 phút', image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=600&auto=format&fit=crop', category: 'Ăn nhanh' },
  { id: '102', name: 'Salad ức gà', time: '15 phút', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600&auto=format&fit=crop', category: 'Healthy' },
  { id: '103', name: 'Sushi Nhật Bản', time: '45 phút', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=600&auto=format&fit=crop', category: 'Healthy' },
  { id: '104', name: 'Steak bò Mỹ', time: '25 phút', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop', category: 'Đồ nướng' },
];

const categories = ['Tất cả', 'Món nước', 'Healthy', 'Đồ nướng', 'Ăn nhanh', 'Món chay'];

export default function HomeScreen({ navigation: tabNavigation }: HomeScreenProps) {
  const navigation = useNavigation<NavigationProp>();
  const { colors, typography, spacing, borderRadius } = useAppTheme();
  const [greeting, setGreeting] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = React.useRef<ScrollView>(null);

  useEffect(() => {
    const checkNotifications = async () => {
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Thông báo', 
          'Ứng dụng cần quyền thông báo để gợi ý món ăn hàng ngày cho bạn. Vui lòng cấp quyền trong Cài đặt.',
          [{ text: 'Đã hiểu' }]
        );
      }
    };
    checkNotifications();

    const hour = new Date().getHours();
    if (hour < 11) setGreeting('Sáng nay se lạnh, làm tô phở nóng nhé Dĩ ơi!');
    else if (hour < 14) setGreeting('Trưa nắng gắt, Dĩ ăn gì cho mát mẻ nào?');
    else if (hour < 18) setGreeting('Chiều tà rồi, Dĩ định nấu món gì đãi cả nhà?');
    else setGreeting('Tối muộn rồi, làm món gì nhẹ bụng thôi Dĩ nhé!');
  }, []);

  const filteredRecipes = popularRecipes.filter(r => {
    const matchCategory = activeCategory === 'Tất cả' || r.category === activeCategory;
    const matchSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleExploreNow = () => {
    // Cuộn xuống phần Gợi ý từ đầu bếp
    scrollRef.current?.scrollTo({ y: 400, animated: true });
  };

  const renderBentoItem = (item: any) => {
    const isLarge = item.size === 'large';
    const isMedium = item.size === 'medium';
    const usableWidth = width - 52; // 20 padding each side + 12 gap
    const itemWidth = isLarge ? usableWidth * 0.67 : (isMedium ? usableWidth * 0.485 : usableWidth * 0.30);
    const itemHeight = isLarge ? 240 : 200;

    return (
      <TouchableOpacity 
        key={item.id}
        activeOpacity={0.9}
        style={[styles.bentoCard, { width: itemWidth, height: itemHeight, borderRadius: 24, backgroundColor: colors.card }]}
        onPress={() => navigation.navigate('AIResult', {
          initialRecipe: {
            title: item.name,
            description: `Một trong những món ${item.category} được yêu thích nhất tại Việt Nam.`,
            ingredients: ['Nguyên liệu chính', 'Gia vị đặc trưng', 'Rau thơm'],
            instructions: 'Bước 1: Sơ chế sạch sẽ. Bước 2: Tẩm ướp gia vị. Bước 3: Chế biến theo công thức truyền thống.',
            prep_time: item.time,
            difficulty: item.difficulty || 'Vừa',
            calories: '400 kcal',
            image: item.image,
            imageUrl: item.image
          }
        })}
      >
        <Image 
          source={{ uri: item.image || DEFAULT_FOOD_IMAGE }} 
          style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
          style={styles.bentoGradient}
        >
          <Text style={[styles.bentoName, { color: '#FFF' }]} numberOfLines={2}>{item.name}</Text>
          <View style={styles.bentoMeta}>
            <Ionicons name="time-outline" size={12} color="#FFF" />
            <Text style={[styles.bentoTime, { color: '#FFF' }]}>{item.time}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView 
        ref={scrollRef}
        style={styles.container} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={[styles.mainHeader, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
          <View>
            <Text style={[typography.h2, { color: colors.text }]}>Khám phá</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Món ngon mỗi ngày cho gia đình</Text>
          </View>
          <TouchableOpacity 
            style={[styles.headerIconButton, { backgroundColor: colors.card }]}
            onPress={() => navigation.navigate('ShoppingList')}
          >
            <Ionicons name="cart-outline" size={24} color={colors.primary} />
            {/* Có thể thêm badge ở đây nếu muốn */}
          </TouchableOpacity>
        </View>

        {/* Search Bar - Editorial Style */}
        <View style={[styles.searchSection, { paddingHorizontal: spacing.lg, marginTop: spacing.md }]}>
          <View style={[styles.searchBar, { backgroundColor: colors.card, borderRadius: 30 }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput 
              placeholder="Tìm món ngon hôm nay..."
              placeholderTextColor={colors.textSecondary}
              style={[styles.searchInput, { color: colors.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Hero Card Banner */}
        <TouchableOpacity 
          style={[styles.heroCard, { marginHorizontal: spacing.lg, marginTop: spacing.xl }]}
          onPress={handleExploreNow}
        >
          <ImageBackground 
            source={{ uri: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=800&auto=format&fit=crop' }}
            style={styles.heroImage}
            imageStyle={{ borderRadius: 32 }}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
              style={styles.heroGradient}
            >
              <View style={styles.heroContent}>
                <Text style={styles.heroGreeting}>XIN CHÀO DĨ 👋</Text>
                <Text style={styles.heroTitle}>{greeting}</Text>
                <View style={[styles.heroBtn, { backgroundColor: colors.primary }]}>
                  <Text style={styles.heroBtnText}>Khám phá ngay</Text>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>

        {/* Smart Fridge Inventory Card */}
        <View style={[styles.sectionHeader, { paddingHorizontal: spacing.lg, marginTop: spacing.xl }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tủ lạnh thông minh 🧊</Text>
        </View>
        <TouchableOpacity 
          style={[styles.inventoryCard, { marginHorizontal: spacing.lg, backgroundColor: colors.card, borderRadius: 24 }]}
          onPress={() => navigation.navigate('Inventory')}
        >
          <View style={styles.inventoryInfo}>
            <Text style={[typography.h3, { color: colors.text }]}>Quản lý thực phẩm</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: 4 }]}>
              Theo dõi hạn sử dụng để không bỏ phí thực phẩm nào nhé!
            </Text>
            <View style={[styles.inventoryBadge, { backgroundColor: `${colors.primary}15` }]}>
              <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 12 }}>KIỂM TRA NGAY</Text>
            </View>
          </View>
          <View style={[styles.inventoryIconBox, { backgroundColor: `${colors.primary}10` }]}>
            <Ionicons name="snow" size={40} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {/* Meal Planner Card */}
        <View style={[styles.sectionHeader, { paddingHorizontal: spacing.lg, marginTop: spacing.xl }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Kế hoạch ăn uống 📅</Text>
        </View>
        <TouchableOpacity 
          style={[styles.plannerCard, { marginHorizontal: spacing.lg, backgroundColor: colors.card, borderRadius: 24 }]}
          onPress={() => navigation.navigate('MealPlanner')}
        >
          <View style={[styles.plannerIconBox, { backgroundColor: '#5856D615' }]}>
            <Ionicons name="calendar" size={32} color="#5856D6" />
          </View>
          <View style={styles.plannerInfo}>
            <Text style={[typography.h3, { color: colors.text }]}>Thực đơn tuần này</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: 4 }]}>
              Lên lịch bữa sáng, trưa, tối để ăn uống điều độ hơn.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.border} />
        </TouchableOpacity>

        {/* Category Pills - Horizontal Scroll */}
        <View style={styles.categorySection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.xl }}
          >
            {categories.map((cat, idx) => {
              const isActive = activeCategory === cat;
              return (
                <TouchableOpacity 
                  key={idx}
                  onPress={() => setActiveCategory(cat)}
                  style={[
                    styles.categoryPill, 
                    { 
                      backgroundColor: isActive ? colors.primary : 'transparent',
                      borderColor: isActive ? colors.primary : '#E0E0E0',
                      borderWidth: 1,
                      marginRight: 10
                    }
                  ]}
                >
                  <Text style={[styles.categoryText, { color: isActive ? '#FFF' : colors.text, fontWeight: isActive ? 'bold' : '500' }]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Chef's Specials - Horizontal Scroll */}
        <View style={[styles.sectionHeader, { paddingHorizontal: spacing.lg, marginTop: spacing.lg }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Gợi ý từ đầu bếp ✨</Text>
          <TouchableOpacity onPress={() => Alert.alert('Thông báo', 'Danh sách gợi ý đầy đủ đang được cập nhật!')}>
            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Tất cả</Text>
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}
        >
          {trendingRecipes.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.trendingCard}
              onPress={() => navigation.navigate('AIResult', {
                initialRecipe: {
                  title: item.name,
                  description: `Món ${item.name} thơm ngon, bổ dưỡng chuẩn vị nhà làm.`,
                  ingredients: ['Nguyên liệu 1', 'Nguyên liệu 2', 'Gia vị'],
                  instructions: 'Bước 1: Sơ chế nguyên liệu. Bước 2: Chế biến. Bước 3: Hoàn thành và thưởng thức.',
                  prep_time: item.time,
                  difficulty: 'Vừa',
                  calories: '350 kcal',
                  image: item.image,
                  imageUrl: item.image
                }
              })}
            >
              <Image source={{ uri: item.image }} style={styles.trendingImage} resizeMode="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.trendingGradient}
              >
                <Text style={styles.trendingName}>{item.name}</Text>
                <View style={styles.trendingMeta}>
                  <Ionicons name="time-outline" size={12} color="#FFF" />
                  <Text style={styles.trendingTime}>{item.time}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Popular Bento Grid */}
        <View style={[styles.sectionHeader, { paddingHorizontal: spacing.lg, marginTop: spacing.md }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Món ngon thịnh hành 🔥</Text>
          <TouchableOpacity onPress={() => Alert.alert('Thông báo', 'Tính năng xem thêm đang được phát triển!')}>
            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Xem thêm</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bentoGridContainer}>
          {Array.from({ length: Math.ceil(filteredRecipes.length / 2) }).map((_, rowIndex) => (
            <View key={rowIndex} style={[styles.bentoRow, rowIndex > 0 && { marginTop: 12 }]}>
              {renderBentoItem(filteredRecipes[rowIndex * 2])}
              {filteredRecipes[rowIndex * 2 + 1] && renderBentoItem(filteredRecipes[rowIndex * 2 + 1])}
            </View>
          ))}
          {filteredRecipes.length === 0 && (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Ionicons name="restaurant-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.5 }} />
              <Text style={{ color: colors.textSecondary, marginTop: 16, fontFamily: 'Poppins_400Regular' }}>
                Chưa có món nào trong mục này...
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  mainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  searchSection: {
    width: '100%',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    paddingVertical: 0,
  },
  heroCard: {
    height: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  inventoryCard: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  inventoryInfo: {
    flex: 1,
    marginRight: 10,
  },
  inventoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
  },
  inventoryIconBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plannerCard: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  plannerIconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  plannerInfo: {
    flex: 1,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 24,
    borderRadius: 32,
  },
  heroContent: {
  },
  heroGreeting: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 8,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 30,
    marginBottom: 16,
  },
  heroBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  heroBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  categorySection: {
  },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  categoryText: {
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  bentoGridContainer: {
    paddingHorizontal: 20,
  },
  bentoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bentoCard: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  bentoGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 16,
  },
  bentoName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
  bentoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bentoTime: {
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '600'
  },
  trendingCard: {
    width: 200,
    height: 150,
    marginRight: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  trendingImage: {
    width: '100%',
    height: '100%',
  },
  trendingGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 12,
  },
  trendingName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
  trendingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  trendingTime: {
    color: '#FFF',
    fontSize: 10,
    marginLeft: 4,
  },
});
