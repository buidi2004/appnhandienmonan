import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { AppBackground } from '../components/ui/AppBackground';
import { GlassCard } from '../components/ui/GlassCard';
import { shadow } from '../theme';

export default function SubscriptionManageScreen({ navigation }: any) {
  const { typography, spacing } = useAppTheme();

  return (
    <AppBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={[typography.h2, { color: '#FFFFFF', marginLeft: 16 }]}>Quản lý gói cước</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          <GlassCard variant="default" style={styles.planCard}>
            <Text style={[typography.h3, { color: '#FFFFFF' }]}>Gói hiện tại: MIỄN PHÍ</Text>
            <TouchableOpacity 
              style={[styles.upgradeBtn, { backgroundColor: '#7C4DFF', ...shadow.md }]}
              onPress={() => navigation.navigate('ProUpgrade')}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Nâng cấp lên PRO</Text>
            </TouchableOpacity>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'transparent' },
  backBtn: { padding: 4, backgroundColor: 'transparent' },
  planCard: { padding: 20, marginTop: 10 },
  upgradeBtn: { marginTop: 16, paddingVertical: 12, borderRadius: 14, alignItems: 'center' }
});
