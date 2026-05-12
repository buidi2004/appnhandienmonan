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
import { TabParamList, RootStackParamList } from '../navigation/types';
import { LinearGradient } from 'expo-linear-gradient';
import { themeColors, gradients } from '../theme';
import { glass } from '../theme/glass';
import { glow } from '../theme/glow';
import { shadow } from '../theme/shadow';
import { typography as designTypography } from '../theme/typography';
import { borderWidth, borderRadius, borderColors, borderPresets } from '../theme/borders';
import GlassCard from '../components/ui/GlassCard';


type Props = BottomTabScreenProps<TabParamList, 'Profile'>;

export default function ProfileScreen({ navigation: tabNavigation }: Props) {
  const { colors, typography, spacing, borderRadius: themeRadius } = useAppTheme();
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
    return { title: 'NGƯỜI MỚI BẮT ĐẦU', color: themeColors.purple, next: 5 };
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
      style={[styles.container, { backgroundColor: themeColors.bgPrimary }]} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 220 }}
    >
      {/* Ambient Glow Orbs for Profile Depth */}
      <View style={{ position: 'absolute', top: 100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(168, 85, 247, 0.12)', transform: [{ scale: 1.5 }], pointerEvents: 'none', zIndex: 0 }} />
      <View style={{ position: 'absolute', top: 500, right: -150, width: 400, height: 400, borderRadius: 200, backgroundColor: 'rgba(192, 38, 211, 0.1)', transform: [{ scale: 1.2 }], pointerEvents: 'none', zIndex: 0 }} />
      {/* High-Fidelity Ambient Halo */}
      <View style={{ position: 'absolute', top: 110, alignSelf: 'center', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(168, 85, 247, 0.1)', shadowColor: '#a855f7', shadowOpacity: 1, shadowRadius: 40, elevation: 25, zIndex: 0 }} />
      <View style={{ position: 'absolute', top: 130, alignSelf: 'center', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(192, 38, 211, 0.15)', shadowColor: '#c026d3', shadowOpacity: 0.8, shadowRadius: 20, elevation: 15, zIndex: 0 }} />

      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=800&auto=format&fit=crop' }}
        style={styles.coverImage}
      >
        <View style={styles.coverOverlay} />
        <LinearGradient 
          colors={['transparent', 'rgba(14, 1, 24, 0.4)', 'rgba(14, 1, 24, 0.8)', themeColors.bgPrimary]} 
          style={{ 
            height: 160, 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0 
          }} 
        />
      </ImageBackground>

      <View style={[styles.profileSection, { backgroundColor: 'transparent', marginTop: -50 }]}>
        <View style={[styles.avatarContainer, { 
          borderColor: borderColors.white.medium,
          backgroundColor: themeColors.bgPrimary,
          zIndex: 1,
          ...shadow.lg
        }]}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <LinearGradient
              colors={['#7c3aed', '#a855f7']}
              style={[styles.avatar, { justifyContent: 'center', alignItems: 'center' }]}
            >
              <Ionicons name="person" size={44} color="#FFF" />
            </LinearGradient>
          )}
          <TouchableOpacity 
            activeOpacity={0.8}
            style={[styles.editAvatarBtn, { 
              backgroundColor: themeColors.purple,
              shadowColor: themeColors.purple,
              shadowOpacity: 0.6,
              shadowRadius: 12,
              elevation: 10,
              borderColor: themeColors.bgPrimary 
            }]} 
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="camera" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.name, designTypography.displayMd, { color: themeColors.textPrimary, marginTop: spacing.md }]}>{name}</Text>
        
        <TouchableOpacity 
          activeOpacity={0.7}
          style={[styles.badge, { 
            backgroundColor: 'rgba(168, 85, 247, 0.15)',
            borderWidth: borderWidth.normal,
            borderColor: borderColors.purple.medium,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: borderRadius.lg,
            marginTop: 8
          }]}
        >
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={{
              padding: 3,
              borderRadius: 6,
              marginRight: 8,
              ...glow.icon
            }}
          >
            <Ionicons name="medal" size={12} color="#FFF" />
          </LinearGradient>
          <Text style={[styles.badgeText, { color: themeColors.textPrimary, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }]}>
            {level.title}
          </Text>
        </TouchableOpacity>

        <View style={styles.bentoGrid}>
          <GlassCard variant="purple" style={[styles.bentoLarge, { padding: 20 }]}>
            <View style={styles.bentoHeader}>
              <View style={[styles.bentoIconWrapper, { backgroundColor: 'rgba(168, 85, 247, 0.15)', borderWidth: borderWidth.normal, borderColor: borderColors.purple.light }]}>
                <Ionicons name="restaurant" size={24} color={themeColors.purple} />
              </View>
              <View style={styles.bentoTitleContainer}>
                <Text style={[designTypography.labelSm, { color: themeColors.textSecondary, letterSpacing: 1, marginBottom: 2 }]}>ĐÃ NẤU</Text>
                <Text style={[designTypography.displayMd, { color: themeColors.textPrimary, fontSize: 28 }]}>
                  {stats.cooked} <Text style={[designTypography.body, { color: themeColors.textSecondary }]}>món</Text>
                </Text>
              </View>
            </View>
            <View style={styles.progressContainer}>
              <View style={[styles.progressBarBase, { backgroundColor: 'rgba(255, 255, 255, 0.05)', height: 10 }]}>
                <LinearGradient
                  colors={[themeColors.purple, themeColors.pink]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressBarFill, 
                    { 
                      width: typeof level.next === 'number' ? `${Math.min(100, (stats.cooked / level.next) * 100)}%` : '100%',
                      shadowColor: themeColors.purple,
                      shadowOpacity: 0.5,
                      shadowRadius: 6
                    }
                  ]} 
                />
              </View>
              <Text style={[designTypography.caption, { color: themeColors.textSecondary, marginTop: 8, fontWeight: '500' }]}>
                {typeof level.next === 'number' ? `Cần ${level.next - stats.cooked} món nữa để lên cấp` : 'Đã đạt cấp tối đa!'}
              </Text>
            </View>
          </GlassCard>

          <View style={styles.bentoRow}>
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => tabNavigation.navigate('Favorites')}
              style={{ flex: 1 }}
            >
              <GlassCard variant="pink" style={[styles.bentoSmall, { paddingVertical: 24 }]}>
                <View style={[styles.bentoIconWrapper, { backgroundColor: 'rgba(192, 38, 211, 0.12)', marginBottom: 16 }]}>
                  <Ionicons name="heart" size={24} color={themeColors.pink} />
                </View>
                <Text style={[designTypography.displayMd, { color: themeColors.textPrimary, fontSize: 26, marginBottom: 4 }]}>{stats.favorites}</Text>
                <Text style={[designTypography.label, { color: themeColors.textSecondary, fontSize: 13 }]}>Yêu thích</Text>
              </GlassCard>
            </TouchableOpacity>

            <GlassCard variant="purple" style={[styles.bentoSmall, { paddingVertical: 24 }]}>
              <View style={[styles.bentoIconWrapper, { backgroundColor: 'rgba(168, 85, 247, 0.12)', marginBottom: 16 }]}>
                <Ionicons name="scan" size={24} color={themeColors.purple} />
              </View>
              <Text style={[designTypography.displayMd, { color: themeColors.textPrimary, fontSize: 26, marginBottom: 4 }]}>{stats.scans}</Text>
              <Text style={[designTypography.label, { color: themeColors.textSecondary, fontSize: 13 }]}>Nhận diện</Text>
            </GlassCard>
          </View>
        </View>

        {/* Premium Banner - High Fidelity */}
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => navigation.navigate('ProUpgrade')}
          style={[styles.proBannerWrapper, { 
            marginTop: 32,
            marginBottom: 8,
            ...glow.premium
          }]}
        >
          <LinearGradient
            colors={['#7c3aed', '#c026d3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.proBanner, {
              padding: 24,
              borderRadius: borderRadius['3xl'],
              borderWidth: borderWidth.normal,
              borderColor: borderColors.white.heavy,
              overflow: 'hidden'
            }]}
          >
            {/* Glossy overlay effect */}
            <View style={{ position: 'absolute', top: -100, right: -100, width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            
            <View style={{ flex: 1 }}>
              <View style={{ backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>PHIM CÁCH NHIỆT PRO</Text>
              </View>
              <Text style={[designTypography.h1, { color: '#FFF', fontSize: 22, lineHeight: 28 }]}>Nâng tầm trải nghiệm nấu nướng</Text>
              <Text style={[designTypography.bodySm, { color: 'rgba(255,255,255,0.8)', marginTop: 4 }]}>Mở khóa toàn bộ công thức AI cao cấp</Text>
            </View>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255, 255, 255, 0.25)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', ...shadow.glow }}>
              <Ionicons name="diamond" size={32} color="#FFF" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {menuSections.map((section, idx) => (
          <View key={idx} style={[styles.menuSection, { marginTop: spacing.xl }]}>
            <Text style={[styles.sectionTitle, designTypography.label, { color: 'rgba(180, 150, 220, 0.6)', marginLeft: 8, marginBottom: 12, letterSpacing: 1 }]}>
              {section.title}
            </Text>
            <GlassCard variant="purple" style={styles.menuCard}>
              {section.items.map((item, index) => (
                <View key={index}>
                  <TouchableOpacity 
                    activeOpacity={0.6}
                    style={[styles.menuItem, { 
                      backgroundColor: 'transparent',
                      borderBottomWidth: index < section.items.length - 1 ? borderWidth.thin : 0,
                      borderBottomColor: borderColors.purple.subtle
                    }]}
                    onPress={() => {
                      if (item.route === 'FavoritesTab') {
                        tabNavigation.navigate('Favorites');
                      } else {
                        navigation.navigate(item.route as any);
                      }
                    }}
                  >
                    <View style={styles.menuItemLeft}>
                      <View style={[styles.iconContainer, { backgroundColor: 'rgba(168, 85, 247, 0.2)', borderRadius: borderRadius.md, borderWidth: borderWidth.thin, borderColor: borderColors.purple.normal }]}>
                        <Ionicons name={item.icon as any} size={20} color={item.color} />
                      </View>
                      <Text style={[styles.menuText, designTypography.h3, { color: '#FFF', fontWeight: '500' }]}>{item.text}</Text>
                      {(item as any).badge > 0 && (
                        <View style={{ backgroundColor: '#FF3B30', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginLeft: 8, ...shadow.glow }}>
                          <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '900' }}>{(item as any).badge}</Text>
                        </View>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="rgba(255, 255, 255, 0.4)" />
                  </TouchableOpacity>
                </View>
              ))}
            </GlassCard>
          </View>
        ))}

        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={handleLogout}
          style={[styles.logoutBtn, { 
            backgroundColor: 'rgba(220, 38, 38, 0.12)',
            ...borderPresets.cardRed,
            marginTop: spacing.xl,
            shadowColor: '#dc2626',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 6,
          }]}
        >
          <View style={[styles.logoutIconWrapper, { 
            backgroundColor: 'rgba(255, 107, 107, 0.2)', 
            borderRadius: borderRadius.md,
            borderWidth: borderWidth.normal,
            borderColor: 'rgba(255, 107, 107, 0.3)'
          }]}>
            <Ionicons name="log-out-outline" size={22} color="#ff8787" />
          </View>
          <Text style={[designTypography.h3, { color: '#ff8787', fontWeight: '700', fontSize: 16, letterSpacing: 0.3 }]}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  coverImage: { width: '100%', height: 220 },
  coverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  profileSection: { flex: 1, alignItems: 'center', paddingHorizontal: 20 },
  avatarContainer: {
    width: 120, height: 120, borderRadius: borderRadius.full, borderWidth: borderWidth.ultra,
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  avatar: { width: '100%', height: '100%', borderRadius: borderRadius.full, overflow: 'hidden' },
  editAvatarBtn: {
    position: 'absolute', bottom: 4, right: 4, width: 36, height: 36, borderRadius: borderRadius.full,
    justifyContent: 'center', alignItems: 'center', borderWidth: borderWidth.ultra,
  },
  name: { fontWeight: '800' },
  badge: {},
  badgeText: {},
  bentoGrid: { width: '100%', marginTop: 24, gap: 16 },
  bentoLarge: { width: '100%' },
  bentoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  bentoIconWrapper: { width: 48, height: 48, borderRadius: borderRadius.lg, justifyContent: 'center', alignItems: 'center' },
  bentoTitleContainer: { marginLeft: 16 },
  progressContainer: { width: '100%' },
  progressBarBase: { width: '100%', borderRadius: borderRadius.md, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: borderRadius.md },
  bentoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  bentoSmall: { flex: 1, padding: 20, alignItems: 'center' },
  menuSection: { width: '100%' },
  sectionTitle: { fontWeight: '700' },
  menuCard: { width: '100%' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 42, height: 42, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  menuText: {},
  menuDivider: { height: 1 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18,
    paddingHorizontal: 24, gap: 12, width: '100%', marginBottom: 60,
  },
  logoutIconWrapper: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  proBannerWrapper: { width: '100%' },
  proBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
});
