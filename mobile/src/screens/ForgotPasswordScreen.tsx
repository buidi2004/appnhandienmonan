import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import AlertManager from '../components/CustomAlert';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { auth, sendPasswordResetEmail } from '../services/authService';

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
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={[styles.scrollContent, { padding: spacing.xl }]} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={[styles.backButton, { marginBottom: spacing.lg }]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.stepContainer}>
          <View style={[styles.header, { marginBottom: spacing.xxl }]}>
            <Text style={[styles.title, typography.h1, { color: colors.primary }]}>Khôi phục mật khẩu</Text>
            <Text style={[styles.subtitle, typography.body, { color: colors.textSecondary }]}>Nhập Email của bạn để nhận liên kết đặt lại mật khẩu.</Text>
          </View>
          <View style={[styles.inputContainer, { backgroundColor: colors.card, borderRadius: borderRadius.md, marginBottom: spacing.md, borderColor: colors.border }]}>
            <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={[styles.inputIcon, { paddingHorizontal: spacing.md }]} />
            <TextInput
              style={[styles.input, typography.body, { color: colors.text }]}
              placeholder="Email của bạn"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary, borderRadius: borderRadius.md, marginTop: spacing.lg, shadowColor: colors.primary }]} onPress={handleRequestReset}>
            <Text style={[styles.primaryButtonText, typography.h3, { color: colors.background }]}>Gửi liên kết khôi phục</Text>
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

