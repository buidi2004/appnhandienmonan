import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import API_CONFIG from '../config/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { AppBackground } from '../components/ui/AppBackground';
import { GlassCard } from '../components/ui/GlassCard';

export default function NutritionStatsScreen({ navigation }: any) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/nutrition/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderBar = (value: number, label: string, index: number) => {
    const maxVal = Math.max(...(stats?.calories || [1]));
    const height = (value / maxVal) * 120;

    return (
      <View key={index} style={styles.barWrapper}>
        <View style={styles.barContainer}>
          <LinearGradient
            colors={['#7C4DFF', '#FF6584']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.bar, { height: height, borderRadius: 8 }]}
          />
        </View>
        <Text style={styles.barLabel}>{label}</Text>
      </View>
    );
  };

  if (loading) return (
    <AppBackground>
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#7C4DFF" />
      </View>
    </AppBackground>
  );

  return (
    <AppBackground>
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={styles.backBtnWrapper}>
          <GlassCard variant="default" style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </GlassCard>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dinh dưỡng tuần qua</Text>
        <View style={{ width: 52 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}>
        <GlassCard variant="default" style={styles.chartCard}>
          <Text style={styles.chartTitle}>Lượng Calo 7 ngày qua</Text>
          <View style={styles.chartContainer}>
            {stats.calories.map((val: number, i: number) => renderBar(val, stats.labels[i], i))}
          </View>
          <View style={styles.avgBox}>
            <Text style={styles.avgLabel}>Trung bình hàng ngày</Text>
            <Text style={styles.avgValue}>2,050 <Text style={styles.avgUnit}>kcal</Text></Text>
          </View>
        </GlassCard>

        <View style={styles.macroRow}>
          <MacroCard label="Protein" value={stats.macros.protein} color="#FF6584" icon="fitness" />
          <MacroCard label="Carbs" value={stats.macros.carbs} color="#7C4DFF" icon="restaurant" />
          <MacroCard label="Fat" value={stats.macros.fat} color="#FF9500" icon="water" />
        </View>

        <GlassCard variant="default" style={styles.insightCard}>
          <View style={styles.insightIconWrapper}>
            <Ionicons name="analytics-outline" size={24} color="#43E97B" />
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.insightTitle}>Bạn đang đi đúng hướng!</Text>
            <Text style={styles.insightDesc}>
              Lượng Protein của bạn đã tăng 15% so với tuần trước. Hãy tiếp tục duy trì nhé!
            </Text>
          </View>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
    </AppBackground>
  );
}

function MacroCard({ label, value, color, icon }: any) {
  return (
    <GlassCard variant="default" style={styles.macroCard}>
      <View style={[styles.macroIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.macroValue}>{value}%</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 80, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, marginBottom: 10 },
  headerTitle: { color: '#FFFFFF', flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  backBtnWrapper: { zIndex: 10 },
  backBtn: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  chartCard: { padding: 28, marginBottom: 28, borderRadius: 32 },
  chartTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginBottom: 28, letterSpacing: -0.5 },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 160, paddingBottom: 10 },
  barWrapper: { alignItems: 'center', flex: 1 },
  barContainer: { height: 120, justifyContent: 'flex-end', width: 24 },
  bar: { width: '100%' },
  barLabel: { fontSize: 11, marginTop: 14, fontWeight: '900', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' },
  avgBox: { marginTop: 28, paddingTop: 24, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  avgLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  avgValue: { color: '#7C4DFF', fontSize: 40, fontWeight: '900', marginTop: 4, letterSpacing: -1 },
  avgUnit: { fontSize: 18, fontWeight: '700', color: 'rgba(255,255,255,0.4)' },
  macroRow: { flexDirection: 'row', gap: 14, marginBottom: 28 },
  macroCard: { flex: 1, padding: 20, alignItems: 'center', borderRadius: 24 },
  macroIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  macroValue: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  macroLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginTop: 4 },
  insightCard: { flexDirection: 'row', alignItems: 'center', padding: 24, marginBottom: 40, borderRadius: 32 },
  insightIconWrapper: { width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(67, 233, 123, 0.1)', justifyContent: 'center', alignItems: 'center' },
  insightTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  insightDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 6, lineHeight: 22, fontWeight: '600' },
});
