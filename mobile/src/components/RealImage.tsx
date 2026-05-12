import React, { useState, useEffect, useRef } from 'react';
import { Image, View, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import API_CONFIG from '../config/apiConfig';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from './../theme/theme';
import { auth } from '../config/firebaseConfig';

// Simple in-memory cache to avoid re-fetching the same images
const imageCache: Record<string, string> = {};

export const SafeImage = ({ uri, style }: { uri?: string, style: any }) => {
  const { colors } = useAppTheme();
  const [error, setError] = useState(!uri);
  const [loading, setLoading] = useState(!!uri);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const skeletonAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(skeletonAnim, { toValue: 0.7, duration: 800, useNativeDriver: true }),
          Animated.timing(skeletonAnim, { toValue: 0.3, duration: 800, useNativeDriver: true })
        ])
      ).start();
    }
  }, [loading]);

  const onLoad = () => {
    setLoading(false);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  if (error || !uri) {
    return (
      <View style={[style, { overflow: 'hidden' }]}>
        <LinearGradient
          colors={[colors.primaryMuted || '#4c1d95', colors.primary || '#7c3aed']}
          style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}
        >
          <Ionicons name="restaurant-outline" size={32} color="rgba(255,255,255,0.6)" />
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[style, { overflow: 'hidden' }]}>
      {loading && (
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primaryMuted || '#7c3aed', opacity: skeletonAnim }]} />
      )}
      <Animated.Image 
        source={{ uri }} 
        style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}
        resizeMode="cover"
        onLoad={onLoad}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
      />
    </View>
  );
};

/**
 * Fetches a real image from the backend search-image API.
 * Includes an in-memory cache to avoid redundant network requests.
 */
export async function fetchImageUrl(query: string, isStep: boolean = false): Promise<string | null> {
  const cacheKey = `${isStep ? 'step:' : 'dish:'}${query}`;
  if (imageCache[cacheKey]) {
    return imageCache[cacheKey];
  }
  
  try {
    const user = auth.currentUser;
    const token = await user?.getIdToken();
    
    const fullQuery = isStep ? `cách làm ${query}` : `món ăn ${query} việt nam`;
    const res = await axios.get(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEARCH_IMAGE}?q=${encodeURIComponent(fullQuery)}`,
      { 
        timeout: 8000,
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    if (res.data && res.data.url) {
      imageCache[cacheKey] = res.data.url;
      return res.data.url;
    }
  } catch (err) {
    // silently fail
  }
  return null;
}

export const RealImage = ({ query, initialUri, style, isStep = false }: { query: string, initialUri?: string, style: any, isStep?: boolean }) => {
  const [uri, setUri] = useState<string | null>(initialUri || null);
  const [loading, setLoading] = useState(!initialUri);

  useEffect(() => {
    // If we already have a valid URI, don't bother fetching
    if (initialUri) return;

    let isMounted = true;
    const load = async () => {
      const url = await fetchImageUrl(query, isStep);
      if (isMounted) {
        setUri(url);
        setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [query, initialUri]);

  const { colors } = useAppTheme();

  if (loading && !uri) {
    return (
      <View style={[style, styles.loadingContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return <SafeImage uri={uri || initialUri} style={style} />;
};

const styles = StyleSheet.create({
  placeholder: {
    overflow: 'hidden',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
  },
});

export default RealImage;
