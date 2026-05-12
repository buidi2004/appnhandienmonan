import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { themeColors } from '../theme/index';

interface MealPlanCardProps {
  onPress: () => void;
}

const MealPlanCard: React.FC<MealPlanCardProps> = ({ onPress }) => {
  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      style={styles.card}
      onPress={onPress}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="calendar" size={28} color="#c4a8ff" />
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>Thực đơn tuần này</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            Duy trì thói quen ăn uống lành mạnh
          </Text>
        </View>
        <View style={styles.chevronContainer}>
          <Ionicons name="chevron-forward" size={20} color="rgba(224, 222, 255, 0.6)" />
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
  },
  chevronContainer: {
    paddingLeft: 12,
  }
});

export default MealPlanCard;
