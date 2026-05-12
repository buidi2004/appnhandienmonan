import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppBackground } from '../components/ui/AppBackground';
import { GlassCard } from '../components/ui/GlassCard';
import { shadow } from '../theme/shadow';

const MULTIPLIERS = [0.5, 1, 2, 3];

type Props = NativeStackScreenProps<RootStackParamList, 'RecipeCustomize'>;

type Substitution = { original: string; replacement: string; reason?: string };

type CustomizeParams = {
  dishName: string;
  ingredients: string[];
  steps: string[];
  tips?: string;
  calories?: string;
  substitutions?: Substitution[];
};

function scaleIngredient(text: string, multiplier: number): string {
  if (multiplier === 1) return text;
  return text.replace(/(\d+([.,]\d+)?)\s*(g|kg|ml|lít|thìa|muỗng|chén|bát|cốc|quả|trái|củ|lát|miếng)/gi,
    (match, num) => {
      const scaled = (parseFloat(num.replace(',', '.')) * multiplier).toFixed(1).replace(/\.0$/, '');
      return match.replace(num, scaled);
    }
  );
}

export default function RecipeCustomizeScreen({ route, navigation }: Props) {
  const { dishName, ingredients, steps, tips, calories, substitutions = [] } = route.params as CustomizeParams;
  const [multiplier, setMultiplier] = useState(1);
  const [activeSubs, setActiveSubs] = useState<Record<number, boolean>>({});
  const entryAnim = useRef(new Animated.Value(0)).current;

  const adjustedIngredients = useMemo(() => {
    const applied = ingredients.map((ing) => {
      let result = ing;
      substitutions.forEach((sub, idx) => {
        if (!activeSubs[idx]) return;
        const pattern = new RegExp(sub.original, 'i');
        if (pattern.test(result)) {
          result = result.replace(pattern, sub.replacement);
        }
      });
      return scaleIngredient(result, multiplier);
    });
    return applied;
  }, [ingredients, substitutions, activeSubs, multiplier]);

  const toggleSub = (idx: number) => {
    setActiveSubs(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  useEffect(() => {
    Animated.timing(entryAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, [entryAnim]);

  const handleContinue = () => {
    navigation.navigate('PrepChecklist', {
      steps,
      dishName,
      ingredients: adjustedIngredients,
      tips,
      calories,
    });
  };

  return (
    <AppBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}> 
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()}>
            <GlassCard variant="default" style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </GlassCard>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tùy chỉnh</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={handleContinue}>
            <GlassCard variant="chip" style={styles.skipBtn}>
              <Text style={styles.skipText}>BỎ QUA</Text>
            </GlassCard>
          </TouchableOpacity>
        </View>

        <Animated.View style={{ flex: 1, opacity: entryAnim, transform: [{ translateY: entryAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>{dishName}</Text>
          {!!calories && (
            <GlassCard variant="chip" style={styles.calorieBadge}> 
              <Ionicons name="flame" size={14} color="#FF6584" />
              <Text style={styles.calorieText}>{calories.toUpperCase()}</Text>
            </GlassCard>
          )}

          <GlassCard variant="default" style={styles.section}> 
            <Text style={styles.sectionTitle}>Khẩu phần phù hợp</Text>
            <View style={styles.multiplierRow}>
              {MULTIPLIERS.map((value) => (
                <TouchableOpacity
                  key={value}
                  activeOpacity={0.8}
                  onPress={() => setMultiplier(value)}
                  style={styles.multiplierWrapper}
                >
                  <GlassCard 
                    variant={multiplier === value ? "purple" : "default"} 
                    style={[styles.multiplierChip, multiplier === value && { borderColor: 'rgba(255,255,255,0.3)', borderWidth: 1 }]}
                  >
                    <Text style={[styles.multiplierText, { color: multiplier === value ? '#FFF' : 'rgba(255,255,255,0.4)' }]}>x{value}</Text>
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>

          {substitutions.length > 0 && (
            <GlassCard variant="default" style={styles.section}> 
              <Text style={styles.sectionTitle}>Thay thế thông minh</Text>
              {substitutions.map((sub, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.8}
                  style={styles.subRow}
                  onPress={() => toggleSub(idx)}
                >
                  <Ionicons name={activeSubs[idx] ? 'checkbox' : 'square'} size={24} color={activeSubs[idx] ? '#43E97B' : 'rgba(255,255,255,0.1)'} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subText}>Dùng <Text style={styles.subHighlight}>{sub.replacement}</Text> thay <Text style={{ fontWeight: '900' }}>{sub.original}</Text></Text>
                    {!!sub.reason && <Text style={styles.subReason}>{sub.reason}</Text>}
                  </View>
                </TouchableOpacity>
              ))}
            </GlassCard>
          )}

          <GlassCard variant="default" style={styles.section}> 
            <Text style={styles.sectionTitle}>Nguyên liệu sau khi chỉnh</Text>
            {adjustedIngredients.map((ing, idx) => (
              <View key={idx} style={styles.ingredientRow}>
                <View style={styles.dot} />
                <Text style={styles.ingredientText}>{ing}</Text>
              </View>
            ))}
          </GlassCard>

          {!!tips && (
            <GlassCard variant="purple" style={styles.tipBox}> 
              <Ionicons name="bulb" size={18} color="#7C4DFF" />
              <Text style={styles.tipText}>
                <Text style={styles.tipHighlight}>MẸO NẤU ĂN: </Text>
                {tips}
              </Text>
            </GlassCard>
          )}
          </ScrollView>
        </Animated.View>

        <View style={styles.bottomBar}> 
          <TouchableOpacity activeOpacity={0.85} onPress={handleContinue}>
            <LinearGradient
              colors={['#7C4DFF', '#FF6584']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.primaryBtn, { ...shadow.md }]}
            >
              <Text style={styles.primaryBtnText}>BẮT ĐẦU CHUẨN BỊ</Text>
              <Ionicons name="chevron-forward" size={18} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  backBtn: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 16 },
  headerTitle: { color: '#FFFFFF', flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  skipBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  skipText: { fontSize: 11, fontWeight: '900', letterSpacing: 1, color: '#FFFFFF' },
  scrollContent: { padding: 24, paddingBottom: 140 },
  title: { fontSize: 28, fontWeight: '900', marginBottom: 12, letterSpacing: -1, color: '#FFFFFF' },
  calorieBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 24 },
  calorieText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5, color: '#FFFFFF' },
  section: { padding: 24, marginBottom: 20, borderRadius: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5, marginBottom: 16, color: '#FFFFFF' },
  multiplierRow: { flexDirection: 'row', gap: 12 },
  multiplierWrapper: { flex: 1 },
  multiplierChip: { height: 52, justifyContent: 'center', alignItems: 'center', borderRadius: 16 },
  multiplierText: { fontWeight: '900', fontSize: 14 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  subText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  subHighlight: { color: '#43E97B', fontWeight: '900' },
  subReason: { fontSize: 12, marginTop: 4, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#7C4DFF' },
  ingredientText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  tipBox: { flexDirection: 'row', gap: 14, padding: 24, borderRadius: 28, marginBottom: 100 },
  tipHighlight: { fontWeight: '900', color: '#7C4DFF' },
  tipText: { flex: 1, fontSize: 15, lineHeight: 24, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, height: 64, borderRadius: 20 },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});
