import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import AlertManager from '../components/CustomAlert';
import { LinearGradient } from 'expo-linear-gradient';

type Props = NativeStackScreenProps<RootStackParamList, 'OnlineShopping'>;
const { width } = Dimensions.get('window');

const PARTNERS = [
  { id: 'bach_hoa_xanh', name: 'Bách Hóa Xanh', icon: 'storefront-outline', color: '#00A651', url: 'https://www.bachhoaxanh.com', desc: 'Siêu thị online, giao 2h', tag: 'Phổ biến' },
  { id: 'grab_mart', name: 'GrabMart', icon: 'bicycle-outline', color: '#00B14F', url: 'https://www.grab.com/vn/mart/', desc: 'Đi chợ online, giao 30 phút', tag: 'Nhanh nhất' },
  { id: 'shopee_food', name: 'Shopee Food', icon: 'bag-check-outline', color: '#EE4D2D', url: 'https://shopee.vn', desc: 'Mua sắm & đặt đồ ăn', tag: null },
  { id: 'winmart', name: 'WinMart', icon: 'business-outline', color: '#E31E24', url: 'https://www.winmart.vn', desc: 'Siêu thị tiện lợi', tag: null },
  { id: 'lazada', name: 'Lazada', icon: 'pricetag-outline', color: '#0F136D', url: 'https://www.lazada.vn', desc: 'Mua đồ bếp & nguyên liệu khô', tag: null },
  { id: 'tiki', name: 'Tiki', icon: 'cube-outline', color: '#1A94FF', url: 'https://tiki.vn', desc: 'Giao nhanh, đảm bảo chất lượng', tag: null },
];

const QUICK_CATEGORIES = [
  { icon: 'leaf-outline', label: 'Rau củ', color: '#34C759' },
  { icon: 'nutrition-outline', label: 'Thịt tươi', color: '#FF3B30' },
  { icon: 'fish-outline', label: 'Hải sản', color: '#007AFF' },
  { icon: 'flask-outline', label: 'Gia vị', color: '#FF9500' },
  { icon: 'grid-outline', label: 'Gạo & bột', color: '#AF52DE' },
  { icon: 'egg-outline', label: 'Trứng & sữa', color: '#5856D6' },
];

export default function OnlineShoppingScreen({ navigation }: Props) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();

  const openPartner = (url: string, name: string) => {
    AlertManager.alert(
      `Mở ${name}`,
      `Bạn sẽ được chuyển đến ứng dụng/trang web của ${name} để mua nguyên liệu.`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Tiếp tục', onPress: () => Linking.openURL(url) },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <Text style={[styles.screenTitle, { color: colors.text }]}>Mua nguyên liệu</Text>
        <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
          Chọn đối tác giao hàng và mua nguyên liệu tươi ngon giao tận nhà
        </Text>

        {/* Quick Categories */}
        <View style={styles.categoriesSection}>
          <Text style={[styles.catLabel, { color: colors.textSecondary }]}>Bạn cần mua gì?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            {QUICK_CATEGORIES.map((cat, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.7}
                style={[styles.categoryChip, { backgroundColor: colors.card }]}
                onPress={() => {
                  Linking.openURL(`https://www.google.com/search?q=mua+${cat.label}+online+gần+tôi`);
                }}
              >
                <View style={[styles.catIconBg, { backgroundColor: `${cat.color}12` }]}>
                  <Ionicons name={cat.icon as any} size={20} color={cat.color} />
                </View>
                <Text style={[styles.catName, { color: colors.text }]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Partners */}
        <Text style={[styles.partnersLabel, { color: colors.text }]}>Đối tác giao hàng</Text>
        {PARTNERS.map(partner => (
          <TouchableOpacity
            key={partner.id}
            activeOpacity={0.7}
            style={[styles.partnerCard, { backgroundColor: colors.card }]}
            onPress={() => openPartner(partner.url, partner.name)}
          >
            <View style={[styles.partnerIcon, { backgroundColor: `${partner.color}10` }]}>
              <Ionicons name={partner.icon as any} size={22} color={partner.color} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[styles.partnerName, { color: colors.text }]}>{partner.name}</Text>
                {!!partner.tag && (
                  <View style={[styles.partnerTag, { backgroundColor: `${partner.color}15` }]}>
                    <Text style={[styles.partnerTagText, { color: partner.color }]}>{partner.tag}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.partnerDesc, { color: colors.textSecondary }]}>{partner.desc}</Text>
            </View>
            <View style={[styles.partnerArrow, { backgroundColor: `${colors.border}30` }]}>
              <Ionicons name="arrow-forward" size={14} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        ))}

        {/* Tip */}
        <View style={[styles.tipBox, { backgroundColor: `${colors.primary}08` }]}>
          <Ionicons name="bulb-outline" size={18} color={colors.primary} />
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            Chuẩn bị sẵn danh sách mua sắm trong app trước khi đặt hàng để tiết kiệm thời gian nhé!
          </Text>
        </View>
      </ScrollView>
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
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  screenTitle: { fontSize: 28, fontWeight: '800', marginTop: 16, letterSpacing: -0.5 },
  screenSubtitle: { fontSize: 14, marginTop: 6, marginBottom: 28, lineHeight: 22 },

  // Categories
  categoriesSection: { marginBottom: 28 },
  catLabel: { fontSize: 13, fontWeight: '600', marginBottom: 14, letterSpacing: 0.3, textTransform: 'uppercase' },
  catScroll: { marginHorizontal: -4 },
  categoryChip: {
    alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, borderRadius: 16, marginHorizontal: 4, minWidth: 80,
  },
  catIconBg: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  catName: { fontSize: 12, fontWeight: '600', marginTop: 8 },

  // Partners
  partnersLabel: { fontSize: 20, fontWeight: '800', marginBottom: 16, letterSpacing: -0.3 },
  partnerCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, marginBottom: 10,
  },
  partnerIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  partnerName: { fontSize: 15, fontWeight: '700' },
  partnerDesc: { fontSize: 12, marginTop: 3, lineHeight: 18 },
  partnerTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  partnerTagText: { fontSize: 10, fontWeight: '700' },
  partnerArrow: { 
    width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
  },

  // Tip
  tipBox: { flexDirection: 'row', padding: 16, borderRadius: 16, alignItems: 'flex-start', marginTop: 8 },
  tipText: { flex: 1, fontSize: 13, marginLeft: 12, lineHeight: 20 },
});
