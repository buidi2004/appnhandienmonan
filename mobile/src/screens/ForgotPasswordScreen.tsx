import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleRequestOTP = () => {
    if (!emailOrPhone) {
      Alert.alert('Lỗi', 'Vui lòng nhập Email hoặc Số điện thoại');
      return;
    }
    // Gửi OTP logic
    setStep(2);
  };

  const handleVerifyOTP = () => {
    if (otp.length < 4) {
      Alert.alert('Lỗi', 'Mã OTP không hợp lệ');
      return;
    }
    // Xác minh OTP logic
    setStep(3);
  };

  const handleResetPassword = () => {
    if (!newPassword || !confirmNewPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ mật khẩu');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }
    // Gọi API đổi mật khẩu
    Alert.alert('Thành công', 'Mật khẩu của bạn đã được thay đổi!', [
      { text: 'Đăng nhập', onPress: () => navigation.replace('Auth') }
    ]);
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={[styles.scrollContent, { padding: spacing.xl }]} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={[styles.backButton, { marginBottom: spacing.lg }]} onPress={() => {
          if (step > 1) setStep((prev) => (prev - 1) as 1 | 2 | 3);
          else navigation.goBack();
        }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        {step === 1 && (
          <View style={styles.stepContainer}>
            <View style={[styles.header, { marginBottom: spacing.xxl }]}>
              <Text style={[styles.title, typography.h1, { color: colors.primary }]}>Quên mật khẩu</Text>
              <Text style={[styles.subtitle, typography.body, { color: colors.textSecondary }]}>Nhập Email hoặc Số điện thoại để nhận mã OTP khôi phục.</Text>
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
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary, borderRadius: borderRadius.md, marginTop: spacing.lg, shadowColor: colors.primary }]} onPress={handleRequestOTP}>
              <Text style={[styles.primaryButtonText, typography.h3, { color: colors.background }]}>Nhận mã OTP</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <View style={[styles.header, { marginBottom: spacing.xxl }]}>
              <Text style={[styles.title, typography.h1, { color: colors.primary }]}>Nhập mã xác nhận</Text>
              <Text style={[styles.subtitle, typography.body, { color: colors.textSecondary }]}>Mã OTP đã được gửi đến {emailOrPhone}</Text>
            </View>
            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderRadius: borderRadius.md, marginBottom: spacing.md, borderColor: colors.border }]}>
              <Ionicons name="keypad-outline" size={20} color={colors.textSecondary} style={[styles.inputIcon, { paddingHorizontal: spacing.md }]} />
              <TextInput
                style={[styles.input, typography.body, { color: colors.text }]}
                placeholder="Nhập 4 hoặc 6 số"
                placeholderTextColor={colors.textSecondary}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary, borderRadius: borderRadius.md, marginTop: spacing.lg, shadowColor: colors.primary }]} onPress={handleVerifyOTP}>
              <Text style={[styles.primaryButtonText, typography.h3, { color: colors.background }]}>Xác nhận OTP</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <View style={[styles.header, { marginBottom: spacing.xxl }]}>
              <Text style={[styles.title, typography.h1, { color: colors.primary }]}>Mật khẩu mới</Text>
              <Text style={[styles.subtitle, typography.body, { color: colors.textSecondary }]}>Vui lòng tạo một mật khẩu mới bảo mật hơn.</Text>
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderRadius: borderRadius.md, marginBottom: spacing.md, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={[styles.inputIcon, { paddingHorizontal: spacing.md }]} />
              <TextInput
                style={[styles.input, typography.body, { color: colors.text }]}
                placeholder="Mật khẩu mới"
                placeholderTextColor={colors.textSecondary}
                value={newPassword}
                onChangeText={setNewPassword}
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
                placeholder="Xác nhận mật khẩu mới"
                placeholderTextColor={colors.textSecondary}
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                secureTextEntry={!showPassword}
              />
            </View>

            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary, borderRadius: borderRadius.md, marginTop: spacing.lg, shadowColor: colors.primary }]} onPress={handleResetPassword}>
              <Text style={[styles.primaryButtonText, typography.h3, { color: colors.background }]}>Cập nhật mật khẩu</Text>
            </TouchableOpacity>
          </View>
        )}

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
