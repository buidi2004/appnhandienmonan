import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { AppBackground } from '../components/ui/AppBackground';
import { GlassCard } from '../components/ui/GlassCard';
import { shadow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'UserGuide'>;

export default function UserGuideScreen({ navigation }: Props) {
  const { spacing } = useAppTheme();

  const steps = [
    {
      title: 'Bước 1: Chụp ảnh nguyên liệu',
      desc: 'Mở tab Camera, đặt nguyên liệu của bạn trên mặt phẳng và chụp ảnh rõ nét. AI sẽ tự động liệt kê các nguyên liệu có trong ảnh.',
      icon: 'camera',
      color: '#7C4DFF'
    },
    {
      title: 'Bước 2: Chọn món ăn gợi ý',
      desc: 'Dựa trên nguyên liệu đã quét, AI sẽ gợi ý các món ăn Việt Nam thơm ngon. Bạn có thể chọn món phù hợp với sở thích.',
      icon: 'restaurant',
      color: '#43E97B'
    },
    {
      title: 'Bước 3: Nấu ăn theo hướng dẫn',
      desc: 'Ứng dụng cung cấp từng bước nấu chi tiết kèm theo thời gian và mẹo vặt từ đầu bếp chuyên nghiệp.',
      icon: 'list',
      color: '#FF6584'
    },
    {
      title: 'Bước 4: Chia sẻ thành quả',
      desc: 'Sau khi nấu xong, đừng quên chia sẻ món ăn của bạn lên mục Cộng đồng để nhận được sự tương tác từ mọi người.',
      icon: 'people',
      color: '#FF4757'
    }
  ];

  return (
    <AppBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()}>
            <GlassCard variant="default" style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </GlassCard>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hướng dẫn sử dụng</Text>
          <View style={{ width: 52 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.introText}>
            Chào mừng bạn đến với Smart Cooking AI! Hãy theo dõi các bước dưới đây để làm chủ ứng dụng chỉ trong vài phút.
          </Text>

          {steps.map((step, idx) => (
            <GlassCard key={idx} variant="default" style={styles.stepCard}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(30, 10, 60, 0.8)' }]}>
                <Ionicons name={step.icon as any} size={24} color={step.color} />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </GlassCard>
          ))}

          <GlassCard variant="pink" style={styles.tipBox}>
            <View style={styles.tipIconBg}>
              <Ionicons name="bulb" size={20} color="#FF6584" />
            </View>
            <Text style={styles.tipText}>
              <Text style={{ fontWeight: '900', color: '#FF6584' }}>Mẹo: </Text>
              Đảm bảo ánh sáng đủ tốt và chụp nguyên liệu từ trên xuống để AI nhận diện chính xác nhất!
            </Text>
          </GlassCard>
          
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('MainTabs')}
          >
            <LinearGradient
              colors={['#7C4DFF', '#FF6584']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startBtn}
            >
              <Text style={styles.startBtnText}>Bắt đầu nấu ăn ngay</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginTop: 10 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5, flex: 1, textAlign: 'center' },
  backBtn: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 24, paddingBottom: 60 },
  introText: { color: 'rgba(255,255,255,0.4)', marginBottom: 32, lineHeight: 24, fontSize: 15, fontWeight: '600' },
  stepCard: { flexDirection: 'row', padding: 24, marginBottom: 16, alignItems: 'center', borderRadius: 32 },
  iconBox: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  stepContent: { flex: 1, marginLeft: 20 },
  stepTitle: { color: '#FFFFFF', fontWeight: '900', fontSize: 18, marginBottom: 6, letterSpacing: -0.3 },
  stepDesc: { color: 'rgba(255,255,255,0.4)', fontSize: 14, lineHeight: 22, fontWeight: '600' },
  tipBox: { flexDirection: 'row', padding: 24, marginTop: 20, alignItems: 'center', borderRadius: 32 },
  tipIconBg: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255, 101, 132, 0.1)', justifyContent: 'center', alignItems: 'center' },
  tipText: { flex: 1, fontSize: 14, marginLeft: 16, lineHeight: 22, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  startBtn: { height: 64, justifyContent: 'center', alignItems: 'center', borderRadius: 24, marginTop: 40, marginBottom: 20 },
  startBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 },
});
