import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function EditProfileScreen() {
  const { colors, typography, spacing, borderRadius } = useAppTheme();
  const navigation = useNavigation();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [name, setName] = useState('Đầu bếp tương lai');
  const [bio, setBio] = useState('Yêu bếp, nghiện nhà, thích nấu ăn.');
  const [email, setEmail] = useState('chef@example.com');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const savedAvatar = await AsyncStorage.getItem('userAvatar');
      const savedName = await AsyncStorage.getItem('userName');
      const savedBio = await AsyncStorage.getItem('userBio');
      const savedEmail = await AsyncStorage.getItem('userEmail');

      if (savedAvatar) setAvatar(savedAvatar);
      if (savedName) setName(savedName);
      if (savedBio) setBio(savedBio);
      if (savedEmail) setEmail(savedEmail);
    } catch (e) {
      console.error('Failed to load profile', e);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh để đổi Avatar!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      if (avatar) await AsyncStorage.setItem('userAvatar', avatar);
      await AsyncStorage.setItem('userName', name);
      await AsyncStorage.setItem('userBio', bio);
      
      Alert.alert('Thành công', 'Đã lưu hồ sơ cá nhân!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể lưu hồ sơ.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatarWrapper}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarPlaceholder} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: `${colors.primary}20` }]}>
              <Ionicons name="person" size={60} color={colors.primary} />
            </View>
          )}
          <TouchableOpacity style={[styles.changePhotoBtn, { backgroundColor: colors.primary }]} onPress={pickImage}>
            <Ionicons name="camera" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
        <Text style={[typography.h3, { color: colors.text, marginTop: 12 }]}>{name}</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 8, fontWeight: 'bold' }]}>HỌ VÀ TÊN</Text>
        <TextInput 
          style={[styles.input, typography.body, { backgroundColor: colors.card, color: colors.text, borderRadius: borderRadius.md }]} 
          value={name}
          onChangeText={setName}
          placeholder="Nhập tên của bạn"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 8, fontWeight: 'bold' }]}>EMAIL</Text>
        <TextInput 
          style={[styles.input, typography.body, { backgroundColor: colors.card, color: colors.textSecondary, borderRadius: borderRadius.md, opacity: 0.7 }]} 
          value={email}
          editable={false}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 8, fontWeight: 'bold' }]}>TIỂU SỬ</Text>
        <TextInput 
          style={[styles.input, styles.textArea, typography.body, { backgroundColor: colors.card, color: colors.text, borderRadius: borderRadius.md }]} 
          value={bio}
          onChangeText={setBio}
          multiline
          placeholder="Giới thiệu ngắn về bản thân..."
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <TouchableOpacity 
        style={[styles.saveBtn, { backgroundColor: colors.primary, borderRadius: borderRadius.lg, marginTop: spacing.xl }]}
        onPress={saveProfile}
      >
        <Text style={[typography.h3, { color: '#FFF', fontWeight: 'bold' }]}>Lưu thay đổi</Text>
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
    marginVertical: 30,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  changePhotoBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  formGroup: {
    marginBottom: 20,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  saveBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  }
});
