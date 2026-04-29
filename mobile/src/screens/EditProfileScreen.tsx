import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EditProfileScreen() {
  const { colors, typography, spacing, borderRadius } = useAppTheme();
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    loadAvatar();
  }, []);

  const loadAvatar = async () => {
    try {
      const savedAvatar = await AsyncStorage.getItem('userAvatar');
      if (savedAvatar) setAvatar(savedAvatar);
    } catch (e) {}
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh để đổi Avatar!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const saveProfile = async () => {
    try {
      if (avatar) {
        await AsyncStorage.setItem('userAvatar', avatar);
      }
      Alert.alert('Thành công', 'Đã lưu hồ sơ cá nhân!');
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể lưu hồ sơ.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={styles.avatarContainer}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatarPlaceholder} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: `${colors.primary}20` }]}>
            <Ionicons name="person" size={60} color={colors.primary} />
          </View>
        )}
        <TouchableOpacity style={[styles.changePhotoBtn, { backgroundColor: colors.primary }]} onPress={pickImage}>
          <Ionicons name="camera" size={16} color="#FFF" />
          <Text style={[typography.caption, { color: '#FFF', marginLeft: 4, fontWeight: 'bold' }]}>Đổi ảnh</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formGroup}>
        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 8 }]}>Họ và tên</Text>
        <TextInput 
          style={[styles.input, typography.body, { backgroundColor: colors.card, color: colors.text, borderRadius: borderRadius.md }]} 
          value="Đầu bếp tương lai"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 8 }]}>Email</Text>
        <TextInput 
          style={[styles.input, typography.body, { backgroundColor: colors.card, color: colors.textSecondary, borderRadius: borderRadius.md }]} 
          value="chef@example.com"
          editable={false}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 8 }]}>Tiểu sử</Text>
        <TextInput 
          style={[styles.input, styles.textArea, typography.body, { backgroundColor: colors.card, color: colors.text, borderRadius: borderRadius.md }]} 
          value="Yêu bếp, nghiện nhà, thích nấu ăn."
          multiline
        />
      </View>

      <TouchableOpacity 
        style={[styles.saveBtn, { backgroundColor: colors.primary, borderRadius: borderRadius.lg, marginTop: spacing.xl }]}
        onPress={saveProfile}
      >
        <Text style={[typography.h3, { color: '#FFF' }]}>Lưu thay đổi</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: -16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  formGroup: {
    marginBottom: 20,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  }
});
