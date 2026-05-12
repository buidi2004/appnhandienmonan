import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import API_CONFIG from '../config/apiConfig';
import AlertManager from '../components/CustomAlert';
import { AppBackground } from '../components/ui/AppBackground';
import { GlassCard } from '../components/ui/GlassCard';
import { shadow } from '../theme/shadow';
import { LinearGradient } from 'expo-linear-gradient';

type Props = NativeStackScreenProps<RootStackParamList, 'CommunityEditPost'>;

export default function CommunityEditPostScreen({ route, navigation }: Props) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();
  const { postId, post } = route.params;
  const [caption, setCaption] = useState(post?.caption || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!caption.trim()) return;
    setLoading(true);
    try {
      // Mock update API call
      // In reality: await axios.put(`${API_CONFIG.BASE_URL}/api/community/posts/${postId}`, { caption });
      AlertManager.alert('Thành công', 'Đã cập nhật bài viết.');
      navigation.goBack();
    } catch (e) {
      AlertManager.alert('Lỗi', 'Không thể cập nhật bài viết.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={styles.backBtnWrapper}>
            <GlassCard variant="default" style={styles.backBtn}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </GlassCard>
          </TouchableOpacity>
          <Text style={[{ color: '#FFFFFF', flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold' }]}>Chỉnh sửa</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={handleSave} disabled={loading}>
            <LinearGradient
              colors={['#7C4DFF', '#FF6584']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.saveBtn, { ...shadow.sm }]}
            >
              {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13 }}>Lưu</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          <Text style={[{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', marginBottom: 12, marginLeft: 4 }]}>CHÚ THÍCH</Text>
          <GlassCard variant="input" style={styles.inputWrapper}>
            <TextInput
              multiline
              value={caption}
              onChangeText={setCaption}
              placeholder="Viết gì đó về món ăn của bạn..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              style={[styles.input, { color: '#FFFFFF' }]}
            />
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    height: 60, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  backBtnWrapper: { marginRight: 0 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14 },
  inputWrapper: { padding: 4 },
  input: {
    height: 180,
    padding: 16,
    textAlignVertical: 'top',
    fontSize: 16,
  }
});
