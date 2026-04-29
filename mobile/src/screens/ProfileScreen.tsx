import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground, Image } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabParamList, RootStackParamList } from '../../App';

type Props = BottomTabScreenProps<TabParamList, 'Profile'>;

export default function ProfileScreen({ navigation: tabNavigation }: Props) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [avatar, setAvatar] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const loadAvatar = async () => {
        try {
          const savedAvatar = await AsyncStorage.getItem('userAvatar');
          if (savedAvatar) setAvatar(savedAvatar);
        } catch (e) {}
      };
      loadAvatar();
    }, [])
  );

  const menuSections = [
    {
      title: 'TÀI KHOẢN',
      items: [
        { icon: 'person-circle', text: 'Chỉnh sửa hồ sơ', color: '#007AFF', route: 'EditProfile' }, 
        { icon: 'time', text: 'Lịch sử quét AI', color: '#FF9500', route: 'Notifications' },           
        { icon: 'restaurant', text: 'Món ăn tự tạo', color: '#34C759', route: 'MainTabs' },          
      ]
    },
    {
      title: 'CÀI ĐẶT & HỖ TRỢ',
      items: [
        { icon: 'settings', text: 'Cài đặt chung', color: '#5856D6', route: 'Settings' },        
        { icon: 'notifications', text: 'Thông báo', color: '#FFCC00', route: 'Notifications' },  
        { icon: 'help-circle', text: 'Trung tâm hỗ trợ', color: '#AF52DE', route: 'Support' },  
      ]
    }
  ];

  const handleLogout = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
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
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop' }} 
              style={styles.avatar} 
            />
          )}
          <TouchableOpacity 
            style={[styles.editAvatarBtn, { backgroundColor: colors.primary, borderColor: colors.background }]} 
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="camera" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.name, typography.h2, { color: colors.text, marginTop: spacing.md }]}>Bùi Văn Dĩ</Text>
        <View style={[styles.badge, { backgroundColor: `${colors.primary}20` }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>ĐẦU BẾP TƯƠNG LAI</Text>
        </View>

        <View style={styles.bentoGrid}>
          {/* Top Block: Đã nấu - Chiếm trọn chiều ngang */}
          <View style={[styles.bentoLarge, { backgroundColor: '#FFF5E6', borderRadius: 28 }]}>
            <View style={styles.bentoHeader}>
              <View style={[styles.bentoIconWrapper, { backgroundColor: '#FF950020' }]}>
                <Ionicons name="restaurant" size={22} color="#FF9500" />
              </View>
              <View style={styles.bentoTitleContainer}>
                <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: 'bold' }]}>ĐÃ NẤU</Text>
                <Text style={[typography.h2, { color: colors.text, fontWeight: 'bold' }]}>12 <Text style={[typography.body, { fontWeight: 'normal', color: colors.textSecondary }]}>món</Text></Text>
              </View>
            </View>
            <View style={styles.progressContainer}>
              <View style={[styles.progressBarBase, { backgroundColor: '#E0E0E0' }]}>
                <View style={[styles.progressBarFill, { backgroundColor: '#FF9500', width: '60%' }]} />
              </View>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>60% mục tiêu tháng này</Text>
            </View>
          </View>

          {/* Bottom Row: 2 ô vuông nhỏ */}
          <View style={styles.bentoRow}>
            <View style={[styles.bentoSmall, { backgroundColor: '#FFF5E6', borderRadius: 24 }]}>
              <View style={[styles.bentoIconWrapper, { backgroundColor: '#FF3B3020', marginBottom: 8 }]}>
                <Ionicons name="heart" size={20} color="#FF3B30" />
              </View>
              <Text style={[typography.h3, { color: colors.text, fontWeight: 'bold' }]}>3</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>Yêu thích</Text>
            </View>

            <View style={[styles.bentoSmall, { backgroundColor: '#FFF5E6', borderRadius: 24 }]}>
              <View style={[styles.bentoIconWrapper, { backgroundColor: '#007AFF20', marginBottom: 8 }]}>
                <Ionicons name="scan" size={20} color="#007AFF" />
              </View>
              <Text style={[typography.h3, { color: colors.text, fontWeight: 'bold' }]}>5</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>Nhận diện</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={[styles.premiumBanner, { backgroundColor: '#1A1A1A', borderRadius: borderRadius.lg }]}>
          <View style={styles.premiumContent}>
            <Ionicons name="star" size={24} color="#FFD700" />
            <View style={styles.premiumText}>
              <Text style={[typography.h3, { color: '#FFD700' }]}>Nâng cấp Pro</Text>
              <Text style={[typography.caption, { color: '#AAAAAA' }]}>Mở khóa toàn bộ công thức bí truyền</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#FFD700" />
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
                    style={styles.menuItem}
                    onPress={() => navigation.navigate(item.route as any)}
                  >
                    <View style={styles.menuItemLeft}>
                      <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                        <Ionicons name={item.icon as any} size={22} color={item.color} />
                      </View>
                      <Text style={[styles.menuText, typography.body, { color: colors.text, fontWeight: '500' }]}>{item.text}</Text>
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
          onPress={handleLogout}
          style={[styles.logoutBtn, { backgroundColor: `${colors.error}10`, borderRadius: borderRadius.lg, marginTop: spacing.xl }]}
        >
          <Ionicons name="log-out-outline" size={24} color={colors.error} />
          <Text style={[typography.h3, { color: colors.error, marginLeft: spacing.sm }]}>Đăng xuất</Text>
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
    backgroundColor: '#E1E1E1',
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
    width: '100%',
    paddingVertical: 16,
  },
});
