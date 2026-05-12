import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import AlertManager from '../components/CustomAlert';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { auth, sendPasswordResetEmail } from '../services/authService';
import { themeColors, gradients, glass, glow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();

  const [email, setEmail] = useState('');

  const handleRequestReset = async () => {
    if (!email) {
      AlertManager.alert('Lỗi', 'Vui lòng nhập Email của bạn');
      return;
    }
    try {
      AlertManager.alert('Đang xử lý', 'Đang gửi email khôi phục...');
      await sendPasswordResetEmail(auth, email.trim());
      AlertManager.alert('Thành công', 'Vui lòng kiểm tra hộp thư đến của bạn để đặt lại mật khẩu.', [
        { text: 'Trở về đăng nhập', onPress: () => navigation.replace('Auth') }
      ]);
    } catch (error: any) {
      console.error(error);
      let errorMessage = 'Không thể gửi email khôi phục';
      if (error.code === 'auth/user-not-found') errorMessage = 'Tài khoản không tồn tại';
      if (error.code === 'auth/invalid-email') errorMessage = 'Email không hợp lệ';
      AlertManager.alert('Lỗi', errorMessage);
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

        <View style={styles.stepContainer}>
          <View style={[styles.header, { marginBottom: spacing.xxl }]}>
            <Text style={[styles.title, typography.h1, { color: themeColors.purple }]}>Khôi phục mật khẩu</Text>
            <Text style={[styles.subtitle, typography.body, { color: themeColors.textSecondary }]}>Nhập Email của bạn để nhận liên kết đặt lại mật khẩu.</Text>
          </View>
          <View style={[styles.inputContainer, { ...glass.card, backgroundColor: themeColors.bgCard, borderRadius: borderRadius.md, marginBottom: spacing.md, borderColor: themeColors.borderCard }]}>
            <Ionicons name="mail-outline" size={20} color={themeColors.textSecondary} style={[styles.inputIcon, { paddingHorizontal: spacing.md }]} />
            <TextInput
              style={[styles.input, typography.body, { color: themeColors.textPrimary }]}
              placeholder="Email của bạn"
              placeholderTextColor={themeColors.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          <TouchableOpacity style={[styles.primaryButton, { ...glow.button, backgroundColor: themeColors.purple, borderRadius: borderRadius.md, marginTop: spacing.lg, shadowColor: themeColors.purple }]} onPress={handleRequestReset}>
            <Text style={[styles.primaryButtonText, typography.h3, { color: themeColors.textPrimary }]}>Gửi liên kết khôi phục</Text>
          </TouchableOpacity>
        </View>

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
  stepContainer: {
    flex: 1,
  },
  header: {
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    lineHeight: 24,
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
  primaryButton: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
  },
});

