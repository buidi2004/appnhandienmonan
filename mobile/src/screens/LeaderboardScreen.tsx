import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import API_CONFIG from '../config/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppBackground } from '../components/ui/AppBackground';
import { GlassCard } from '../components/ui/GlassCard';
import { shadow } from '../theme/shadow';
import { themeColors, gradients } from '../theme';
import { glass } from '../theme/glass';
import { glow } from '../theme/glow';
import { borderWidth, borderRadius, borderColors, borderPresets } from '../theme/borders';

const { width } = Dimensions.get('window');

export default function LeaderboardScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/user/gamification`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data && data.success && data.data && data.data.leaderboard) {
        setLeaderboard(data.data.leaderboard);
      }
    } catch (e) {
      console.error('Failed to fetch leaderboard', e);
    } finally {
      setLoading(false);
    }
  };

  const renderPodium = () => {
    const top3 = leaderboard.slice(0, 3);
    if (top3.length === 0) return null;

    return (
      <View style={styles.podiumContainer}>
        {/* Rank 2 */}
        {top3[1] && (
          <View style={[styles.podiumItem, { marginTop: 40 }]}>
            <View style={[styles.podiumAvatar, { borderColor: '#C0C0C0' }]}>
              <View style={styles.avatarInner}>
                <Ionicons name="person" size={32} color="#C0C0C0" />
              </View>
              <View style={[styles.rankBadge, { backgroundColor: '#C0C0C0' }]}>
                <Text style={styles.rankBadgeText}>2</Text>
              </View>
            </View>
            <Text style={[styles.podiumName, { color: '#FFFFFF' }]} numberOfLines={1}>{top3[1].name}</Text>
            <Text style={[styles.podiumXP, { color: 'rgba(255,255,255,0.5)' }]}>{top3[1].xp} XP</Text>
          </View>
        )}

        {/* Rank 1 */}
        {top3[0] && (
          <View style={styles.podiumItem}>
            <View style={styles.crownContainer}>
              <Ionicons name="ribbon" size={32} color="#FFD700" />
            </View>
            <View style={[styles.podiumAvatar, { borderColor: '#FFD700', width: 100, height: 100, borderRadius: 50, borderWidth: 4 }]}>
              <View style={[styles.avatarInner, { width: 92, height: 92, borderRadius: 46 }]}>
                <Ionicons name="person" size={44} color="#FFD700" />
              </View>
              <View style={[styles.rankBadge, { backgroundColor: '#FFD700', width: 28, height: 28, borderRadius: 14 }]}>
                <Text style={[styles.rankBadgeText, { fontSize: 14 }]}>1</Text>
              </View>
            </View>
            <Text style={[styles.podiumName, { color: '#FFFFFF', fontWeight: '900', fontSize: 17 }]} numberOfLines={1}>{top3[0].name}</Text>
            <Text style={[styles.podiumXP, { color: '#FFD700', fontWeight: '900' }]}>{top3[0].xp} XP</Text>
          </View>
        )}

        {/* Rank 3 */}
        {top3[2] && (
          <View style={[styles.podiumItem, { marginTop: 60 }]}>
            <View style={[styles.podiumAvatar, { borderColor: '#CD7F32' }]}>
              <View style={styles.avatarInner}>
                <Ionicons name="person" size={28} color="#CD7F32" />
              </View>
              <View style={[styles.rankBadge, { backgroundColor: '#CD7F32' }]}>
                <Text style={styles.rankBadgeText}>3</Text>
              </View>
            </View>
            <Text style={[styles.podiumName, { color: '#FFFFFF' }]} numberOfLines={1}>{top3[2].name}</Text>
            <Text style={[styles.podiumXP, { color: 'rgba(255,255,255,0.5)' }]}>{top3[2].xp} XP</Text>
          </View>
        )}
      </View>
    );
  };



  return (
    <AppBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <LinearGradient
          colors={['rgba(124, 77, 255, 0.4)', 'rgba(0, 0, 0, 0)']}
          style={styles.header}
        >
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={styles.backBtnWrapper}>
            <GlassCard variant="default" style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </GlassCard>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bảng xếp hạng</Text>
          {renderPodium()}
        </LinearGradient>

        {loading ? (
          <ActivityIndicator size="large" color="#7C4DFF" style={{ marginTop: 50 }} />
        ) : (
          <>
            <FlatList
              data={leaderboard}
              renderItem={({ item, index }) => {
                if (index < 3) return null;
                return (
                  <GlassCard variant="default" style={styles.itemContainer}>
                    <View style={styles.rankContainer}>
                      <Text style={styles.rankText}>{index + 1}</Text>
                    </View>
                    
                    <View style={[styles.avatarSmall, { backgroundColor: 'rgba(124, 77, 255, 0.1)' }]}>
                      <Ionicons name="person" size={22} color="#7C4DFF" />
                    </View>

                    <View style={styles.infoContainer}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemLevel}>Cấp {item.level}</Text>
                    </View>

                    <View style={styles.xpContainer}>
                      <Text style={styles.itemXP}>{item.xp}</Text>
                      <Text style={styles.itemXPLabel}>XP</Text>
                    </View>
                  </GlassCard>
                );
              }}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
            
            <View style={styles.footer}>
              <GlassCard variant="purple" style={styles.myRankContainer}>
                <View style={[styles.myRankAvatar, { backgroundColor: '#7C4DFF' }]}>
                  <Text style={styles.myRankValue}>11</Text>
                </View>
                <View style={styles.myRankInfo}>
                  <Text style={styles.myRankTitle}>Thứ hạng của bạn</Text>
                  <Text style={styles.myRankSubtitle}>Sắp vào Top 10 rồi, cố lên!</Text>
                </View>
                <View style={styles.myRankXPContainer}>
                  <Text style={styles.myRankXP}>850</Text>
                  <Text style={styles.myRankXPLabel}>XP</Text>
                </View>
              </GlassCard>
            </View>
          </>
        )}
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24 },
  headerTitle: { color: '#FFFFFF', textAlign: 'center', fontSize: 24, fontWeight: '900', letterSpacing: -1, marginBottom: 20 },
  backBtnWrapper: { position: 'absolute', top: 60, left: 24, zIndex: 10 },
  backBtn: { width: 52, height: 52, borderRadius: borderRadius.lg, justifyContent: 'center', alignItems: 'center' },
  podiumContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', marginTop: 40, paddingHorizontal: 10 },
  podiumItem: { alignItems: 'center', width: width / 3.3 },
  podiumAvatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 4, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: 16 },
  avatarInner: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(30, 10, 60, 0.8)', justifyContent: 'center', alignItems: 'center' },
  crownContainer: { position: 'absolute', top: -36, zIndex: 1 },
  rankBadge: { position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#000' },
  rankBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  podiumName: { fontSize: 15, fontWeight: '900', color: '#FFFFFF', marginBottom: 6, letterSpacing: -0.5 },
  podiumXP: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  listContent: { padding: 24, paddingBottom: 160 },
  itemContainer: { flexDirection: 'row', alignItems: 'center', padding: 20, marginBottom: 16, borderRadius: borderRadius.xl },
  rankContainer: { width: 40, alignItems: 'center' },
  rankText: { color: 'rgba(255,255,255,0.4)', fontSize: 20, fontWeight: '900' },
  avatarSmall: { width: 52, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginHorizontal: 16 },
  infoContainer: { flex: 1 },
  itemName: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', letterSpacing: -0.5 },
  itemLevel: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4, fontWeight: '700' },
  xpContainer: { alignItems: 'flex-end' },
  itemXP: { color: '#7C4DFF', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  itemXPLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: 40 },
  myRankContainer: { flexDirection: 'row', alignItems: 'center', padding: 24, borderRadius: borderRadius.xl },
  myRankAvatar: { width: 52, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  myRankValue: { color: '#FFF', fontWeight: '900', fontSize: 16 },
  myRankInfo: { flex: 1, marginLeft: 20 },
  myRankTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', letterSpacing: -0.5 },
  myRankSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4, fontWeight: '600' },
  myRankXPContainer: { alignItems: 'flex-end' },
  myRankXP: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  myRankXPLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
});
