import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import AlertManager from '../components/CustomAlert';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { auth, createUserWithEmailAndPassword } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={[styles.scrollContent, { padding: spacing.xl }]} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={[styles.backButton, { marginBottom: spacing.lg }]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={[styles.header, { marginBottom: spacing.xxl }]}>
          <Text style={[styles.title, typography.h1, { color: colors.primary }]}>Tạo tài khoản</Text>
          <Text style={[styles.subtitle, typography.body, { color: colors.textSecondary }]}>Bắt đầu hành trình nấu nướng của bạn!</Text>
        </View>

        <View style={styles.form}>
          <View style={[styles.inputContainer, { backgroundColor: colors.card, borderRadius: borderRadius.md, marginBottom: spacing.md, borderColor: colors.border }]}>
            <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={[styles.inputIcon, { paddingHorizontal: spacing.md }]} />
            <TextInput
              style={[styles.input, typography.body, { color: colors.text }]}
              placeholder="Họ và tên"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: colors.card, borderRadius: borderRadius.md, marginBottom: spacing.md, borderColor: colors.border }]}>
            <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={[styles.inputIcon, { paddingHorizontal: spacing.md }]} />
            <TextInput
              style={[styles.input, typography.body, { color: colors.text }]}
              placeholder="Email hoặc Số điện thoại"
              placeholderTextColor={colors.textSecondary}
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              autoCapitalize="none"
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: colors.card, borderRadius: borderRadius.md, marginBottom: spacing.md, borderColor: colors.border }]}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={[styles.inputIcon, { paddingHorizontal: spacing.md }]} />
            <TextInput
              style={[styles.input, typography.body, { color: colors.text }]}
              placeholder="Mật khẩu"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={[styles.eyeIcon, { paddingHorizontal: spacing.md }]}>
              <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.inputContainer, { backgroundColor: colors.card, borderRadius: borderRadius.md, marginBottom: spacing.md, borderColor: colors.border }]}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} style={[styles.inputIcon, { paddingHorizontal: spacing.md }]} />
            <TextInput
              style={[styles.input, typography.body, { color: colors.text }]}
              placeholder="Xác nhận mật khẩu"
              placeholderTextColor={colors.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={[styles.eyeIcon, { paddingHorizontal: spacing.md }]}>
              <Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.registerButton, { backgroundColor: colors.primary, borderRadius: borderRadius.md, marginTop: spacing.md, shadowColor: colors.primary }]} onPress={handleRegister}>
            <Text style={[styles.registerButtonText, typography.h3, { color: colors.background }]}>Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 60,
  },
  backButton: {
  },
  header: {
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    height: 56,
  },
  inputIcon: {
  },
  input: {
    flex: 1,
    height: '100%',
  },
  eyeIcon: {
  },
  registerButton: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  registerButtonText: {
  },
});

