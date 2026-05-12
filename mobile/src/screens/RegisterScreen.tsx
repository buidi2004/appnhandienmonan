import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import AlertManager from '../components/CustomAlert';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { auth, createUserWithEmailAndPassword } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { themeColors, gradients, glass, glow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();

  const [name, setName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async () => {
    if (!name || !emailOrPhone || !password || !confirmPassword) {
      AlertManager.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (password !== confirmPassword) {
      AlertManager.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }
    
    try {
      AlertManager.alert('Đăng ký', 'Đang tạo tài khoản...');
      const userCredential = await createUserWithEmailAndPassword(auth, emailOrPhone.trim(), password);
      // Lưu token
      const token = await userCredential.user.getIdToken();
      await AsyncStorage.setItem('userToken', token);
      // Lưu tên người dùng (tùy chọn)
      await AsyncStorage.setItem('userName', name);
      
      AlertManager.alert('Thành công', 'Đăng ký tài khoản thành công!', [
        { text: 'Bắt đầu', onPress: () => navigation.replace('Terms') }
      ]);
    } catch (error: any) {
      console.error(error);
      let errorMessage = 'Không thể tạo tài khoản';
      if (error.code === 'auth/email-already-in-use') errorMessage = 'Email này đã được sử dụng';
      if (error.code === 'auth/weak-password') errorMessage = 'Mật khẩu phải có ít nhất 6 ký tự';
      if (error.code === 'auth/invalid-email') errorMessage = 'Email không hợp lệ';
      AlertManager.alert('Lỗi đăng ký', errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: themeColors.bgPrimary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={[styles.scrollContent, { padding: spacing.xl }]} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={[styles.backButton, { marginBottom: spacing.lg }]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
        </TouchableOpacity>

        <View style={[styles.header, { marginBottom: spacing.xxl }]}>
          <Text style={[styles.title, typography.h1, { color: themeColors.purple }]}>Tạo tài khoản</Text>
          <Text style={[styles.subtitle, typography.body, { color: themeColors.textSecondary }]}>Bắt đầu hành trình nấu nướng của bạn!</Text>
        </View>

        <View style={styles.form}>
          <View style={[styles.inputContainer, { ...glass.card, backgroundColor: themeColors.bgCard, borderRadius: borderRadius.md, marginBottom: spacing.md, borderColor: themeColors.borderCard }]}>
            <Ionicons name="person-outline" size={20} color={themeColors.textSecondary} style={[styles.inputIcon, { paddingHorizontal: spacing.md }]} />
            <TextInput
              style={[styles.input, typography.body, { color: themeColors.textPrimary }]}
              placeholder="Họ và tên"
              placeholderTextColor={themeColors.textSecondary}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={[styles.inputContainer, { ...glass.card, backgroundColor: themeColors.bgCard, borderRadius: borderRadius.md, marginBottom: spacing.md, borderColor: themeColors.borderCard }]}>
            <Ionicons name="mail-outline" size={20} color={themeColors.textSecondary} style={[styles.inputIcon, { paddingHorizontal: spacing.md }]} />
            <TextInput
              style={[styles.input, typography.body, { color: themeColors.textPrimary }]}
              placeholder="Email hoặc Số điện thoại"
              placeholderTextColor={themeColors.textSecondary}
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              autoCapitalize="none"
            />
          </View>

          <View style={[styles.inputContainer, { ...glass.card, backgroundColor: themeColors.bgCard, borderRadius: borderRadius.md, marginBottom: spacing.md, borderColor: themeColors.borderCard }]}>
            <Ionicons name="lock-closed-outline" size={20} color={themeColors.textSecondary} style={[styles.inputIcon, { paddingHorizontal: spacing.md }]} />
            <TextInput
              style={[styles.input, typography.body, { color: themeColors.textPrimary }]}
              placeholder="Mật khẩu"
              placeholderTextColor={themeColors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={[styles.eyeIcon, { paddingHorizontal: spacing.md }]}>
              <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.inputContainer, { ...glass.card, backgroundColor: themeColors.bgCard, borderRadius: borderRadius.md, marginBottom: spacing.md, borderColor: themeColors.borderCard }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color={themeColors.textSecondary} style={[styles.inputIcon, { paddingHorizontal: spacing.md }]} />
            <TextInput
              style={[styles.input, typography.body, { color: themeColors.textPrimary }]}
              placeholder="Xác nhận mật khẩu"
              placeholderTextColor={themeColors.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={[styles.eyeIcon, { paddingHorizontal: spacing.md }]}>
              <Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={20} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={handleRegister}
            style={[styles.registerButtonWrapper, { ...glow.button, shadowColor: themeColors.purple, marginTop: spacing.md }]} 
          >
            <LinearGradient
              colors={gradients.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.registerButton, { borderRadius: borderRadius.md }]}
            >
              <Text style={[styles.registerButtonText, typography.h3, { color: themeColors.textPrimary }]}>Đăng ký ngay</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingTop: 60 },
  backButton: {},
  header: {},
  title: { marginBottom: 8 },
  subtitle: {},
  form: { width: '100%' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', height: 56 },
  inputIcon: {},
  input: { flex: 1, height: '100%' },
  eyeIcon: {},
  registerButtonWrapper: { height: 56 },
  registerButton: {
    height: '100%', justifyContent: 'center', alignItems: 'center',
  },
  registerButtonText: { fontWeight: 'bold' },
});

