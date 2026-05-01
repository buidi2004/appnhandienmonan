import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme } from '../theme/theme';
import { RootStackParamList, TabParamList } from '../../App';
import { SafeImage } from '../components/RealImage';
import AnimatedButton from '../components/AnimatedButton';
import EmptyState from '../components/EmptyState';

type HomeScreenProps = BottomTabScreenProps<TabParamList, 'Home'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');
const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1495195129352-aec325b55b65?q=80&w=600&auto=format&fit=crop';

const pantrySnapshot = [
  { label: 'Đề xuất', value: '5', helper: 'món đang hợp bối cảnh hôm nay', icon: 'sparkles-outline', tone: 'success' },
  { label: 'Ít phải mua', value: '3', helper: 'món chỉ thiếu vài nguyên liệu', icon: 'basket-outline', tone: 'accent' },
  { label: 'Nhanh nhất', value: '15p', helper: 'món gọn cho lúc ít thời gian', icon: 'timer-outline', tone: 'warning' },
];

const popularRecipes = [
  {
    id: '1',
    name: 'Phở bò gia truyền',
    time: '60 phút',
    difficulty: 'Khó',
    image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=600&auto=format&fit=crop',
    category: 'Món nước',
    match: 72,
    uses: '4/7 nguyên liệu',
    missing: 'xương bò, bánh phở, rau thơm',
    description: 'Nước dùng thanh, hợp khi có nhiều thời gian chuẩn bị.',
    instructions: 'Bước 1: Ninh xương bò cùng gừng nướng và hành tây nướng để lấy nước dùng ngọt. Bước 2: Nướng thơm hồi, quế, thảo quả rồi cho vào túi lọc. Bước 3: Nêm mắm, muối, đường phèn vừa vị. Bước 4: Chần bánh phở, xếp thịt bò thái mỏng và rau thơm. Bước 5: Chan nước dùng đang sôi để làm tái thịt.',
    ingredients: ['Xương ống bò', 'Thịt bò phi lê', 'Bánh phở tươi', 'Quế, hồi, thảo quả', 'Hành lá', 'Ngò gai'],
  },
  {
    id: '2',
    name: 'Bánh mì Sài Gòn',
    time: '15 phút',
    difficulty: 'Dễ',
    image: 'https://images.unsplash.com/photo-1600454021970-351feb4a5149?q=80&w=600&auto=format&fit=crop',
    category: 'Ăn nhanh',
    match: 91,
    uses: '5/6 nguyên liệu',
    missing: 'đồ chua',
    description: 'Nhanh, gọn, hợp bữa sáng hoặc bữa xế.',
    instructions: 'Bước 1: Nướng lại bánh mì cho vỏ giòn. Bước 2: Rạch bánh, phết pate và bơ. Bước 3: Xếp chả lụa, thịt nguội, dưa leo và ngò rí. Bước 4: Thêm đồ chua, nước tương và tương ớt vừa ăn.',
    ingredients: ['Bánh mì', 'Pate gan', 'Chả lụa', 'Đồ chua', 'Bơ', 'Ngò rí'],
  },
  {
    id: '3',
    name: 'Cơm tấm Long Xuyên',
    time: '40 phút',
    difficulty: 'Vừa',
    image: 'https://images.unsplash.com/photo-1567034680077-d64e43f1f727?q=80&w=600&auto=format&fit=crop',
    category: 'Cơm nhà',
    match: 84,
    uses: '6/8 nguyên liệu',
    missing: 'bì heo, đồ chua',
    description: 'No lâu, đậm vị, hợp bữa trưa nhiều năng lượng.',
    instructions: 'Bước 1: Hấp gạo tấm đến khi cơm tơi. Bước 2: Ướp sườn với tỏi, mật ong và nước mắm. Bước 3: Nướng sườn đến khi vàng cạnh. Bước 4: Làm chả trứng, mỡ hành và nước mắm chua ngọt. Bước 5: Bày cơm cùng sườn, chả, bì và đồ chua.',
    ingredients: ['Gạo tấm', 'Sườn heo', 'Trứng', 'Bì heo', 'Mỡ hành', 'Nước mắm'],
  },
  {
    id: '4',
    name: 'Salad ức gà',
    time: '15 phút',
    difficulty: 'Dễ',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600&auto=format&fit=crop',
    category: 'Healthy',
    match: 88,
    uses: '5/6 nguyên liệu',
    missing: 'dầu olive',
    description: 'Nhẹ bụng, nhiều đạm, phù hợp bữa tối nhanh.',
    instructions: 'Bước 1: Áp chảo ức gà với muối tiêu. Bước 2: Rửa sạch xà lách, cà chua bi, dưa leo và bơ. Bước 3: Pha sốt dầu giấm với chanh và mật ong. Bước 4: Trộn nhẹ rau củ, gà và sốt.',
    ingredients: ['Ức gà', 'Xà lách', 'Cà chua bi', 'Dưa leo', 'Bơ', 'Dầu olive'],
  },
  {
    id: '5',
    name: 'Canh chua cá',
    time: '35 phút',
    difficulty: 'Vừa',
    image: 'https://images.unsplash.com/photo-1625937286074-9ca519d5d9df?q=80&w=600&auto=format&fit=crop',
    category: 'Món nước',
    match: 79,
    uses: '6/8 nguyên liệu',
    missing: 'bạc hà, me',
    description: 'Vị chua dịu, dễ ăn, hợp bữa cơm gia đình.',
    instructions: 'Bước 1: Sơ chế cá và rau nấu canh. Bước 2: Phi thơm hành, cho cà chua vào xào. Bước 3: Thêm nước, me và nêm vị chua ngọt. Bước 4: Cho cá vào nấu chín rồi thêm rau, ngò gai và ớt.',
    ingredients: ['Cá', 'Cà chua', 'Thơm', 'Đậu bắp', 'Bạc hà', 'Me', 'Ngò gai'],
  },
];

const categories = ['Tất cả', 'Cơm nhà', 'Món nước', 'Healthy', 'Ăn nhanh'];

export default function HomeScreen({ navigation: tabNavigation }: HomeScreenProps) {
  const navigation = useNavigation<NavigationProp>();
  const { colors, spacing, borderRadius } = useAppTheme();
  const [greeting, setGreeting] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 11) setGreeting('Bữa sáng nên nhanh, ấm và ít thao tác.');
    else if (hour < 14) setGreeting('Bữa trưa cần đủ năng lượng nhưng không quá nặng.');
    else if (hour < 18) setGreeting('Chuẩn bị bữa tối từ những gì còn trong bếp.');
    else setGreeting('Tối rồi, ưu tiên món nhẹ và dọn bếp nhanh.');
  }, []);

  const filteredRecipes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return popularRecipes.filter((recipe) => {
      const matchCategory = activeCategory === 'Tất cả' || recipe.category === activeCategory;
      const matchSearch = !query || recipe.name.toLowerCase().includes(query);
      return matchCategory && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  const openRecipe = (recipe: typeof popularRecipes[number]) => {
    navigation.navigate('AIResult', {
      initialRecipe: {
        title: recipe.name,
        description: recipe.description,
        ingredients: recipe.ingredients,
        missing_ingredients: recipe.missing.split(',').map(item => item.trim()).filter(Boolean),
        instructions: recipe.instructions,
        prep_time: recipe.time,
        difficulty: recipe.difficulty,
        calories: recipe.category === 'Healthy' ? '320 kcal' : '420 kcal',
        image: recipe.image,
        imageUrl: recipe.image,
      },
    });
  };

  const toneColor = (tone: string) => {
    if (tone === 'success') return colors.success;
    if (tone === 'accent') return colors.accent;
    if (tone === 'warning') return colors.warning;
    return colors.primary;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
          <View style={styles.headerCopy}>
            <Text style={[styles.kicker, { color: colors.primary }]}>BẾP HÔM NAY</Text>
            <Text style={[styles.title, { color: colors.text }]}>Nấu từ những gì bạn đang có</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{greeting}</Text>
          </View>
          <AnimatedButton
            activeOpacity={0.7}
            style={[styles.cartButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('ShoppingList')}
          >
            <Ionicons name="cart-outline" size={22} color={colors.primary} />
          </AnimatedButton>
        </View>

        <View style={[styles.commandPanel, { marginHorizontal: spacing.lg, backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.md }]}>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={19} color={colors.textSecondary} />
            <TextInput
              placeholder="Tìm món, nguyên liệu hoặc kiểu bữa ăn"
              placeholderTextColor={colors.textSecondary}
              style={[styles.searchInput, { color: colors.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <View style={[styles.commandDivider, { backgroundColor: colors.border }]} />
          <View style={styles.primaryActions}>
            <AnimatedButton
              activeOpacity={0.75}
              style={[styles.scanAction, { backgroundColor: colors.primary }]}
              onPress={() => tabNavigation.navigate('Camera')}
            >
              <Ionicons name="camera" size={21} color="#FFF" />
              <Text style={styles.scanActionText}>Quét bếp</Text>
            </AnimatedButton>
            <AnimatedButton
              activeOpacity={0.75}
              style={[styles.typeAction, { borderColor: colors.border }]}
              onPress={() => navigation.navigate('IngredientInput')}
            >
              <Ionicons name="create-outline" size={19} color={colors.primary} />
              <Text style={[styles.typeActionText, { color: colors.text }]}>Nhập tay</Text>
            </AnimatedButton>
          </View>
        </View>

        <View style={[styles.snapshotRow, { paddingHorizontal: spacing.lg }]}>
          {pantrySnapshot.map((item) => {
            const color = toneColor(item.tone);
            return (
              <View key={item.label} style={[styles.snapshotCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.md }]}>
                <View style={[styles.snapshotIcon, { backgroundColor: `${color}14` }]}>
                  <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={18} color={color} />
                </View>
                <Text style={[styles.snapshotValue, { color: colors.text }]}>{item.value}</Text>
                <Text style={[styles.snapshotLabel, { color: colors.text }]}>{item.label}</Text>
                <Text style={[styles.snapshotHelper, { color: colors.textSecondary }]} numberOfLines={2}>{item.helper}</Text>
              </View>
            );
          })}
        </View>

        <View style={[styles.sectionHeader, { paddingHorizontal: spacing.lg }]}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Gợi ý hợp bếp</Text>
            <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>Ưu tiên món dùng được nhiều nguyên liệu sẵn có.</Text>
          </View>
          <AnimatedButton onPress={() => navigation.navigate('Inventory')} style={styles.textAction}>
            <Text style={[styles.textActionLabel, { color: colors.primary }]}>Tủ bếp</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
          </AnimatedButton>
        </View>

        <View style={styles.categorySection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg }}
          >
            {categories.map((category) => {
              const selected = activeCategory === category;
              return (
                <AnimatedButton
                  key={category}
                  activeOpacity={0.7}
                  onPress={() => setActiveCategory(category)}
                  style={[
                    styles.categoryPill,
                    {
                      backgroundColor: selected ? colors.primary : colors.card,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.categoryText, { color: selected ? '#FFF' : colors.text }]}>{category}</Text>
                </AnimatedButton>
              );
            })}
          </ScrollView>
        </View>

        <View style={[styles.recipeList, { paddingHorizontal: spacing.lg }]}>
          {filteredRecipes.length === 0 ? (
            <EmptyState
              icon="restaurant-outline"
              title="Chưa có món phù hợp"
              description="Hãy đổi từ khóa hoặc quét nguyên liệu để AI dựng gợi ý sát bếp hơn."
              buttonText="Quét nguyên liệu"
              onPress={() => tabNavigation.navigate('Camera')}
              style={{ paddingHorizontal: 0 }}
            />
          ) : (
            filteredRecipes.map((recipe, index) => (
              <AnimatedButton
                key={recipe.id}
                activeOpacity={0.86}
                style={[
                  styles.recipeCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: borderRadius.md,
                    marginTop: index === 0 ? 0 : 12,
                  },
                ]}
                onPress={() => openRecipe(recipe)}
              >
                <View style={styles.recipeImageWrap}>
                  <SafeImage uri={recipe.image || DEFAULT_FOOD_IMAGE} style={styles.recipeImage} />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.68)']} style={styles.recipeImageShade}>
                    <View style={styles.matchBadge}>
                      <Ionicons name="sparkles" size={12} color="#FFF" />
                      <Text style={styles.matchBadgeText}>{recipe.match}% hợp bếp</Text>
                    </View>
                  </LinearGradient>
                </View>
                <View style={styles.recipeInfo}>
                  <View style={styles.recipeTitleRow}>
                    <Text style={[styles.recipeName, { color: colors.text }]} numberOfLines={2}>{recipe.name}</Text>
                    <Ionicons name="chevron-forward" size={19} color={colors.textSecondary} />
                  </View>
                  <Text style={[styles.recipeDescription, { color: colors.textSecondary }]} numberOfLines={2}>{recipe.description}</Text>
                  <View style={styles.recipeMetaRow}>
                    <View style={[styles.metaChip, { backgroundColor: `${colors.primary}10` }]}>
                      <Ionicons name="time-outline" size={13} color={colors.primary} />
                      <Text style={[styles.metaText, { color: colors.primary }]}>{recipe.time}</Text>
                    </View>
                    <View style={[styles.metaChip, { backgroundColor: `${colors.accent}10` }]}>
                      <Ionicons name="speedometer-outline" size={13} color={colors.accent} />
                      <Text style={[styles.metaText, { color: colors.accent }]}>{recipe.difficulty}</Text>
                    </View>
                  </View>
                  <View style={[styles.kitchenFit, { borderColor: colors.border }]}>
                    <Text style={[styles.kitchenFitStrong, { color: colors.text }]}>{recipe.uses}</Text>
                    <Text style={[styles.kitchenFitText, { color: colors.textSecondary }]} numberOfLines={1}>Thiếu: {recipe.missing}</Text>
                  </View>
                </View>
              </AnimatedButton>
            ))
          )}
        </View>

        <View style={[styles.planningBand, { marginHorizontal: spacing.lg, backgroundColor: colors.cardSecondary, borderRadius: borderRadius.md }]}>
          <View style={[styles.planningIcon, { backgroundColor: `${colors.secondary}16` }]}>
            <Ionicons name="calendar-outline" size={22} color={colors.secondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.planningTitle, { color: colors.text }]}>Lên bữa cho cả tuần</Text>
            <Text style={[styles.planningText, { color: colors.textSecondary }]}>Kết hợp tủ bếp, khẩu vị và lịch nấu để giảm mua thừa.</Text>
          </View>
          <AnimatedButton onPress={() => navigation.navigate('MealPlanner')} style={[styles.planningButton, { backgroundColor: colors.secondary }]}>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </AnimatedButton>
        </View>

        <View style={{ height: 110 }} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 18,
  },
  headerCopy: {
    flex: 1,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
  },
  cartButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commandPanel: {
    borderWidth: 1,
    padding: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 10,
    fontSize: 14,
  },
  commandDivider: {
    height: 1,
    marginVertical: 10,
  },
  primaryActions: {
    flexDirection: 'row',
    gap: 10,
  },
  scanAction: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scanActionText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 15,
  },
  typeAction: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  typeActionText: {
    fontWeight: '800',
    fontSize: 15,
  },
  snapshotRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  snapshotCard: {
    flex: 1,
    minHeight: 142,
    borderWidth: 1,
    padding: 12,
  },
  snapshotIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  snapshotValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  snapshotLabel: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  snapshotHelper: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: '900',
  },
  sectionHint: {
    fontSize: 12,
    marginTop: 4,
  },
  textAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  textActionLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  categorySection: {
    marginBottom: 14,
  },
  categoryPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 15,
    paddingVertical: 9,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '700',
  },
  recipeList: {},
  recipeCard: {
    width: '100%',
    minHeight: 184,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: width > 380 ? 'row' : 'column',
  },
  recipeImageWrap: {
    width: width > 380 ? 136 : '100%',
    height: width > 380 ? 184 : 170,
    position: 'relative',
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  recipeImageShade: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 10,
  },
  matchBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.56)',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  matchBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  recipeInfo: {
    flex: 1,
    padding: 14,
  },
  recipeTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  recipeName: {
    flex: 1,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
  },
  recipeDescription: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  recipeMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '800',
  },
  kitchenFit: {
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 10,
  },
  kitchenFitStrong: {
    fontSize: 13,
    fontWeight: '900',
  },
  kitchenFitText: {
    marginTop: 3,
    fontSize: 12,
  },
  planningBand: {
    marginTop: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planningIcon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planningTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  planningText: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  planningButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
