import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import { themeColors, gradients, glass, glow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Permission'>;

export default function PermissionScreen({ navigation }: Props) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();

  const handleRequestPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    
    if (status === 'granted') {
      navigation.replace('MainTabs');
    } else {
      // Có thể dùng một thông báo hoặc chuyển vào nhưng không có chức năng camera
      navigation.replace('MainTabs');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bgPrimary, padding: spacing.xl }]}>
      <View style={[styles.iconContainer, { marginBottom: 40 }]}>
        <View style={[styles.circleLayer1, { backgroundColor: `${themeColors.purple}10` }]}>
          <View style={[styles.circleLayer2, { backgroundColor: `${themeColors.purple}20` }]}>
            <Ionicons name="camera" size={60} color={themeColors.purple} />
          </View>
        </View>
      </View>

      <Text style={[styles.title, typography.h1, { color: themeColors.textPrimary, marginBottom: spacing.md }]}>Truy cập Máy ảnh</Text>
      <Text style={[styles.description, typography.body, { color: themeColors.textSecondary }]}>
        Để AI có thể nhìn thấy nguyên liệu trong tủ lạnh của bạn, ứng dụng cần quyền truy cập Camera và Thư viện ảnh. 
        {"\n\n"}Dữ liệu hình ảnh chỉ dùng để nhận diện món ăn.
      </Text>

      <TouchableOpacity style={[styles.allowButton, { ...glow.button, backgroundColor: themeColors.purple, borderRadius: borderRadius.md, marginBottom: spacing.md, shadowColor: themeColors.purple }]} onPress={handleRequestPermission}>
        <Text style={[styles.allowButtonText, typography.h3, { color: themeColors.textPrimary }]}>Cấp quyền ngay</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.denyButton} onPress={() => navigation.replace('MainTabs')}>
        <Text style={[styles.denyButtonText, typography.h3, { color: themeColors.textSecondary }]}>Để sau</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleLayer1: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleLayer2: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 50,
  },
  allowButton: {
    width: '100%',
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  allowButtonText: {
  },
  denyButton: {
    width: '100%',
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  denyButtonText: {
  },
});
