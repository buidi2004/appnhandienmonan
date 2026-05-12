import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  TextInput,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeImage } from '../components/RealImage';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../navigation/types';
import { themeColors, gradients, glass, glow, borderPresets, borderRadius } from '../theme';

type Props = BottomTabScreenProps<TabParamList, 'Community'>;

interface Post {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  image: string;
  caption: string;
  dishName: string;
  likes: number;
  comments: number;
  time: string;
  isLiked: boolean;
}

const MOCK_POSTS: Post[] = [
  {
    id: '1',
    user: { name: 'Thanh Thảo', avatar: 'https://i.pravatar.cc/150?u=thao' },
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop',
    dishName: 'Salad Ức Gà Áp Chảo',
    caption: 'Vừa quét tủ lạnh thấy còn nửa miếng ức gà với ít xà lách, AI gợi ý món này ngon xỉu luôn! 🥗',
    likes: 124,
    comments: 18,
    time: '2 giờ trước',
    isLiked: true,
  },
  {
    id: '2',
    user: { name: 'Minh Tuấn', avatar: 'https://i.pravatar.cc/150?u=tuan' },
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop',
    dishName: 'Bát Poke Thập Cẩm',
    caption: 'Hôm nay ăn uống lành mạnh cùng gia đình. Công thức từ Smart Cooking AI chưa bao giờ làm mình thất vọng.',
    likes: 89,
    comments: 5,
    time: '5 giờ trước',
    isLiked: false,
  },
  {
    id: '3',
    user: { name: 'Hoàng Nam', avatar: 'https://i.pravatar.cc/150?u=nam' },
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7bb7445?q=80&w=800&auto=format&fit=crop',
    dishName: 'Bánh Pancake Chuối',
    caption: 'Bữa sáng nhanh gọn cho mấy bé. AI còn hướng dẫn cả cách làm siro mật ong cực đỉnh. 🥞',
    likes: 256,
    comments: 42,
    time: '1 ngày trước',
    isLiked: false,
  },
];

export default function CommunityScreen({ navigation }: Props) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();
  const [posts, setPosts] = useState(MOCK_POSTS);

  const toggleLike = (id: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 };
      }
      return p;
    }));
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postCard}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={[typography.h3, { color: themeColors.textPrimary }]}>{item.user.name}</Text>
          <Text style={[typography.caption, { color: themeColors.textSecondary }]}>{item.time}</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color={themeColors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <Text style={[typography.body, { color: themeColors.textPrimary, paddingHorizontal: 16, marginBottom: 12 }]}>
        {item.caption}
      </Text>
      
      <TouchableOpacity activeOpacity={0.9}>
        <SafeImage uri={item.image} style={styles.postImage} />
        <View style={styles.dishTag}>
          <Ionicons name="restaurant" size={12} color="#FFF" />
          <Text style={styles.dishTagText}>{item.dishName}</Text>
        </View>
      </TouchableOpacity>

      {/* Post Actions */}
      <View style={styles.postActions}>
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={() => toggleLike(item.id)} style={styles.actionBtn}>
            <Ionicons 
              name={item.isLiked ? "heart" : "heart-outline"} 
              size={24} 
              color={item.isLiked ? themeColors.pink : themeColors.textPrimary} 
            />
            <Text style={[styles.actionText, { color: themeColors.textPrimary }]}>{item.likes}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={22} color={themeColors.textPrimary} />
            <Text style={[styles.actionText, { color: themeColors.textPrimary }]}>{item.comments}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="share-social-outline" size={22} color={themeColors.textPrimary} />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity>
          <Ionicons name="bookmark-outline" size={22} color={themeColors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bgPrimary }]}>
      <View style={[styles.header, { borderBottomColor: themeColors.borderCard }]}>
        <Text style={[typography.h2, { color: themeColors.textPrimary }]}>Cộng đồng</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="search-outline" size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Top Trending Chefs */}
            <View style={[styles.trendingHeader, { backgroundColor: themeColors.bgPrimary }]}>
              <Text style={[typography.caption, { color: themeColors.textSecondary, fontWeight: 'bold', marginLeft: 16, marginBottom: 12 }]}>
                ĐẦU BẾP ĐANG LÊN
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                {[1,2,3,4,5,6].map(i => (
                  <View key={i} style={styles.trendingChef}>
                    <View style={[styles.avatarBorder, { borderColor: themeColors.purple }]}>
                      <Image source={{ uri: `https://i.pravatar.cc/150?u=${i*10}` }} style={styles.avatarTrending} />
                    </View>
                    <Text style={[typography.caption, { color: themeColors.textPrimary, marginTop: 4, fontSize: 10 }]} numberOfLines={1}>
                      User {i}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={styles.createPost}>
              <Image source={{ uri: 'https://i.pravatar.cc/150?u=me' }} style={styles.avatarSmall} />
              <TouchableOpacity style={[styles.postInput, { backgroundColor: 'rgba(30, 10, 60, 0.8)', borderRadius: borderRadius.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }]}>
                <Text style={{ color: themeColors.textSecondary }}>Hôm nay bạn nấu món gì ngon?</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.imageIcon}>
                <Ionicons name="image-outline" size={24} color={themeColors.purple} />
              </TouchableOpacity>
            </View>
          </>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    height: 60, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerIcons: { flexDirection: 'row' },
  iconBtn: { marginLeft: 16 },
  createPost: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    marginHorizontal: 16,
    marginVertical: 12,
    ...borderPresets.card,
    backgroundColor: 'rgba(30, 10, 60, 0.8)',
  },
  avatarSmall: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  postInput: { flex: 1, paddingVertical: 10, paddingHorizontal: 16 },
  imageIcon: {
    padding: 8,
  },
  trendingHeader: {
    paddingTop: 16,
  },
  trendingChef: {
    alignItems: 'center',
    marginRight: 20,
    width: 60,
  },
  avatarBorder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    padding: 2,
  },
  avatarTrending: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  postCard: { 
    marginBottom: 20, 
    marginHorizontal: 16,
    ...borderPresets.card,
    backgroundColor: 'rgba(30, 10, 60, 0.8)',
    overflow: 'hidden',
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  userInfo: { flex: 1 },
  postImage: { width: '100%', height: 300, resizeMode: 'cover' },
  dishTag: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.round,
    ...borderPresets.chip,
  },
  dishTagText: { color: '#FFF', fontSize: 12, fontWeight: 'bold', marginLeft: 6 },
  postActions: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, alignItems: 'center' },
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 24 },
  actionText: { marginLeft: 6, fontWeight: '600' },
});
