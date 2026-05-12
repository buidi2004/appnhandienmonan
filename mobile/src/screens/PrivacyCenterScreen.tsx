import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { AppBackground } from '../components/ui/AppBackground';
import { GlassCard } from '../components/ui/GlassCard';
import { shadow } from '../theme/shadow';

export default function PrivacyCenterScreen({ navigation }: any) {
  const { colors, typography, spacing } = useAppTheme();

  return (
    <AppBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={styles.backBtnWrapper}>
            <GlassCard variant="default" style={styles.backBtn}>
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </GlassCard>
          </TouchableOpacity>
          <Text style={[{ color: '#FFFFFF', flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', marginRight: 56 }]}>Quyền riêng tư</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          <Text style={[{ color: 'rgba(255,255,255,0.65)', marginBottom: 24, lineHeight: 22 }]}>
            Tại Smart Cooking AI, chúng tôi cam kết bảo vệ dữ liệu cá nhân và quyền riêng tư của bạn. Quản lý các cài đặt dưới đây để kiểm soát trải nghiệm của mình.
          </Text>

          <GlassCard variant="default" style={styles.privacySection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark" size={22} color="#43E97B" />
              <Text style={[{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginLeft: 12 }]}>Bảo vệ dữ liệu</Text>
            </View>
            <Text style={styles.sectionDesc}>Mã hóa dữ liệu ảnh chụp nguyên liệu và đồng bộ hóa đám mây an toàn.</Text>
            <TouchableOpacity style={styles.actionRow}>
              <Text style={{ color: '#7C4DFF', fontWeight: 'bold' }}>Quản lý dữ liệu</Text>
              <Ionicons name="chevron-forward" size={16} color="#7C4DFF" />
            </TouchableOpacity>
          </GlassCard>

          <GlassCard variant="default" style={styles.privacySection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="megaphone" size={22} color="#FF6584" />
              <Text style={[{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginLeft: 12 }]}>Quảng cáo & Tiếp thị</Text>
            </View>
            <Text style={styles.sectionDesc}>Cá nhân hóa các gợi ý món ăn và ưu đãi đặc quyền dựa trên sở thích nấu nướng.</Text>
            <TouchableOpacity style={styles.actionRow}>
              <Text style={{ color: '#7C4DFF', fontWeight: 'bold' }}>Tùy chỉnh</Text>
              <Ionicons name="chevron-forward" size={16} color="#7C4DFF" />
            </TouchableOpacity>
          </GlassCard>

          <GlassCard variant="purple" style={styles.privacySection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
              <Text style={[{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginLeft: 12 }]}>Xóa tài khoản</Text>
            </View>
            <Text style={[styles.sectionDesc, { color: 'rgba(255,255,255,0.8)' }]}>Dữ liệu của bạn sẽ bị xóa vĩnh viễn và không thể khôi phục.</Text>
            <TouchableOpacity style={styles.actionRow}>
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', textDecorationLine: 'underline' }}>Yêu cầu xóa dữ liệu</Text>
            </TouchableOpacity>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    height: 60, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16,
  },
  backBtnWrapper: { marginRight: 0 },
  backBtn: { 
    width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
  },
  privacySection: {
    padding: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionDesc: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
