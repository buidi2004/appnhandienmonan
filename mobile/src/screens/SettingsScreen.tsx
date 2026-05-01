import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, Modal } from 'react-native';
import AlertManager from '../components/CustomAlert';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleDailyNotifications } from '../services/notificationService';
import * as Notifications from 'expo-notifications';

export default function SettingsScreen() {
  const { colors, typography, spacing, borderRadius, isDark, isSystem, language, setManualTheme, setSystemTheme, setLanguage } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const [pushNotif, setPushNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(false);
  const [cacheSize, setCacheSize] = useState('120 MB');
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  React.useEffect(() => {
    const loadSettings = async () => {
      const notifSetting = await AsyncStorage.getItem('notificationsEnabled');
      if (notifSetting !== null) {
        setPushNotif(notifSetting === 'true');
      }
    };
    loadSettings();
  }, []);

  const handleTogglePushNotif = async (val: boolean) => {
    setPushNotif(val);
    await AsyncStorage.setItem('notificationsEnabled', val.toString());
    if (val) {
      await scheduleDailyNotifications();
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  };

  const handleLanguageChange = () => {
    AlertManager.alert('Ngôn ngữ', 'Chọn ngôn ngữ hiển thị', [
      { text: 'Tiếng Việt', onPress: () => setLanguage('vi') },
      { text: 'English', onPress: () => setLanguage('en') },
      { text: 'Hủy', style: 'cancel' }
    ]);
  };

  const currentLanguageLabel = language === 'vi' ? 'Tiếng Việt' : 'English';

  const handleClearCache = () => {
    AlertManager.alert('Xóa bộ nhớ đệm', 'Bạn có chắc chắn muốn xóa toàn bộ dữ liệu tạm thời?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => setCacheSize('0 KB') }
    ]);
  };

  const renderSettingRow = (
    icon: string, 
    title: string, 
    hasSwitch: boolean, 
    value?: any, 
    onValueChange?: (val: any) => void,
    subtitle?: string,
    onPress?: () => void
  ) => (
    <TouchableOpacity 
      disabled={hasSwitch} 
      onPress={onPress}
      style={[
        styles.settingRow, 
        { 
          backgroundColor: colors.card, 
          borderRadius: borderRadius.md, 
          paddingHorizontal: spacing.md, 
          paddingVertical: spacing.md, 
          marginBottom: spacing.sm 
        }
      ]}
    >
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={22} color={colors.primary} />
        <View style={{ marginLeft: spacing.md }}>
          <Text style={[typography.body, { color: colors.text }]}>{title}</Text>
          {subtitle ? <Text style={[typography.caption, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
        </View>
      </View>
      {hasSwitch ? (
        <Switch 
          value={value} 
          onValueChange={onValueChange} 
          trackColor={{ false: colors.border, true: `${colors.primary}80` }}
          thumbColor={value ? colors.primary : '#f4f3f4'}
        />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {value && typeof value === 'string' && <Text style={[typography.body, { color: colors.textSecondary, marginRight: 8 }]}>{value}</Text>}
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={[styles.sectionTitle, typography.h3, { color: colors.textSecondary }]}>THÔNG BÁO</Text>
        {renderSettingRow('notifications-outline', 'Thông báo đẩy', true, pushNotif, handleTogglePushNotif)}
        {renderSettingRow('mail-outline', 'Email thông báo', true, emailNotif, setEmailNotif)}

        <Text style={[styles.sectionTitle, typography.h3, { color: colors.textSecondary }]}>GIAO DIỆN</Text>
        {renderSettingRow('moon-outline', 'Chế độ tối', true, isDark, (val) => setManualTheme(val ? 'dark' : 'light'))}
        {renderSettingRow('phone-portrait-outline', 'Theo hệ thống', true, isSystem, (val) => val ? setSystemTheme() : setManualTheme(isDark ? 'dark' : 'light'))}
        {renderSettingRow('language-outline', 'Ngôn ngữ', false, currentLanguageLabel, undefined, undefined, handleLanguageChange)}

        {/* Nhóm 1: Dữ liệu & Bộ nhớ */}
        <Text style={[styles.sectionTitle, typography.h3, { color: colors.textSecondary }]}>DỮ LIỆU & BỘ NHỚ</Text>
        {renderSettingRow('trash-outline', 'Xóa bộ nhớ đệm', false, cacheSize, undefined, undefined, handleClearCache)}
        {renderSettingRow('cloud-upload-outline', 'Chất lượng tải lên', false, 'Tiết kiệm')}

        {/* Nhóm 2: Ngôn ngữ */}
        <Text style={[styles.sectionTitle, typography.h3, { color: colors.textSecondary }]}>NGÔN NGỮ & KHU VỰC</Text>
        {renderSettingRow('language-outline', 'Ngôn ngữ', false, 'Tiếng Việt')}

        <Text style={[styles.sectionTitle, typography.h3, { color: colors.textSecondary }]}>BẢO MẬT</Text>
        {renderSettingRow('lock-closed-outline', 'Đổi mật khẩu', false, undefined, undefined, undefined, () => navigation.navigate('ForgotPassword'))}
        {renderSettingRow('finger-print-outline', 'Xác thực sinh trắc học', true, true)}

        {/* Nhóm 3: Hỗ trợ & Thông tin */}
        <Text style={[styles.sectionTitle, typography.h3, { color: colors.textSecondary }]}>HỖ TRỢ & THÔNG TIN</Text>
        {renderSettingRow('information-circle-outline', 'Giới thiệu', false, 'Bản 1.0.0', undefined, undefined, () => AlertManager.alert('Smart Cooking AI', 'Ứng dụng hỗ trợ nấu ăn thông minh hàng đầu.\nPhiên bản 1.0.0\n© 2026 SmartCooking Team'))}
        {renderSettingRow('document-text-outline', 'Điều khoản & Chính sách', false, undefined, undefined, undefined, () => navigation.navigate('Terms'))}
        {renderSettingRow('bug-outline', 'Báo lỗi / Gửi phản hồi', false, undefined, undefined, undefined, () => AlertManager.alert('Phản hồi', 'Cảm ơn bạn! Chúng tôi đã ghi nhận yêu cầu hỗ trợ.'))}

        <TouchableOpacity 
          style={[styles.deleteBtn, { marginTop: spacing.xl, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: `${colors.error}10` }]}
          onPress={() => setIsDeleteModalVisible(true)}
        >
          <Text style={[typography.body, { color: colors.error, textAlign: 'center', fontWeight: 'bold' }]}>Xóa tài khoản</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Confirmation Modal for Deletion */}
      <Modal
        visible={isDeleteModalVisible}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderRadius: borderRadius.xl }]}>
            <Ionicons name="warning" size={48} color={colors.error} style={{ marginBottom: spacing.md }} />
            <Text style={[typography.h2, { color: colors.text, textAlign: 'center', marginBottom: spacing.sm }]}>Xác nhận xóa?</Text>
            <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl }]}>
              Bạn có chắc chắn muốn xóa tài khoản? Mọi dữ liệu món ăn đã lưu sẽ bị mất vĩnh viễn.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: colors.border }]} 
                onPress={() => setIsDeleteModalVisible(false)}
              >
                <Text style={[typography.body, { color: colors.text, fontWeight: 'bold' }]}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: colors.error }]} 
                onPress={() => {
                  setIsDeleteModalVisible(false);
                  AlertManager.alert('Đã yêu cầu', 'Tài khoản của bạn sẽ được xóa trong vòng 24h.');
                }}
              >
                <Text style={[typography.body, { color: '#FFF', fontWeight: 'bold' }]}>Đồng ý xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: 8,
    marginTop: 20,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteBtn: {
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    padding: 30,
    width: '100%',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

