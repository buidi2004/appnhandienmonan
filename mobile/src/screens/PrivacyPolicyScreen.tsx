import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { AppBackground } from '../components/ui/AppBackground';
import { GlassCard } from '../components/ui/GlassCard';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacyPolicy'>;

export default function PrivacyPolicyScreen({ navigation }: Props) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();

  return (
    <AppBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
      <View style={[styles.header, { borderBottomColor: 'rgba(255,255,255,0.10)' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <GlassCard variant="default" style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </GlassCard>
        </TouchableOpacity>
        <Text style={[typography.h2, { color: '#FFFFFF' }]}>Chính sách Bảo mật</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <GlassCard variant="default" style={styles.contentCard}>
        <Text style={[styles.lastUpdated, { color: 'rgba(255,255,255,0.65)' }]}>Cập nhật lần cuối: 10/05/2026</Text>

        <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>1. Giới thiệu</Text>
        <Text style={[styles.text, { color: 'rgba(255,255,255,0.65)' }]}>
          Smart Cooking AI tôn trọng quyền riêng tư của bạn. Chính sách này mô tả cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn khi sử dụng dịch vụ của chúng tôi.
        </Text>

        <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>2. Dữ liệu chúng tôi thu thập</Text>
        <Text style={[styles.text, { color: 'rgba(255,255,255,0.65)' }]}>
          - **Hình ảnh**: Khi bạn sử dụng tính năng nhận diện, hình ảnh sẽ được gửi đến Google Gemini AI để xử lý. Chúng tôi KHÔNG lưu trữ vĩnh viễn hình ảnh này trên máy chủ của mình.
          {"\n"}- **Thông tin tài khoản**: Email, tên hiển thị khi bạn đăng ký.
          {"\n"}- **Dữ liệu dinh dưỡng**: Các thông tin bạn nhập vào nhật ký dinh dưỡng và hồ sơ sức khỏe.
        </Text>

        <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>3. Cách chúng tôi sử dụng dữ liệu</Text>
        <Text style={[styles.text, { color: 'rgba(255,255,255,0.65)' }]}>
          - Để cung cấp các gợi ý nấu ăn chính xác dựa trên nguyên liệu bạn có.
          - Để cá nhân hóa các cảnh báo sức khỏe và dinh dưỡng.
          - Để cải thiện hiệu suất và tính năng của ứng dụng.
        </Text>

        <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>4. Quyền của bạn</Text>
        <Text style={[styles.text, { color: 'rgba(255,255,255,0.65)' }]}>
          Bạn có quyền:
          {"\n"}- Truy cập và chỉnh sửa thông tin cá nhân.
          {"\n"}- Yêu cầu xóa tài khoản và toàn bộ dữ liệu liên quan bất kỳ lúc nào.
          {"\n"}- Từ chối cung cấp quyền camera (tính năng quét AI sẽ không hoạt động).
        </Text>

        <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>5. Bảo mật dữ liệu</Text>
        <Text style={[styles.text, { color: 'rgba(255,255,255,0.65)' }]}>
          Chúng tôi áp dụng các biện pháp mã hóa SSL và bảo vệ dữ liệu theo tiêu chuẩn ngành để đảm bảo thông tin của bạn không bị truy cập trái phép.
        </Text>

        <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>6. Liên hệ</Text>
        <Text style={[styles.text, { color: 'rgba(255,255,255,0.65)', marginBottom: 40 }]}>
          Nếu có bất kỳ câu hỏi nào về chính sách này, vui lòng liên hệ chúng tôi qua email: support@smartcooking.ai
        </Text>
        </GlassCard>
      </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentCard: { padding: 18 },
  lastUpdated: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  text: {
    fontSize: 15,
    lineHeight: 24,
  }
});
