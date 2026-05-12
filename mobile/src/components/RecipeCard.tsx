import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface RecipeCardProps {
  item: {
    id: string;
    name?: string;
    title?: string;
    time: string;
    calories?: string;
    image: string;
  };
  onPress: () => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ item, onPress }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const skeletonAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!imageLoaded) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(skeletonAnim, {
            toValue: 0.7,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(skeletonAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [imageLoaded]);

  return (
    <TouchableOpacity 
      activeOpacity={0.75} 
      style={styles.card}
      onPress={onPress}
    >
      <View style={styles.imageWrapper}>
        {!imageLoaded && !imageError && (
          <Animated.View style={[styles.skeleton, { opacity: skeletonAnim }]} />
        )}
        {imageError ? (
          <LinearGradient
            colors={['#534AB7', '#1A0B3B']}
            style={styles.image}
          >
            <Ionicons name="restaurant-outline" size={32} color="rgba(224, 222, 255, 0.4)" />
          </LinearGradient>
        ) : (
          <Image
            source={{ uri: item.image }}
            style={styles.image}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(true);
            }}
          />
        )}
        
        <TouchableOpacity style={styles.heartButton} activeOpacity={0.7}>
          <Ionicons name="heart-outline" size={20} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Ionicons name="time-outline" size={14} color="#A89FFF" />
            <Text style={styles.badgeText}>{item.time}</Text>
          </View>
          {item.calories && (
            <View style={styles.badge}>
              <Ionicons name="flame-outline" size={14} color="#A89FFF" />
              <Text style={styles.badgeText}>{item.calories}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.name || item.title}</Text>
        <TouchableOpacity 
          style={styles.button}
          activeOpacity={0.8}
          onPress={onPress}
        >
          <Text style={styles.buttonText}>Xem chi tiết</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(30, 10, 60, 0.8)',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  imageWrapper: {
    height: 160,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeleton: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  heartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  badgeRow: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  badgeText: {
    fontFamily: 'System',
    color: '#E0DEFF',
    fontSize: 12,
  },
  info: {
    padding: 16,
  },
  name: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '700',
    color: '#E0DEFF',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#7F77DD',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#7F77DD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  buttonText: {
    fontFamily: 'System',
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default RecipeCard;
