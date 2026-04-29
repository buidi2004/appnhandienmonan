import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

const initialNotifications = [
  { id: '1', title: 'Công thức mới cho bạn!', body: 'Khám phá cách làm Bún đậu mắm tôm chuẩn vị.', time: '2 giờ trước', type: 'recipe', unread: true },
  { id: '2', title: 'Ưu đãi Premium', body: 'Giảm giá 50% khi nâng cấp gói Pro ngay hôm nay.', time: '5 giờ trước', type: 'promo', unread: true },
  { id: '3', title: 'Nguyên liệu sạch', body: 'Hệ thống AI vừa cập nhật thêm 100 loại rau củ mới.', time: 'Hôm qua', type: 'system', unread: false },
  { id: '4', title: 'Gợi ý bữa tối', body: 'Trời Cao Lãnh đang se lạnh, làm nồi lẩu Thái nhé!', time: 'Hôm qua', type: 'recipe', unread: false },
];

export default function NotificationsScreen({ navigation }: Props) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();
  const [notifications, setNotifications] = useState(initialNotifications);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      activeOpacity={0.7}
      style={[
        styles.notificationItem, 
        { 
          backgroundColor: item.unread ? '#FFF4E6' : colors.card, 
          borderRadius: borderRadius.lg, 
          marginBottom: spacing.sm,
          borderWidth: item.unread ? 1 : 0,
          borderColor: '#FFD1A4'
        }
      ]}
      onPress={() => {
        setNotifications(notifications.map(n => n.id === item.id ? { ...n, unread: false } : n));
      }}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.type === 'recipe' ? '#FF950020' : '#007AFF20' }]}>
        <Ionicons 
          name={item.type === 'recipe' ? 'restaurant' : 'notifications'} 
          size={20} 
          color={item.type === 'recipe' ? '#FF9500' : '#007AFF'} 
        />
      </View>
      <View style={styles.content}>
        <Text style={[typography.body, { color: item.unread ? colors.text : colors.textSecondary, fontWeight: item.unread ? 'bold' : '500' }]}>
          {item.title}
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary, fontSize: 10, marginTop: 6, fontWeight: 'bold' }]}>
          {item.time}
        </Text>
      </View>
      {item.unread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const sections = [
    { title: 'MỚI NHẤT', data: notifications.filter(n => n.time.includes('giờ')) },
    { title: 'TRƯỚC ĐÓ', data: notifications.filter(n => !n.time.includes('giờ')) },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[typography.h1, { color: colors.text }]}>Thông báo</Text>
        <TouchableOpacity onPress={markAllAsRead}>
          <Text style={[typography.body, { color: colors.primary, fontWeight: 'bold' }]}>Đọc tất cả</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg }}>
        {sections.map((section, idx) => section.data.length > 0 && (
          <View key={idx} style={{ marginBottom: spacing.xl }}>
            <Text style={[styles.sectionTitle, typography.caption, { color: colors.textSecondary }]}>
              {section.title}
            </Text>
            {section.data.map(item => (
              <React.Fragment key={item.id}>
                {renderItem({ item })}
              </React.Fragment>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    position: 'absolute',
    top: 16,
    right: 16,
  },
});
