import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { themeColors, typography as designTypography } from '../theme/index';

interface FoodManagementCardProps {
  onPress: () => void;
}

const FoodManagementCard: React.FC<FoodManagementCardProps> = ({ onPress }) => {
  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      style={styles.card}
      onPress={onPress}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="snow" size={32} color="#c4a8ff" />
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>Quản lý thực phẩm</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            Theo dõi hạn sử dụng để không bỏ phí thực phẩm nào nhé!
          </Text>
          <View style={styles.button}>
            <Text style={styles.buttonText}>KIỂM TRA NGAY</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(30, 10, 60, 0.8)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(127, 119, 221, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  title: {
    fontFamily: 'System',
    fontSize: 17,
    fontWeight: '700',
    color: '#E0DEFF',
  },
  subtitle: {
    fontFamily: 'System',
    fontSize: 13,
    color: '#a08acc',
    marginTop: 4,
    lineHeight: 18,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#7F77DD',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 12,
  },
  buttonText: {
    fontFamily: 'System',
    color: '#E0DEFF',
    fontWeight: '600',
    fontSize: 12,
  },
});

export default FoodManagementCard;
