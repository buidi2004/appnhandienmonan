import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import AlertManager from '../components/CustomAlert';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

const initialNotifications = [
  { id: '1', title: 'Công thức mới cho bạn!', body: 'Khám phá cách làm Bún đậu mắm tôm chuẩn vị.', time: '2 giờ trước', type: 'recipe', unread: true },
  { id: '2', title: 'Tính năng mới', body: 'AI giờ đây có thể gợi ý thực đơn dựa trên sức khỏe của bạn.', time: '5 giờ trước', type: 'system', unread: true },
  { id: '3', title: 'Nguyên liệu sạch', body: 'Hệ thống AI vừa cập nhật thêm 100 loại rau củ mới.', time: 'Hôm qua', type: 'system', unread: false },
  { id: '4', title: 'Gợi ý bữa tối', body: 'Trời se lạnh, làm nồi lẩu Thái nhé!', time: 'Hôm qua', type: 'recipe', unread: false },
];

export default function NotificationsScreen({ navigation }: Props) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();
  const [notifications, setNotifications] = useState(initialNotifications);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    if (unreadCount === 0) return;
    AlertManager.alert(
      'Đánh dấu tất cả',
      `Đánh dấu ${unreadCount} thông báo là đã đọc?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đồng ý', onPress: () => setNotifications(notifications.map(n => ({ ...n, unread: false }))) }
      ]
    );
  };

  const clearAll = () => {
    AlertManager.alert(
      'Xóa tất cả',
      'Bạn có chắc chắn muốn xóa toàn bộ thông báo?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: () => setNotifications([]) }
      ]
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const sections = [
    { title: 'MỚI NHẤT', data: notifications.filter(n => n.time.includes('giờ')) },
    { title: 'TRƯỚC ĐÓ', data: notifications.filter(n => !n.time.includes('giờ')) },
  ];

  const getTypeConfig = (type: string) => {
    if (type === 'recipe') return { icon: 'restaurant' as const, color: '#FF9500', bg: '#FF950012' };
    return { icon: 'megaphone' as const, color: '#007AFF', bg: '#007AFF12' };
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        {notifications.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {unreadCount > 0 && (
              <TouchableOpacity activeOpacity={0.7} onPress={markAllAsRead} style={[styles.headerAction, { backgroundColor: colors.card }]}>
                <Ionicons name="checkmark-done" size={18} color={colors.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity activeOpacity={0.7} onPress={clearAll} style={[styles.headerAction, { backgroundColor: colors.card }]}>
              <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Title */}
      <View style={styles.titleRow}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>Thông báo</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {/* Empty State */}
      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: `${colors.primary}08` }]}>
            <Ionicons name="notifications-off-outline" size={48} color={`${colors.textSecondary}40`} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Không có thông báo</Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
            Các gợi ý món ăn và cập nhật mới sẽ xuất hiện tại đây
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {sections.map((section, idx) => section.data.length > 0 && (
            <View key={idx} style={{ marginBottom: 24 }}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                {section.title}
              </Text>
              {section.data.map(item => {
                const config = getTypeConfig(item.type);
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.7}
                    style={[
                      styles.notifCard,
                      { 
                        backgroundColor: item.unread ? `${colors.primary}06` : colors.card,
                        borderLeftWidth: item.unread ? 3 : 0,
                        borderLeftColor: colors.primary,
                      }
                    ]}
                    onPress={() => {
                      setNotifications(notifications.map(n => n.id === item.id ? { ...n, unread: false } : n));
                    }}
                    onLongPress={() => {
                      AlertManager.alert(
                        'Xóa thông báo',
                        `Xóa "${item.title}"?`,
                        [
                          { text: 'Hủy', style: 'cancel' },
                          { text: 'Xóa', style: 'destructive', onPress: () => removeNotification(item.id) }
                        ]
                      );
                    }}
                  >
                    <View style={[styles.notifIcon, { backgroundColor: config.bg }]}>
                      <Ionicons name={config.icon} size={20} color={config.color} />
                    </View>
                    <View style={styles.notifContent}>
                      <Text style={[styles.notifTitle, { color: colors.text, fontWeight: item.unread ? '700' : '500' }]}>
                        {item.title}
                      </Text>
                      <Text style={[styles.notifBody, { color: colors.textSecondary }]} numberOfLines={2}>
                        {item.body}
                      </Text>
                      <Text style={[styles.notifTime, { color: `${colors.textSecondary}80` }]}>
                        {item.time}
                      </Text>
                    </View>
                    {item.unread && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
          <Text style={[styles.footerNote, { color: `${colors.textSecondary}60` }]}>
            Nhấn giữ để xóa thông báo
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4,
  },
  backBtn: { 
    width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
  },
  headerAction: { 
    width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 16, marginBottom: 20 },
  screenTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  unreadBadge: { 
    backgroundColor: '#FF3B30', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginLeft: 12,
  },
  unreadBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 12, marginLeft: 2,
  },
  notifCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 8,
  },
  notifIcon: {
    width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 15 },
  notifBody: { fontSize: 13, marginTop: 3, lineHeight: 19 },
  notifTime: { fontSize: 11, marginTop: 6, fontWeight: '600' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
  
  // Empty state
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  footerNote: { textAlign: 'center', fontSize: 12, marginTop: 8, marginBottom: 20 },
});
