import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import API_CONFIG from '../config/apiConfig';
import { auth } from '../config/firebaseConfig';
import AlertManager from '../components/CustomAlert';
import EmptyState from '../components/EmptyState';
import { AppBackground } from '../components/ui/AppBackground';
import { GlassCard } from '../components/ui/GlassCard';
import { shadow } from '../theme/shadow';
import { themeColors } from '../theme';

interface Post {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  image: string;
  caption: string;
  dishName: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  isLiked: boolean;
  isBookmarked?: boolean;
}

interface Comment {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  text: string;
  likes_count?: number;
  isLiked?: boolean;
  created_at: string;
}

type Props = NativeStackScreenProps<RootStackParamList, 'CommunityPostDetail'>;

export default function CommunityPostDetailScreen({ route, navigation }: Props) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();
  const { postId } = route.params;
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);

  const fetchPost = async () => {
    const user = auth.currentUser;
    const token = await user?.getIdToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await axios.get(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMUNITY_POSTS}/${postId}`,
      { headers }
    );
    setPost(response.data);
  };

  const fetchComments = async () => {
    const user = auth.currentUser;
    const token = await user?.getIdToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await axios.get(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMUNITY_POSTS}/${postId}/comments`,
      { headers }
    );
    setComments(response.data || []);
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([fetchPost(), fetchComments()]);
    } catch (e: any) {
      console.error('Load community detail error:', e);
      setError('Không thể tải bài viết. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [postId])
  );

  const toggleLikePost = async () => {
    if (!post) return;
    const user = auth.currentUser;
    if (!user) {
      navigation.navigate('Auth');
      return;
    }

    setPost({
      ...post,
      isLiked: !post.isLiked,
      likes_count: post.isLiked ? post.likes_count - 1 : post.likes_count + 1
    });

    try {
      const token = await user.getIdToken();
      await axios.post(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMUNITY_POSTS}/${postId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (e) {
      loadAll();
    }
  };

  const toggleBookmarkPost = async () => {
    if (!post) return;
    const user = auth.currentUser;
    if (!user) {
      navigation.navigate('Auth');
      return;
    }

    setPost({ ...post, isBookmarked: !post.isBookmarked });
    try {
      const token = await user.getIdToken();
      await axios.post(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMUNITY_POSTS}/${postId}/bookmark`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (e) {
      loadAll();
    }
  };

  const toggleLikeComment = async (commentId: string) => {
    const user = auth.currentUser;
    if (!user) {
      navigation.navigate('Auth');
      return;
    }

    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        const nextLiked = !c.isLiked;
        const nextCount = (c.likes_count || 0) + (nextLiked ? 1 : -1);
        return { ...c, isLiked: nextLiked, likes_count: Math.max(nextCount, 0) };
      })
    );

    try {
      const token = await user.getIdToken();
      await axios.post(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMUNITY_POSTS}/${postId}/comments/${commentId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (e) {
      fetchComments();
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    const user = auth.currentUser;
    if (!user) {
      navigation.navigate('Auth');
      return;
    }

    try {
      setSending(true);
      const token = await user.getIdToken();
      const payload = {
        text: commentText.trim(),
        user_name: user.displayName || user.email?.split('@')[0] || 'Bạn',
        user_avatar: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`
      };
      await axios.post(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMUNITY_POSTS}/${postId}/comments`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCommentText('');
      fetchComments();
      fetchPost();
    } catch (e: any) {
      AlertManager.alert('Lỗi', 'Không thể gửi bình luận.');
    } finally {
      setSending(false);
    }
  };

  const handleEditPost = () => {
    if (!post) return;
    navigation.navigate('CommunityEditPost', { postId, post });
  };

  const handleDeletePost = () => {
    AlertManager.alert('Xóa bài viết', 'Bạn có chắc chắn muốn xóa bài viết này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await auth.currentUser?.getIdToken();

            await axios.delete(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COMMUNITY_POSTS}/${postId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            navigation.goBack();
          } catch (e) {
            AlertManager.alert('Lỗi', 'Không thể xóa bài viết.');
          }
        }
      }
    ]);
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <GlassCard variant="default" style={styles.commentRow}> 
      <Image source={{ uri: item.user_avatar }} style={styles.commentAvatar} />
      <View style={{ flex: 1 }}>
        <Text style={[typography.body, { color: themeColors.textPrimary, fontWeight: '600' }]}>{item.user_name}</Text>
        <Text style={[typography.caption, { color: themeColors.textSecondary, marginTop: 4 }]}>{item.text}</Text>
        <View style={styles.commentMeta}>
          <TouchableOpacity onPress={() => toggleLikeComment(item.id)} style={styles.commentLikeBtn}>
            <Ionicons name={item.isLiked ? 'heart' : 'heart-outline'} size={16} color={item.isLiked ? '#FF3B30' : themeColors.textSecondary} />
            <Text style={[typography.caption, { color: themeColors.textSecondary, marginLeft: 6 }]}>{item.likes_count || 0}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GlassCard>
  );

  if (error || !post) {
    return (
      <AppBackground>
        <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}> 
          <EmptyState
            icon="alert-circle-outline"
            title="Không thể tải bài viết"
            description={error || 'Vui lòng thử lại sau.'}
            buttonText="Thử lại"
            onPress={loadAll}
          />
        </SafeAreaView>
      </AppBackground>
    );
  }

  const isOwner = auth.currentUser?.uid === post.user_id;

  return (
    <AppBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}> 
        <View style={styles.header}> 
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={styles.backBtnWrapper}>
            <GlassCard variant="default" style={styles.backBtn}>
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </GlassCard>
          </TouchableOpacity>
          <Text style={[{ color: '#FFFFFF', flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold' }]}>Chi tiết</Text>
          <View style={styles.headerActions}>
            {isOwner && (
              <TouchableOpacity activeOpacity={0.7} onPress={handleEditPost}>
                <GlassCard variant="default" style={styles.headerBtn}>
                  <Ionicons name="create-outline" size={20} color="#FFFFFF" />
                </GlassCard>
              </TouchableOpacity>
            )}
            {isOwner && (
              <TouchableOpacity activeOpacity={0.7} onPress={handleDeletePost}>
                <GlassCard variant="default" style={styles.headerBtn}>
                  <Ionicons name="trash-outline" size={20} color="#FF4757" />
                </GlassCard>
              </TouchableOpacity>
            )}
            {!isOwner && <View style={{ width: 44 }} />}
          </View>
        </View>

        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <GlassCard variant="default" style={styles.commentRow}> 
              <Image source={{ uri: item.user_avatar }} style={styles.commentAvatar} />
              <View style={{ flex: 1 }}>
                <Text style={[{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }]}>{item.user_name}</Text>
                <Text style={[{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4, lineHeight: 18 }]}>{item.text}</Text>
                <View style={styles.commentMeta}>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => toggleLikeComment(item.id)} style={styles.commentLikeBtn}>
                    <Ionicons name={item.isLiked ? 'heart' : 'heart-outline'} size={16} color={item.isLiked ? '#FF4757' : 'rgba(255,255,255,0.4)'} />
                    <Text style={[{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginLeft: 6 }]}>{item.likes_count || 0}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </GlassCard>
          )}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
          ListHeaderComponent={
            <GlassCard variant="default" style={styles.postCard}> 
              <View style={styles.postHeader}>
                <Image source={{ uri: post.user_avatar }} style={styles.avatar} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }]}>{post.user_name}</Text>
                  <Text style={[{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }]}>{new Date(post.created_at).toLocaleString('vi-VN')}</Text>
                </View>
                <TouchableOpacity activeOpacity={0.7} onPress={toggleBookmarkPost}>
                  <Ionicons name={post.isBookmarked ? 'bookmark' : 'bookmark-outline'} size={22} color={post.isBookmarked ? '#7C4DFF' : 'rgba(255,255,255,0.4)'} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.caption, { color: '#FFFFFF' }]}>{post.caption}</Text>
              <Image source={{ uri: post.image }} style={styles.postImage} />

              <View style={styles.postActions}>
                <TouchableOpacity activeOpacity={0.7} onPress={toggleLikePost} style={styles.actionBtn}>
                  <Ionicons name={post.isLiked ? 'heart' : 'heart-outline'} size={24} color={post.isLiked ? '#FF4757' : '#FFFFFF'} />
                  <Text style={[{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginLeft: 8 }]}>{post.likes_count}</Text>
                </TouchableOpacity>
                <View style={styles.actionBtn}>
                  <Ionicons name="chatbubble-outline" size={22} color="#FFFFFF" />
                  <Text style={[{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginLeft: 8 }]}>{post.comments_count}</Text>
                </View>
              </View>
            </GlassCard>
          }
          ListEmptyComponent={
            <EmptyState
              icon="chatbubble-ellipses-outline"
              title="Chưa có bình luận"
              description="Hãy là người đầu tiên chia sẻ cảm nhận của bạn."
              buttonText="Viết bình luận"
              onPress={() => {}}
            />
          }
        />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <GlassCard variant="input" style={styles.commentInputRow}> 
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Viết bình luận..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={[styles.commentInput, { color: '#FFFFFF' }]}
            />
            <TouchableOpacity activeOpacity={0.7} onPress={handleSendComment} disabled={sending} style={styles.sendBtn}>
              {sending ? (
                <ActivityIndicator size="small" color="#7C4DFF" />
              ) : (
                <Ionicons name="send" size={20} color="#7C4DFF" />
              )}
            </TouchableOpacity>
          </GlassCard>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    height: 60, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16,
  },
  backBtnWrapper: { marginRight: 0 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 6 },
  postCard: { padding: 16, marginBottom: 20 },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  caption: { marginBottom: 12, fontSize: 14, lineHeight: 20 },
  postImage: { width: '100%', height: 260, borderRadius: 16, backgroundColor: 'rgba(30, 10, 60, 0.8)' },
  postActions: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, marginBottom: 12 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  commentMeta: { marginTop: 8, flexDirection: 'row', alignItems: 'center' },
  commentLikeBtn: { flexDirection: 'row', alignItems: 'center' },
  commentInputRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 4,
    marginHorizontal: 16,
    marginBottom: 30,
  },
  commentInput: { flex: 1, fontSize: 14 },
  sendBtn: { padding: 8 }
});
