import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Text,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { themeColors, typography as designTypography, shadow } from '../theme/index';

const PLACEHOLDERS = [
  "Tìm món ngon hôm nay...",
  "Hôm nay ăn gì nhỉ?",
  "Thử phở bò nhé?",
  "Món gia đình yêu thích..."
];

const TRENDING_DATA = [
  { id: '1', title: 'Phở Bò Nam Định', image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=100' },
  { id: '2', title: 'Bún Chả Hà Nội', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=100' },
  { id: '3', title: 'Cơm Tấm Sườn Bì', image: 'https://images.unsplash.com/photo-1567033161212-d1498f530c72?q=80&w=100' },
];

const HISTORY_DATA = [
  { id: 'h1', title: 'Lẩu Thái Hải Sản', image: 'https://images.unsplash.com/photo-1559461678-8c43c112abbd?q=80&w=100' },
  { id: 'h2', title: 'Gà Chiên Mắm', image: 'https://images.unsplash.com/photo-1562967914-6c82739201fd?q=80&w=100' },
];

interface SearchBarProps {
  onSearch?: (query: string) => void;
  loading?: boolean;
  onFocusChange?: (focused: boolean) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, loading = false, onFocusChange }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  
  // Animations
  const focusAnim = useRef(new Animated.Value(0)).current; 
  const placeholderFade = useRef(new Animated.Value(1)).current;

  // Ref for input
  const inputRef = useRef<TextInput>(null);

  // Looping Placeholder Logic
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(placeholderFade, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        Animated.timing(placeholderFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Focus Animation Logic
  useEffect(() => {
    Animated.spring(focusAnim, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
      tension: 40
    }).start();
    onFocusChange?.(isFocused);
  }, [isFocused, focusAnim, onFocusChange]);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const renderDropdownItem = (item: any, type: 'trending' | 'history') => (
    <TouchableOpacity 
      key={item.id}
      style={styles.dropdownItem}
      activeOpacity={0.7}
      onPress={() => {
        setQuery(item.title);
        onSearch?.(item.title);
        inputRef.current?.blur();
      }}
    >
      <View style={styles.itemLeft}>
        <Image source={{ uri: item.image }} style={styles.thumbnail} />
        <Text style={[designTypography.body, { color: '#FFF', marginLeft: 12, fontSize: 14 }]}>{item.title}</Text>
      </View>
      <Ionicons 
        name={type === 'trending' ? "flame" : "time-outline"} 
        size={18} 
        color={type === 'trending' ? "#FF4500" : "rgba(255,255,255,0.4)"} 
      />
    </TouchableOpacity>
  );

  const skeletonItems = [1, 2, 3];

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.searchWrapper,
        {
          transform: [{ scale: focusAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] }) }],
          borderColor: focusAnim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,0.1)', '#7F77DD'] }),
          backgroundColor: focusAnim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.18)'] }),
          shadowOpacity: focusAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] }),
          shadowRadius: focusAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }),
        }
      ]}>
        <Ionicons name="search" size={20} color={isFocused ? "#7F77DD" : "rgba(255,255,255,0.5)"} />
        
        <View style={styles.inputContainer}>
          {query === '' && (
            <Animated.Text style={[styles.placeholder, { opacity: placeholderFade }]}>
              {PLACEHOLDERS[placeholderIndex]}
            </Animated.Text>
          )}
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              onSearch?.(text);
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            selectionColor="#7F77DD"
          />
        </View>

        <TouchableOpacity activeOpacity={0.6}>
          <Ionicons name="mic" size={20} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      </Animated.View>

      {/* Dropdown Section */}
      {isFocused && (
        <View style={styles.dropdown}>
          {loading ? (
            <View style={styles.skeletonContainer}>
              {skeletonItems.map(i => (
                <View key={i} style={styles.skeletonRow}>
                  <View style={styles.skeletonThumb} />
                  <View style={styles.skeletonText} />
                </View>
              ))}
            </View>
          ) : (query.length > 0 && 
               HISTORY_DATA.filter(h => h.title.toLowerCase().includes(query.toLowerCase())).length === 0 && 
               TRENDING_DATA.filter(t => t.title.toLowerCase().includes(query.toLowerCase())).length === 0) ? (
            <View style={styles.noResult}>
              <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                Không tìm thấy — thử "cơm", "phở", "bún"?
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>TRENDING 🔥</Text>
              </View>
              {TRENDING_DATA.map((item) => renderDropdownItem(item, 'trending'))}
              
              <View style={[styles.sectionHeader, { marginTop: 12 }]}>
                <Text style={styles.sectionTitle}>LỊCH SỬ TÌM KIẾM 🕒</Text>
              </View>
              {HISTORY_DATA.map((item) => renderDropdownItem(item, 'history'))}
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 1000,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 50,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    shadowColor: '#7F77DD',
    shadowOffset: { width: 0, height: 4 },
  },
  inputContainer: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    marginLeft: 10,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
    padding: 0,
  },
  placeholder: {
    position: 'absolute',
    color: 'rgba(255,255,255,0.4)',
    fontSize: 15,
  },
  dropdown: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#1A0B3B',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...shadow.lg,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(30, 10, 60, 0.8)',
  },
  sectionHeader: {
    paddingHorizontal: 8,
    marginBottom: 8,
    marginTop: 4,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  skeletonContainer: {
    padding: 8,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    opacity: 0.3,
  },
  skeletonThumb: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  skeletonText: {
    height: 10,
    width: '60%',
    backgroundColor: '#FFF',
    marginLeft: 12,
    borderRadius: 4,
  },
  noResult: {
    padding: 20,
    alignItems: 'center',
  }
});

export default SearchBar;
