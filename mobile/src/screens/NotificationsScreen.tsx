import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import AlertManager from '../components/CustomAlert';
import { themeColors, gradients, glass, glow } from '../theme';

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
    if (type === 'recipe') return { 
      icon: 'restaurant' as const, 
      color: '#FF9500', 
      bg: '#FF950015',
      label: 'Công thức'
    };
    return { 
      icon: 'sparkles' as const, 
      color: '#007AFF', 
      bg: '#007AFF15',
      label: 'Hệ thống'
    };
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bgPrimary }]}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={[styles.backBtn, { ...glass.card, backgroundColor: themeColors.bgCard }]}>
          <Ionicons name="arrow-back" size={20} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        {notifications.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {unreadCount > 0 && (
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={markAllAsRead} 
                style={[styles.headerAction, { ...glass.card, backgroundColor: `${themeColors.purple}12` }]}
              >
                <Ionicons name="checkmark-done" size={18} color={themeColors.purple} />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={clearAll} 
              style={[styles.headerAction, { ...glass.card, backgroundColor: themeColors.bgCard }]}
            >
              <Ionicons name="trash-outline" size={18} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Title */}
      <View style={styles.titleRow}>
        <Text style={[styles.screenTitle, { color: themeColors.textPrimary }]}>Thông báo</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {/* Empty State */}
      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: `${themeColors.purple}10` }]}>
            <Ionicons name="notifications-off-outline" size={52} color={`${themeColors.textSecondary}50`} />
          </View>
          <Text style={[styles.emptyTitle, { color: themeColors.textPrimary }]}>Chưa có thông báo</Text>
          <Text style={[styles.emptyDesc, { color: themeColors.textSecondary, opacity: 0.8 }]}>
            Các gợi ý món ăn và cập nhật mới{'\n'}sẽ xuất hiện tại đây
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {sections.map((section, idx) => section.data.length > 0 && (
            <View key={idx} style={{ marginBottom: 24 }}>
              <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>
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
                        ...glass.card,
                        backgroundColor: item.unread ? `${themeColors.purple}08` : themeColors.bgCard,
                        borderLeftWidth: item.unread ? 3 : 0,
                        borderLeftColor: themeColors.purple,
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
                      <Ionicons name={config.icon} size={22} color={config.color} />
                    </View>
                    <View style={styles.notifContent}>
                      <View style={styles.notifHeader}>
                        <Text style={[styles.notifTitle, { color: themeColors.textPrimary, fontWeight: item.unread ? '700' : '600' }]}>
                          {item.title}
                        </Text>
                        {item.unread && <View style={[styles.unreadDot, { backgroundColor: themeColors.purple }]} />}
                      </View>
                      <Text style={[styles.notifBody, { color: themeColors.textSecondary, opacity: 0.9 }]} numberOfLines={2}>
                        {item.body}
                      </Text>
                      <View style={styles.notifFooter}>
                        <View style={[styles.typeLabel, { backgroundColor: config.bg }]}>
                          <Ionicons name={config.icon} size={11} color={config.color} />
                          <Text style={[styles.typeLabelText, { color: config.color }]}>{config.label}</Text>
                        </View>
                        <Text style={[styles.notifTime, { color: themeColors.textSecondary, opacity: 0.6 }]}>
                          {item.time}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
          <View style={styles.footerHint}>
            <Ionicons name="information-circle-outline" size={14} color={`${themeColors.textSecondary}50`} />
            <Text style={[styles.footerNote, { color: `${themeColors.textSecondary}70` }]}>
              Nhấn giữ để xóa thông báo
            </Text>
          </View>
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
    flexDirection: 'row', alignItems: 'flex-start', padding: 16, borderRadius: 16, marginBottom: 8,
  },
  notifIcon: {
    width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  notifTitle: { fontSize: 15, flex: 1 },
  notifBody: { fontSize: 14, marginTop: 2, lineHeight: 20 },
  notifFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  typeLabel: { 
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, 
    borderRadius: 8, gap: 4 
  },
  typeLabelText: { fontSize: 11, fontWeight: '600' },
  notifTime: { fontSize: 11, fontWeight: '600' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 6 },
  
  // Empty state
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon: { width: 110, height: 110, borderRadius: 55, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 10 },
  emptyDesc: { fontSize: 15, textAlign: 'center', lineHeight: 24 },
  footerHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, marginBottom: 20 },
  footerNote: { fontSize: 13, fontWeight: '500' },
});
