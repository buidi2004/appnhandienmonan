import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  NativeScrollEvent, 
  NativeSyntheticEvent 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themeColors, gradients, glass, glow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Terms'>;

export default function TermsScreen({ navigation }: Props) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();
  const [agreed, setAgreed] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const handleContinue = async () => {
    if (agreed) {
      await AsyncStorage.setItem('hasAcceptedTerms', 'true');
      navigation.replace('Onboarding');
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    if (isCloseToBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bgPrimary }]}>
      {/* Header - Thiết kế phẳng, vắt ngang màn hình với bóng đổ nhạt */}
      <View style={[styles.header, { ...glass.card, backgroundColor: themeColors.bgCard, borderBottomWidth: 1, borderBottomColor: themeColors.borderCard }]}>
        <Text style={[typography.h2, { color: themeColors.textPrimary }]}>Điều khoản & Pháp lý</Text>
        <Text style={[typography.body, { color: themeColors.textSecondary, marginTop: 4, fontSize: 13 }]}>Vui lòng đọc kỹ trước khi sử dụng ứng dụng.</Text>
      </View>

      <ScrollView 
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView} 
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>1. Thu thập và Xử lý dữ liệu</Text>
        <Text style={[styles.sectionText, { color: themeColors.textSecondary }]}>
          Smart Cooking AI cam kết bảo vệ quyền riêng tư của bạn. Hệ thống chỉ sử dụng hình ảnh từ thiết bị của bạn để gửi đến dịch vụ phân tích hình ảnh (Google Gemini AI) nhằm mục đích nhận diện nguyên liệu và gợi ý công thức.
          {"\n\n"}- Hình ảnh không được lưu trữ vĩnh viễn trên máy chủ của chúng tôi.
          {"\n"}- Dữ liệu sinh trắc học và thông tin cá nhân của bạn sẽ được mã hóa theo tiêu chuẩn quốc tế.
        </Text>

        <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>2. Trách nhiệm người dùng</Text>
        <Text style={[styles.sectionText, { color: themeColors.textSecondary }]}>
          Các công thức nấu ăn, định lượng nguyên liệu và thời gian chế biến do AI gợi ý chỉ mang tính chất tham khảo. Bạn tự chịu trách nhiệm về:
          {"\n\n"}- Việc lựa chọn thực phẩm đảm bảo vệ sinh an toàn.
          {"\n"}- Tuân thủ các nguyên tắc y tế và dinh dưỡng cá nhân (như dị ứng, bệnh lý).
        </Text>
        
        <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>3. Miễn trừ trách nhiệm Y tế</Text>
        <Text style={[styles.sectionText, { color: themeColors.textSecondary }]}>
          Ứng dụng này cung cấp thông tin "nguyên trạng". Các cảnh báo y tế do AI tạo ra không thay thế cho lời khuyên của chuyên gia y tế. Vui lòng tham khảo ý kiến bác sĩ nếu bạn có chế độ ăn kiêng đặc biệt.
        </Text>

        <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>4. Sở hữu trí tuệ</Text>
        <Text style={[styles.sectionText, { color: themeColors.textSecondary }]}>
          Toàn bộ thiết kế giao diện, logo, mã nguồn và thuật toán của ứng dụng thuộc bản quyền của đội ngũ phát triển. Mọi hành vi sao chép, dịch ngược hoặc sử dụng trái phép cho mục đích thương mại đều bị nghiêm cấm.
        </Text>

        <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>5. Thay đổi điều khoản</Text>
        <Text style={[styles.sectionText, { color: themeColors.textSecondary, marginBottom: 40 }]}>
          Chúng tôi có quyền sửa đổi các điều khoản này bất kỳ lúc nào. Việc bạn tiếp tục sử dụng ứng dụng đồng nghĩa với việc bạn chấp nhận những sửa đổi đó. Vui lòng kiểm tra trang này thường xuyên.
        </Text>
      </ScrollView>

      {/* Footer - Có border trên rõ ràng và yêu cầu cuộn hết để kích hoạt */}
      <View style={[styles.footer, { ...glass.card, backgroundColor: themeColors.bgCard, padding: 20, borderTopWidth: 1, borderTopColor: themeColors.borderCard }]}>
        <TouchableOpacity 
          style={[styles.checkboxRow, { opacity: hasScrolledToBottom ? 1 : 0.5 }]} 
          onPress={() => hasScrolledToBottom && setAgreed(!agreed)}
          activeOpacity={0.7}
          disabled={!hasScrolledToBottom}
        >
          <View style={[
            styles.checkbox, 
            { 
              borderColor: agreed ? themeColors.purple : themeColors.borderCard, 
              backgroundColor: agreed ? themeColors.purple : 'transparent', 
              borderRadius: 6 
            }
          ]}>
            {agreed && <Ionicons name="checkmark" size={16} color="#FFF" />}
          </View>
          <Text style={[typography.body, { color: hasScrolledToBottom ? themeColors.textPrimary : themeColors.textSecondary, flex: 1, fontSize: 14 }]}>
            {hasScrolledToBottom ? 'Tôi đồng ý với các điều khoản trên' : 'Vui lòng cuộn xuống hết để đồng ý'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.btn, 
            { 
              backgroundColor: (agreed && hasScrolledToBottom) ? themeColors.purple : themeColors.borderCard, 
              borderRadius: 14, 
              marginTop: 16,
              ...(agreed && hasScrolledToBottom ? glow.button : {})
            }
          ]}
          onPress={handleContinue}
          disabled={!agreed || !hasScrolledToBottom}
        >
          <Text style={[typography.h3, { color: (agreed && hasScrolledToBottom) ? '#FFF' : themeColors.textSecondary }]}>Đồng ý và Tiếp tục</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 26,
    marginBottom: 24,
  },
  footer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 10,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btn: {
    paddingVertical: 16,
    alignItems: 'center',
  }
});
