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
import { RootStackParamList, TabParamList } from '../navigation/types';
import { auth } from '../config/firebaseConfig';
import { themeColors, gradients } from '../theme';
import { glass } from '../theme/glass';
import { glow } from '../theme/glow';
import { shadow } from '../theme/shadow';
import { typography as designTypography } from '../theme/typography';
import { borderWidth, borderRadius, borderColors, borderPresets } from '../theme/borders';


type HomeScreenProps = BottomTabScreenProps<TabParamList, 'Home'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');
const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1495195129352-aec325b55b65?q=80&w=600&auto=format&fit=crop';

const popularRecipes = [
  { id: '1', name: 'Phở bò gia truyền', time: '60 phút', difficulty: 'Khó', image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=600&auto=format&fit=crop', size: 'large', category: 'Món nước' },
  { id: '2', name: 'Bánh mì Sài Gòn', time: '15 phút', difficulty: 'Dễ', image: 'https://images.unsplash.com/photo-1600454021970-351feb4a5149?q=80&w=600&auto=format&fit=crop', size: 'small', category: 'Ăn nhanh' },
  { id: '3', name: 'Cơm tấm Long Xuyên', time: '40 phút', difficulty: 'Vừa', image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?q=80&w=600&auto=format&fit=crop', size: 'medium', category: 'Tất cả' },
  { id: '4', name: 'Bún chả Hà Nội', time: '45 phút', difficulty: 'Vừa', image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?q=80&w=600&auto=format&fit=crop', size: 'medium', category: 'Món nước' },
  { id: '5', name: 'Gỏi cuốn tôm nhảy', time: '20 phút', difficulty: 'Dễ', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=600&auto=format&fit=crop', size: 'small', category: 'Healthy' },
  { id: '6', name: 'Lẩu Thái hải sản', time: '50 phút', difficulty: 'Vừa', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?q=80&w=600&auto=format&fit=crop', size: 'large', category: 'Món nước' },
  { id: '7', name: 'Bún bò Huế', time: '55 phút', difficulty: 'Khó', image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?q=80&w=600&auto=format&fit=crop', size: 'medium', category: 'Món nước' },
  { id: '8', name: 'Bánh xèo miền Tây', time: '35 phút', difficulty: 'Vừa', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=600&auto=format&fit=crop', size: 'medium', category: 'Ăn nhanh' },
  { id: '9', name: 'Cà phê muối Hội An', time: '10 phút', difficulty: 'Dễ', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600&auto=format&fit=crop', size: 'small', category: 'Ăn nhanh' },
  { id: '10', name: 'Pizza Hải Sản', time: '40 phút', difficulty: 'Vừa', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600&auto=format&fit=crop', size: 'large', category: 'Ăn nhanh' },
  { id: '11', name: 'Burger Bò Wagyu', time: '25 phút', difficulty: 'Dễ', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=600&auto=format&fit=crop', size: 'medium', category: 'Ăn nhanh' },
  { id: '12', name: 'Ramen Nhật Bản', time: '45 phút', difficulty: 'Vừa', image: 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?q=80&w=600&auto=format&fit=crop', size: 'medium', category: 'Món nước' },
  { id: '13', name: 'Dimsum Tôm', time: '30 phút', difficulty: 'Vừa', image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=600&auto=format&fit=crop', size: 'small', category: 'Ăn nhanh' },
  { id: '14', name: 'Sườn Nướng BBQ', time: '50 phút', difficulty: 'Vừa', image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?q=80&w=600&auto=format&fit=crop', size: 'large', category: 'Đồ nướng' },
  { id: '15', name: 'Pad Thái Tôm', time: '30 phút', difficulty: 'Vừa', image: 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?q=80&w=600&auto=format&fit=crop', size: 'medium', category: 'Ăn nhanh' },
  { id: '16', name: 'Tôm Hùm Bơ Tỏi', time: '45 phút', difficulty: 'Khó', image: 'https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?q=80&w=600&auto=format&fit=crop', size: 'medium', category: 'Đồ nướng' },
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

    const user = auth.currentUser;
    const userName = user?.displayName || user?.email?.split('@')[0] || 'bạn';

    const hour = new Date().getHours();
    if (hour < 11) setGreeting(`Sáng nay se lạnh, làm tô phở nóng nhé ${userName} ơi!`);
    else if (hour < 14) setGreeting(`Trưa nắng gắt, ${userName} ăn gì cho mát mẻ nào?`);
    else if (hour < 18) setGreeting(`Chiều tà rồi, ${userName} định nấu món gì đãi cả nhà?`);
    else setGreeting(`Tối muộn rồi, làm món gì nhẹ bụng thôi ${userName} nhé!`);
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
        style={[styles.bentoCard, { 
          width: itemWidth, 
          height: itemHeight, 
          backgroundColor: 'rgba(30, 10, 60, 0.8)', 
          ...borderPresets.cardPurple,
          shadowColor: '#c084fc',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 20,
          elevation: 8
        }]}
        onPress={() => navigation.navigate('AIResult', {
          initialRecipe: {
            title: item.name,
            description: `Một trong những món ${item.category} được yêu thích nhất tại Việt Nam.`,
            ingredients: ['Nguyên liệu chính', 'Gia vị đặc trưng', 'Rau thơm'],
            instructions: 'Bước 1: Sơ chế sạch sẽ. Bước 2: Tẩm ướp gia vị. Bước 3: Chế biến theo công thức truyền thống.',
            prep_time: item.time,
            difficulty: item.difficulty || 'Vừa',
            calories: '400 kcal'
          }
        })}
      >
        <Image 
          source={{ uri: item.image || DEFAULT_FOOD_IMAGE }} 
          style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
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
    <View style={{ flex: 1, backgroundColor: '#1A0B3B' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView 
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
        {/* Header Section */}
        <View style={[styles.mainHeader, { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, marginBottom: spacing.md }]}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.h2, { color: '#ffffff', lineHeight: 34 }]}>Khám phá</Text>
            <Text style={[typography.caption, { color: '#a08acc', marginTop: 2 }]}>Món ngon mỗi ngày cho gia đình</Text>
          </View>
          <View style={{
            backgroundColor: 'rgba(30, 10, 60, 0.8)',
            borderWidth: borderWidth.thin,
            borderColor: borderColors.purple.light,
            borderRadius: borderRadius.md,
            overflow: 'hidden'
          }}>
            <TouchableOpacity 
              style={[styles.headerIconButton, { backgroundColor: 'transparent' }]}
              onPress={() => navigation.navigate('ShoppingList')}
            >
              <Ionicons name="cart-outline" size={22} color="#c4a8ff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={[styles.searchBar, { 
            backgroundColor: 'rgba(30, 10, 60, 0.8)',
            marginHorizontal: spacing.lg,
            marginTop: spacing.md,
            borderRadius: borderRadius.xl,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }]}>
            <Ionicons name="search" size={20} color="#a08acc" />
            <TextInput 
              placeholder="Tìm món ngon hôm nay..."
              placeholderTextColor="#a08acc"
              style={[styles.searchInput, { color: '#ffffff' }]}
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
              colors={['rgba(10,0,30,0.92)', 'rgba(14,0,35,0.4)', 'transparent']}
              style={styles.heroGradient}
            >
              <View style={styles.heroContent}>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: borderRadius.md, alignSelf: 'flex-start', marginBottom: 12, borderWidth: borderWidth.normal, borderColor: borderColors.white.strong }}>
                  <Text style={styles.heroGreeting}>XIN CHÀO DĨ 👋</Text>
                </View>
                <Text style={styles.heroTitle}>{greeting}</Text>
                <TouchableOpacity 
                  activeOpacity={0.85}
                  onPress={handleExploreNow}
                  style={[styles.heroBtn, { 
                    backgroundColor: '#a855f7',
                    shadowColor: '#a855f7',
                    shadowOpacity: 0.8,
                    shadowRadius: 16,
                    elevation: 12
                  }]}
                >
                  <Text style={styles.heroBtnText}>Khám phá ngay</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>

        {/* Smart Fridge Inventory Card */}
        <View style={[styles.sectionHeader, { paddingHorizontal: spacing.lg, marginTop: spacing.xl }]}>
          <Text style={[styles.sectionTitle, { color: '#ffffff' }]}>Tủ lạnh thông minh 🧊</Text>
        </View>
        <TouchableOpacity 
          activeOpacity={0.7}
          style={[styles.inventoryCard, { 
            backgroundColor: 'rgba(30, 10, 60, 0.8)',
            ...borderPresets.cardPurple,
            marginHorizontal: spacing.lg,
            shadowColor: '#c084fc',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
          }]}
          onPress={() => navigation.navigate('Inventory')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent' }}>
            <View style={[styles.inventoryIconBox, { 
              backgroundColor: 'rgba(30, 10, 60, 0.8)',
              borderRadius: 16,
              padding: 12,
              borderWidth: borderWidth.normal,
              borderColor: borderColors.purple.heavy,
              shadowColor: '#a855f7',
              shadowOpacity: 0.6,
              shadowRadius: 10,
              marginRight: 16
            }]}>
              <Ionicons name="snow" size={32} color="#c4a8ff" />
            </View>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={[typography.h3, { color: '#ffffff' }]} numberOfLines={1}>Quản lý thực phẩm</Text>
              <Text style={[typography.body, { color: '#a08acc', marginTop: 4 }]} numberOfLines={2}>
                Theo dõi hạn sử dụng để không bỏ phí thực phẩm nào nhé!
              </Text>
              <View style={{ 
                alignSelf: 'flex-start',
                backgroundColor: 'transparent',
                borderWidth: 1,
                borderColor: '#7F77DD',
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 8,
                marginTop: 12 
              }}>
                <Text style={{ color: '#c4a8ff', fontWeight: '600', fontSize: 12 }}>KIỂM TRA NGAY</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Meal Planner Card */}
        <View style={[styles.sectionHeader, { paddingHorizontal: spacing.lg, marginTop: spacing.md }]}>
          <Text style={[styles.sectionTitle, { color: '#ffffff' }]}>Kế hoạch ăn uống 📅</Text>
        </View>
        <TouchableOpacity 
          activeOpacity={0.7}
          style={[styles.plannerCard, { 
            backgroundColor: 'rgba(30, 10, 60, 0.8)',
            ...borderPresets.cardPurple,
            marginHorizontal: spacing.lg,
            shadowColor: '#c084fc',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
          }]}
          onPress={() => navigation.navigate('MealPlanner')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent', flex: 1 }}>
            <View style={{ 
              backgroundColor: 'rgba(30, 10, 60, 0.8)',
              borderRadius: 16,
              padding: 12,
              borderWidth: borderWidth.normal,
              borderColor: borderColors.purple.heavy,
              shadowColor: '#a855f7',
              shadowOpacity: 0.6,
              shadowRadius: 10,
              marginRight: 16 
            }}>
              <Ionicons name="calendar" size={32} color="#c4a8ff" />
            </View>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={[typography.h3, { color: '#ffffff' }]} numberOfLines={1}>Thực đơn tuần này</Text>
              <Text style={[typography.body, { color: '#a08acc', marginTop: 4 }]} numberOfLines={2}>
                Lên lịch bữa sáng, trưa, tối để ăn uống điều độ hơn.
              </Text>
            </View>
          </View>
          <View style={{ paddingLeft: 8 }}>
            <Ionicons name="chevron-forward" size={20} color="#6a5a9a" />
          </View>
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
                    { ...glass.card, ...styles.categoryPill }, 
                    { 
                      backgroundColor: isActive ? themeColors.purple : 'transparent',
                      borderColor: isActive ? themeColors.purple : themeColors.borderCard,
                      borderWidth: borderWidth.normal,
                      marginRight: 10
                    }
                  ]}
                >
                  <Text style={[styles.categoryText, { color: isActive ? themeColors.textPrimary : themeColors.textSecondary, fontWeight: isActive ? 'bold' : '500' }]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Chef's Specials - Horizontal Scroll */}
        <View style={[styles.sectionHeader, { paddingHorizontal: spacing.lg, marginTop: spacing.lg }]}>
          <Text style={[styles.sectionTitle, { color: '#ffffff' }]}>Gợi ý từ đầu bếp 👨‍🍳</Text>
          <TouchableOpacity onPress={() => Alert.alert('Thông báo', 'Danh sách gợi ý đầy đủ đang được cập nhật!')}>
            <Text style={{ color: '#c084fc', fontWeight: 'bold' }}>Tất cả</Text>
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
                  calories: '350 kcal'
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
          <Text style={[styles.sectionTitle, { color: '#ffffff' }]}>Món ngon thịnh hành 🔥</Text>
          <TouchableOpacity onPress={() => Alert.alert('Thông báo', 'Tính năng xem thêm đang được phát triển!')}>
            <Text style={{ color: '#c084fc', fontWeight: 'bold' }}>Xem thêm</Text>
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
              <Ionicons name="restaurant-outline" size={48} color={themeColors.textSecondary} style={{ opacity: 0.5 }} />
              <Text style={{ color: themeColors.textSecondary, marginTop: 16, fontFamily: 'Poppins_400Regular' }}>
                Chưa có món nào trong mục này...
              </Text>
            </View>
          )}
        </View>

          {/* Empty Space for Bottom Nav handled by contentContainerStyle */}
      </ScrollView>
    </SafeAreaView>
  </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  mainHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8,
  },
  headerIconButton: {
    width: 44, height: 44, borderRadius: borderRadius.full, justifyContent: 'center', alignItems: 'center',
  },
  searchSection: { width: '100%' },
  searchBar: { 
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14,
  },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, paddingVertical: 0 },
  heroCard: { height: 240, borderRadius: borderRadius['4xl'], overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { flex: 1, padding: 24, justifyContent: 'flex-end' },
  heroContent: {},
  heroGreeting: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 'bold', letterSpacing: 2, marginBottom: 8 },
  heroTitle: { color: '#FFF', fontSize: 26, fontWeight: 'bold', lineHeight: 34, marginBottom: 16, letterSpacing: -0.5 },
  heroBtn: { alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 10, borderRadius: borderRadius.xl },
  heroBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  inventoryCard: { 
    flexDirection: 'row', padding: 20, alignItems: 'center', justifyContent: 'space-between',
  },
  inventoryInfo: { flex: 1, marginRight: 10 },
  inventoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: borderRadius.md, marginTop: 12 },
  inventoryIconBox: { width: 70, height: 70, borderRadius: borderRadius.full, justifyContent: 'center', alignItems: 'center' },
  plannerCard: { 
    flexDirection: 'row', padding: 16, alignItems: 'center',
  },
  plannerIconBox: { width: 60, height: 60, borderRadius: borderRadius.lg, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  plannerInfo: { flex: 1 },
  categorySection: { },
  categoryPill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: borderRadius.lg },
  categoryText: { fontSize: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold' },
  bentoGridContainer: { paddingHorizontal: 20 },
  bentoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  bentoCard: { overflow: 'hidden' },
  bentoGradient: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 16 },
  bentoName: { fontWeight: 'bold', fontSize: 16, marginBottom: 4, textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: -1, height: 1 }, textShadowRadius: 10 },
  bentoMeta: { flexDirection: 'row', alignItems: 'center' },
  bentoTime: { fontSize: 11, marginLeft: 4, fontWeight: '600' },
  trendingCard: { width: 200, height: 150, marginRight: 16, borderRadius: borderRadius.xl, overflow: 'hidden' },
  trendingImage: { width: '100%', height: '100%' },
  trendingGradient: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 12 },
  trendingName: { color: '#ffffff', fontSize: 14, fontWeight: 'bold', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: -1, height: 1 }, textShadowRadius: 5 },
  trendingMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  trendingTime: { color: '#ffffff', fontSize: 10, marginLeft: 4 },
});
