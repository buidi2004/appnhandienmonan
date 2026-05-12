import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import AlertManager from '../components/CustomAlert';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedButton from '../components/AnimatedButton';
import { themeColors, gradients } from '../theme';
import { glass } from '../theme/glass';
import { glow } from '../theme/glow';
import { borderWidth, borderRadius, borderColors, borderPresets } from '../theme/borders';

type Props = NativeStackScreenProps<RootStackParamList, 'ProUpgrade'>;
const { width } = Dimensions.get('window');

const FEATURES = [
  { icon: 'flash-outline', title: 'AI Không giới hạn', free: '3 lần/ngày', pro: 'Không giới hạn' },
  { icon: 'calendar', title: 'Lịch ăn AI tự động', free: false, pro: true },
  { icon: 'analytics', title: 'Thống kê nâng cao', free: false, pro: true },
  { icon: 'cloud-download', title: 'Lưu ngoại tuyến', free: '5 công thức', pro: 'Không giới hạn' },
  { icon: 'people', title: 'Cộng đồng Pro', free: false, pro: true },
  { icon: 'shield-checkmark', title: 'Tư vấn dinh dưỡng', free: false, pro: true },
];

const PLANS = [
  { id: 'monthly', title: 'Hàng tháng', price: '49.000đ', period: '/tháng', badge: null, savings: null },
  { id: 'yearly', title: 'Hàng năm', price: '399.000đ', period: '/năm', badge: 'Phổ biến nhất', savings: 'Chỉ ~33k/tháng', badgeColor: '#34C759' },
  { id: 'lifetime', title: 'Trọn đời', price: '799.000đ', period: 'một lần', badge: 'Giá trị nhất', savings: 'Thanh toán 1 lần duy nhất', badgeColor: '#FF9500' },
];

export default function ProUpgradeScreen({ navigation }: Props) {
  const { colors, typography } = useAppTheme();
  const [selectedPlan, setSelectedPlan] = useState('yearly');

  const handleSubscribe = () => {
    AlertManager.alert(
      'Sắp ra mắt',
      'Tính năng thanh toán sẽ sớm được triển khai. Cảm ơn bạn đã quan tâm!',
      [{ text: 'Đã hiểu' }]
    );
  };

  const renderFeatureValue = (val: string | boolean) => {
    if (typeof val === 'boolean') {
      return val 
        ? <Ionicons name="checkmark-circle" size={18} color="#34C759" />
        : <Ionicons name="close-circle" size={18} color={`${themeColors.textSecondary}40`} />;
    }
    return <Text style={[styles.featureValText, { color: themeColors.textPrimary }]}>{val}</Text>;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bgPrimary }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Dark header */}
        <LinearGradient colors={gradients.bg} style={styles.headerSection}>
          <AnimatedButton activeOpacity={0.7} onPress={() => navigation.goBack()} style={{ ...glass.card, ...styles.closeBtn }}>
            <Ionicons name="close" size={22} color={themeColors.textPrimary} />
          </AnimatedButton>
          
          <View style={styles.diamondRing}>
            <View style={styles.diamondInner}>
              <Ionicons name="diamond" size={32} color="#FFD700" />
            </View>
          </View>
          <Text style={styles.headerTitle}>Smart Cooking</Text>
          <Text style={styles.headerTitleBold}>Pro</Text>
          <Text style={styles.headerDesc}>
            Trải nghiệm nấu ăn thông minh không giới hạn
          </Text>
        </LinearGradient>

        {/* Feature list - clean, no table */}
        <View style={styles.featuresSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>Mọi thứ bạn cần</Text>
          {FEATURES.map((f, i) => (
            <View key={i} style={[styles.featureRow, { borderBottomColor: `${themeColors.borderCard}60` }]}>
              <View style={[styles.featureIconBg, { backgroundColor: `${themeColors.purple}10` }]}>
                <Ionicons name={f.icon as any} size={18} color={themeColors.purple} />
              </View>
              <Text style={[styles.featureName, { color: themeColors.textPrimary }]}>{f.title}</Text>
              <View style={styles.featureValues}>
                <View style={styles.featureVal}>
                  <Text style={[styles.featureValLabel, { color: themeColors.textSecondary }]}>Free</Text>
                  {renderFeatureValue(f.free)}
                </View>
                <View style={[styles.featureVal, styles.featureValPro]}>
                  <Text style={[styles.featureValLabel, { color: themeColors.purple }]}>Pro</Text>
                  {renderFeatureValue(f.pro)}
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Plans */}
        <View style={styles.plansSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>Chọn gói phù hợp</Text>
          {PLANS.map(plan => {
            const isSelected = selectedPlan === plan.id;
            return (
              <AnimatedButton
                key={plan.id}
                activeOpacity={0.8}
                style={[
                  styles.planCard,
                  isSelected ? {
                    backgroundColor: `${themeColors.purple}08`,
                    borderColor: themeColors.purple,
                    borderWidth: 1.5,
                  } : {}
                ]}
                onPress={() => setSelectedPlan(plan.id)}
              >
                {plan.badge ? (
                  <View style={[styles.planBadge, { backgroundColor: plan.badgeColor || themeColors.purple }]}>
                    <Text style={styles.planBadgeText}>{plan.badge}</Text>
                  </View>
                ) : null}
                <View style={styles.planLeft}>
                  <View style={[styles.radio, { borderColor: isSelected ? themeColors.purple : themeColors.borderCard }]}>
                    {isSelected && <View style={[styles.radioFill, { backgroundColor: themeColors.purple }]} />}
                  </View>
                  <View style={{ marginLeft: 14 }}>
                    <Text style={[styles.planTitle, { color: themeColors.textPrimary }]}>{plan.title}</Text>
                    {plan.savings ? <Text style={[styles.planSavings, { color: themeColors.textSecondary }]}>{plan.savings}</Text> : null}
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.planPrice, { color: isSelected ? themeColors.purple : themeColors.textPrimary }]}>{plan.price}</Text>
                  <Text style={[styles.planPeriod, { color: themeColors.textSecondary }]}>{plan.period}</Text>
                </View>
              </AnimatedButton>
            );
          })}
        </View>

        {/* Social proof - minimal */}
        <View style={styles.socialProof}>
          <View style={styles.avatarStack}>
            {['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'].map((c, i) => (
              <View key={i} style={[styles.miniAvatar, { backgroundColor: c, marginLeft: i > 0 ? -8 : 0 }]}>
                <Ionicons name="person" size={12} color="#FFF" />
              </View>
            ))}
          </View>
          <Text style={[styles.socialText, { color: themeColors.textSecondary }]}>
            <Text style={{ color: themeColors.textPrimary, fontWeight: '700' }}>2,847 người</Text> đã nâng cấp trong tháng này
          </Text>
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
          <AnimatedButton activeOpacity={0.85} onPress={handleSubscribe}>
            <LinearGradient
              colors={gradients.button}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ ...glow.button, ...styles.ctaButton }}
            >
              <Text style={styles.ctaText}>Dùng thử miễn phí 7 ngày</Text>
              <Ionicons name="arrow-forward" size={20} color={themeColors.textPrimary} />
            </LinearGradient>
          </AnimatedButton>
          <Text style={[styles.ctaNote, { color: themeColors.textSecondary }]}>
            Hủy bất kỳ lúc nào. Không thu phí trong 7 ngày đầu.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  // Header
  headerSection: { 
    paddingTop: 56, paddingBottom: 44, paddingHorizontal: 24, alignItems: 'center',
    borderBottomLeftRadius: 36, borderBottomRightRadius: 36,
  },
  closeBtn: { 
    position: 'absolute', top: 16, left: 20, zIndex: 10, 
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  diamondRing: { 
    width: 88, height: 88, borderRadius: 44, 
    borderWidth: 2, borderColor: themeColors.purple,
    justifyContent: 'center', alignItems: 'center',
  },
  diamondInner: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: `${themeColors.purple}20`,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { color: themeColors.textSecondary, fontSize: 18, fontWeight: '400', marginTop: 20, letterSpacing: 2 },
  headerTitleBold: { color: themeColors.purple, fontSize: 36, fontWeight: '900', marginTop: -2, letterSpacing: -1 },
  headerDesc: { color: themeColors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 10, lineHeight: 22 },

  // Features
  featuresSection: { paddingHorizontal: 20, marginTop: 28 },
  sectionTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20, letterSpacing: -0.3 },
  featureRow: { 
    paddingVertical: 16, borderBottomWidth: 1,
  },
  featureIconBg: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  featureName: { fontSize: 15, fontWeight: '600', marginBottom: 10 },
  featureValues: { flexDirection: 'row', gap: 12 },
  featureVal: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
  featureValPro: {},
  featureValLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase' },
  featureValText: { fontSize: 12, fontWeight: '600' },

  // Plans
  plansSection: { paddingHorizontal: 20, marginTop: 28 },
  planCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 18, marginBottom: 10, overflow: 'hidden',
    ...borderPresets.card,
  },
  planBadge: {
    position: 'absolute', top: 0, right: 0, 
    paddingHorizontal: 10, paddingVertical: 4, borderBottomLeftRadius: 10,
  },
  planBadgeText: { color: themeColors.textPrimary, fontSize: 10, fontWeight: '700' },
  planLeft: { flexDirection: 'row', alignItems: 'center' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  radioFill: { width: 10, height: 10, borderRadius: 5 },
  planTitle: { fontSize: 16, fontWeight: '700' },
  planSavings: { fontSize: 12, marginTop: 2 },
  planPrice: { fontSize: 20, fontWeight: '800' },
  planPeriod: { fontSize: 11, marginTop: 2 },

  // Social proof
  socialProof: { 
    marginHorizontal: 20, marginTop: 24, padding: 18, 
    flexDirection: 'row', alignItems: 'center', 
    ...borderPresets.card,
  },
  avatarStack: { flexDirection: 'row', marginRight: 14 },
  miniAvatar: { 
    width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: themeColors.textPrimary,
  },
  socialText: { flex: 1, fontSize: 13, lineHeight: 20 },

  // CTA
  ctaSection: { padding: 20, paddingBottom: 44 },
  ctaButton: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 18, borderRadius: borderRadius.xl,
  },
  ctaText: { color: themeColors.textPrimary, fontSize: 17, fontWeight: '700' },
  ctaNote: { fontSize: 12, textAlign: 'center', marginTop: 14, lineHeight: 20 },
});
