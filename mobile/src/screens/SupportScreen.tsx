import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Linking, 
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import AlertManager from '../components/CustomAlert';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SupportScreen() {
  const { colors, typography, spacing, borderRadius } = useAppTheme();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    { q: 'Làm sao để quét nguyên liệu?', a: 'Bạn vào tab Camera, hướng điện thoại vào nguyên liệu cần quét và chờ AI nhận diện. Đảm bảo ánh sáng đủ tốt để kết quả chính xác nhất.' },
    { q: 'Tôi có thể chia sẻ công thức không?', a: 'Hiện tại bạn có thể chụp màn hình kết quả. Tính năng chia sẻ trực tiếp qua Facebook/Zalo đang được chúng tôi phát triển.' },
    { q: 'AI dự đoán có chính xác không?', a: 'Hệ thống sử dụng mô hình Google Gemini mới nhất. Độ chính xác rất cao nhưng bạn nên kiểm tra kỹ lại trước khi nấu nhé!' },
    { q: 'Làm sao để xem lại lịch sử?', a: 'Tính năng lịch sử nấu ăn sẽ sớm ra mắt trong bản cập nhật tới. Hãy chú ý thông báo của ứng dụng!' },
    { q: 'Ứng dụng có tốn phí không?', a: 'Smart Cooking AI hoàn toàn miễn phí cho các tính năng cơ bản. Một số tính năng cao cấp có thể sẽ cần đăng ký gói Pro.' },
  ];

  const filteredFaqs = faqs.filter(f => 
    f.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFaq = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleCall = () => {
    AlertManager.alert(
      'Gọi Hotline',
      'Bạn muốn gọi điện cho bộ phận CSKH (19001234)?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Gọi', onPress: () => Linking.openURL('tel:19001234') }
      ]
    );
  };
  
  const handleChat = () => {
    AlertManager.alert(
      'Chat Zalo',
      'Mở Zalo để trò chuyện với tư vấn viên?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Mở Zalo', onPress: () => Linking.openURL('https://zalo.me/yourid') }
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      
      {/* Header & Contact Buttons */}
      <View style={[styles.headerSection, { padding: spacing.lg }]}>
        <View style={[styles.contactCard, { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.xl }]}>
          <Ionicons name="headset" size={40} color={colors.primary} style={{ marginBottom: spacing.md }} />
          <Text style={[typography.h2, { color: colors.text, marginBottom: spacing.xs }]}>Bạn gặp vấn đề?</Text>
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl }]}>
            Chúng tôi luôn sẵn sàng hỗ trợ bạn qua các kênh trực tiếp dưới đây.
          </Text>
          
          <View style={styles.actionRow}>
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={handleCall}
              style={[styles.actionBtn, { backgroundColor: colors.primary, borderRadius: borderRadius.md }]}
            >
              <Ionicons name="call" size={20} color="#FFF" />
              <Text style={styles.actionBtnText}>Gọi Hotline</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={handleChat}
              style={[styles.actionBtn, { backgroundColor: '#0068FF', borderRadius: borderRadius.md }]}
            >
              <Ionicons name="chatbubble-ellipses" size={20} color="#FFF" />
              <Text style={styles.actionBtnText}>Chat Zalo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* FAQ Section */}
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Text style={[typography.h2, { color: colors.text, marginBottom: spacing.md }]}>Câu hỏi thường gặp</Text>
        
        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderRadius: borderRadius.md, marginBottom: spacing.lg, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput 
            placeholder="Tìm kiếm vấn đề của bạn..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, { color: colors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {filteredFaqs.map((faq, idx) => {
          const isExpanded = expandedIndex === idx;
          return (
            <TouchableOpacity 
              key={idx} 
              activeOpacity={0.7}
              onPress={() => toggleFaq(idx)}
              style={[
                styles.faqItem, 
                { backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, borderColor: colors.border },
                isExpanded && [styles.faqExpanded, { borderColor: colors.border }]
              ]}
            >
              <View style={styles.faqHeader}>
                <Text style={[styles.faqQuestion, { color: colors.text }]}>{faq.q}</Text>
                <Ionicons 
                  name={isExpanded ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </View>
              {isExpanded && (
                <View style={styles.faqContent}>
                  <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 12 }]} />
                  <Text style={[typography.body, { color: colors.textSecondary, lineHeight: 22 }]}>
                    {faq.a}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {filteredFaqs.length === 0 && (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary }}>Không tìm thấy câu hỏi phù hợp.</Text>
          </View>
        )}
      </View>
      
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
  },
  contactCard: {
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
  },
  faqItem: {
    borderWidth: 1,
  },
  faqExpanded: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    paddingRight: 10,
  },
  faqContent: {
  },
  divider: {
    height: 1,
    width: '100%',
  }
});
