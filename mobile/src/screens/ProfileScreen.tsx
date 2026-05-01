import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground, Image, Alert, LayoutAnimation, Platform, UIManager } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AlertManager from '../components/CustomAlert';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabParamList, RootStackParamList } from '../../App';
import { LinearGradient } from 'expo-linear-gradient';

type Props = BottomTabScreenProps<TabParamList, 'Profile'>;

export default function ProfileScreen({ navigation: tabNavigation }: Props) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [name, setName] = useState('Bạn');
  const [stats, setStats] = useState({ cooked: 12, favorites: 3, scans: 5 });

  useFocusEffect(
    useCallback(() => {
      const loadProfileData = async () => {
        try {
          const savedAvatar = await AsyncStorage.getItem('userAvatar');
          const savedName = await AsyncStorage.getItem('userName');
          const savedFavorites = await AsyncStorage.getItem('favorites');
          const cooked = await AsyncStorage.getItem('cookedCount');
          const scans = await AsyncStorage.getItem('scanCount');
          
          if (savedAvatar) setAvatar(savedAvatar);
          if (savedName) setName(savedName);
          
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          const favCount = savedFavorites ? JSON.parse(savedFavorites).length : 0;
          setStats({
            cooked: cooked ? parseInt(cooked) : 0,
            favorites: favCount,
            scans: scans ? parseInt(scans) : 0
          });
        } catch (e) {
          console.error('Failed to load profile data', e);
        }
      };
      loadProfileData();
    }, [])
  );

  const getLevel = () => {
    const count = stats.cooked;
    if (count >= 50) return { title: 'SIÊU ĐẦU BẾP', color: '#FF2D55', next: 'Max' };
    if (count >= 20) return { title: 'ĐẦU BẾP CHUYÊN NGHIỆP', color: '#AF52DE', next: 50 };
    if (count >= 10) return { title: 'TAY NGHỀ KHÁ', color: '#5856D6', next: 20 };
    if (count >= 5) return { title: 'TẬP SỰ', color: '#34C759', next: 10 };
    return { title: 'NGƯỜI MỚI BẮT ĐẦU', color: colors.primary, next: 5 };
  };

  const level = getLevel();

  const menuSections = [
    {
      title: 'TÀI KHOẢN',
      items: [
        { icon: 'person-circle', text: 'Chỉnh sửa hồ sơ', color: '#007AFF', route: 'EditProfile' }, 
        { icon: 'fitness', text: 'Hồ sơ sức khỏe', color: '#34C759', route: 'HealthProfile' }, 
        { icon: 'heart', text: 'Món ăn yêu thích', color: '#FF3B30', route: 'FavoritesTab' },           
        { icon: 'star', text: 'Nâng cấp Pro', color: '#FFD700', route: 'ProUpgrade' },          
      ]
    },
    {
      title: 'TÍNH NĂNG',
      items: [
        { icon: 'stats-chart', text: 'Lịch sử & Thống kê', color: '#FF9500', route: 'CookingHistory' },
        { icon: 'nutrition', text: 'Nhật ký dinh dưỡng', color: '#34C759', route: 'NutritionDiary' },
        { icon: 'cart', text: 'Mua nguyên liệu online', color: '#5856D6', route: 'OnlineShopping' },
        { icon: 'calendar', text: 'Kế hoạch ăn tuần', color: '#007AFF', route: 'MealPlanner' },
      ]
    },
    {
      title: 'CÀI ĐẶT & HỖ TRỢ',
      items: [
        { icon: 'settings', text: 'Cài đặt chung', color: '#5856D6', route: 'Settings' },        
        { icon: 'notifications', text: 'Thông báo', color: '#FFCC00', route: 'Notifications', badge: 2 },  
        { icon: 'help-circle', text: 'Trung tâm hỗ trợ', color: '#AF52DE', route: 'Support' },  
      ]
    }
  ];

  const handleLogout = () => {
    AlertManager.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất không?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đăng xuất', 
          style: 'destructive',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Auth' }],
            });
          }
        }
      ]
    );
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=800&auto=format&fit=crop' }}
        style={styles.coverImage}
      >
        <View style={styles.coverOverlay} />
      </ImageBackground>

      <View style={[styles.profileSection, { backgroundColor: colors.background, marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30 }]}>
        <View style={[styles.avatarContainer, { borderColor: colors.background }]}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: `${colors.primary}20`, justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="person" size={40} color={colors.primary} />
            </View>
          )}
          <TouchableOpacity 
            activeOpacity={0.7}
            style={[styles.editAvatarBtn, { backgroundColor: colors.primary, borderColor: colors.background }]} 
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="camera" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.name, typography.h2, { color: colors.text, marginTop: spacing.md }]}>{name}</Text>
        <View style={[styles.badge, { backgroundColor: level.color }]}>
          <Ionicons name="medal" size={14} color="#FFF" style={{ marginRight: 4 }} />
          <Text style={[styles.badgeText, { color: '#FFF' }]}>{level.title}</Text>
        </View>

        <View style={styles.bentoGrid}>
          <View style={[styles.bentoLarge, { backgroundColor: colors.card, borderRadius: 28 }]}>
            <View style={styles.bentoHeader}>
              <View style={[styles.bentoIconWrapper, { backgroundColor: '#FF950020' }]}>
                <Ionicons name="restaurant" size={22} color="#FF9500" />
              </View>
              <View style={styles.bentoTitleContainer}>
                <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: 'bold' }]}>ĐÃ NẤU</Text>
                <Text style={[typography.h2, { color: colors.text, fontWeight: 'bold' }]}>{stats.cooked} <Text style={[typography.body, { fontWeight: 'normal', color: colors.textSecondary }]}>món</Text></Text>
              </View>
            </View>
            <View style={styles.progressContainer}>
              <View style={[styles.progressBarBase, { backgroundColor: colors.border }]}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      backgroundColor: level.color, 
                      width: typeof level.next === 'number' ? `${(stats.cooked / level.next) * 100}%` : '100%' 
                    }
                  ]} 
                />
              </View>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
                {typeof level.next === 'number' ? `Cần ${level.next - stats.cooked} món nữa để lên cấp` : 'Đã đạt cấp tối đa!'}
              </Text>
            </View>
          </View>

          <View style={styles.bentoRow}>
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => tabNavigation.navigate('Favorites')}
              style={[styles.bentoSmall, { backgroundColor: colors.card, borderRadius: 24 }]}
            >
              <View style={[styles.bentoIconWrapper, { backgroundColor: '#FF3B3020', marginBottom: 8 }]}>
                <Ionicons name="heart" size={20} color="#FF3B30" />
              </View>
              <Text style={[typography.h3, { color: colors.text, fontWeight: 'bold' }]}>{stats.favorites}</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>Yêu thích</Text>
            </TouchableOpacity>

            <View style={[styles.bentoSmall, { backgroundColor: colors.card, borderRadius: 24 }]}>
              <View style={[styles.bentoIconWrapper, { backgroundColor: '#007AFF20', marginBottom: 8 }]}>
                <Ionicons name="scan" size={20} color="#007AFF" />
              </View>
              <Text style={[typography.h3, { color: colors.text, fontWeight: 'bold' }]}>{stats.scans}</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>Nhận diện</Text>
            </View>
          </View>
        </View>

        {/* Premium Banner - High Fidelity */}
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => navigation.navigate('ProUpgrade')}
          style={[styles.proBannerWrapper, { shadowColor: colors.primary }]}
        >
          <LinearGradient
            colors={[colors.primary, '#FF9500']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.proBanner}
          >
            <View style={styles.proBannerLeft}>
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
              <Text style={styles.proTitle}>Nâng cấp tài khoản</Text>
              <Text style={styles.proSubtitle}>Mở khóa AI không giới hạn & tính năng cao cấp</Text>
            </View>
            <View style={styles.proIconWrapper}>
              <Ionicons name="sparkles" size={24} color="#FFF" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {menuSections.map((section, idx) => (
          <View key={idx} style={[styles.menuSection, { marginTop: spacing.xl }]}>
            <Text style={[styles.sectionTitle, typography.caption, { color: colors.textSecondary, marginLeft: spacing.md, marginBottom: spacing.sm }]}>
              {section.title}
            </Text>
            <View style={[styles.menuCard, { backgroundColor: colors.card, borderRadius: borderRadius.lg }]}>
              {section.items.map((item, index) => (
                <View key={index}>
                  <TouchableOpacity 
                    activeOpacity={0.7}
                    style={styles.menuItem}
                    onPress={() => {
                      if (item.route === 'FavoritesTab') {
                        tabNavigation.navigate('Favorites');
                      } else {
                        navigation.navigate(item.route as any);
                      }
                    }}
                  >
                    <View style={styles.menuItemLeft}>
                      <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                        <Ionicons name={item.icon as any} size={22} color={item.color} />
                      </View>
                      <Text style={[styles.menuText, typography.body, { color: colors.text, fontWeight: '500' }]}>{item.text}</Text>
                      {(item as any).badge > 0 && (
                        <View style={{ backgroundColor: '#FF3B30', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginLeft: 8 }}>
                          <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>{(item as any).badge}</Text>
                        </View>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.border} />
                  </TouchableOpacity>
                  {index < section.items.length - 1 && (
                    <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={handleLogout}
          style={[styles.logoutBtn, { borderColor: `${colors.error}40`, borderRadius: 30, marginTop: spacing.xl }]}
        >
          <View style={[styles.logoutIconWrapper, { backgroundColor: `${colors.error}15` }]}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
          </View>
          <Text style={[typography.h3, { color: colors.error, fontWeight: 'bold' }]}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  coverImage: {
    width: '100%',
    height: 200,
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  profileSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    marginTop: -60,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#E2DCD3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  name: {
    fontWeight: 'bold',
  },
  badge: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  bentoGrid: {
    width: '100%',
    marginTop: 24,
    gap: 12,
  },
  bentoLarge: {
    width: '100%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  bentoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bentoIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoTitleContainer: {
    marginLeft: 12,
  },
  progressContainer: {
    width: '100%',
  },
  progressBarBase: {
    height: 8,
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  bentoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  bentoSmall: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: 16,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumText: {
    marginLeft: 12,
  },
  menuSection: {
    width: '100%',
  },
  sectionTitle: {
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  menuCard: {
    width: '100%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
  },
  menuDivider: {
    height: 1,
    marginLeft: 72,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    gap: 12,
    marginBottom: 40,
  },
  logoutIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proBannerWrapper: {
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  proBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 24,
    overflow: 'hidden',
  },
  proBannerLeft: {
    flex: 1,
  },
  proBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  proBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  proTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  proSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  proIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
});
