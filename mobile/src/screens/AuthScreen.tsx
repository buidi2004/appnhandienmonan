import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Linking, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

export default function AuthScreen({ navigation }: Props) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    await AsyncStorage.setItem('userToken', 'dummy-jwt-token-12345');
    navigation.replace('Terms');
  };

  const handleOpenHotline = () => {
    Linking.openURL('tel:0901234567');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.xl }]} 
          showsVerticalScrollIndicator={false}
        >
          {/* Header - Kéo xuống thấp hơn để tránh notch */}
          <View style={[styles.header, { marginTop: 60, marginBottom: spacing.xl }]}>
            <Text style={[styles.title, typography.h1, { color: colors.primary }]}>Chào mừng trở lại</Text>
            <Text style={[styles.subtitle, typography.body, { color: colors.textSecondary }]}>Đăng nhập để khám phá món ngon!</Text>
          </View>

          <View style={styles.form}>
            {/* Cụm Input & Login - Dồn lại gần nhau hơn */}
            <View style={styles.inputGroup}>
              <View style={[styles.inputContainer, { backgroundColor: colors.card, borderRadius: borderRadius.md, marginBottom: 12, borderColor: colors.border }]}>
                <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={[styles.inputIcon, { paddingHorizontal: spacing.md }]} />
                <TextInput
                  style={[styles.input, typography.body, { color: colors.text }]}
                  placeholder="Email hoặc Số điện thoại"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={[styles.inputContainer, { backgroundColor: colors.card, borderRadius: borderRadius.md, marginBottom: 8, borderColor: colors.border }]}>
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

              <TouchableOpacity style={styles.forgotPassword} onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={[styles.forgotText, typography.caption, { color: colors.primary }]}>Quên mật khẩu?</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.loginButton, { backgroundColor: colors.primary, borderRadius: borderRadius.md, marginTop: 24, shadowColor: colors.primary }]} 
                onPress={handleLogin}
                activeOpacity={0.8}
              >
                <Text style={[styles.loginButtonText, typography.h3, { color: colors.background }]}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>

            {/* Cụm Social - Hiện đại & Gọn gàng */}
            <View style={[styles.dividerContainer, { marginVertical: 32 }]}>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, typography.caption, { marginHorizontal: spacing.md, color: colors.textSecondary }]}>Hoặc tiếp tục với</Text>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity style={[styles.socialIconOnlyBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="logo-google" size={24} color="#DB4437" />
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.socialIconOnlyBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="logo-facebook" size={24} color="#1877F2" />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.socialIconOnlyBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="chatbubble" size={24} color="#0068FF" />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.socialIconOnlyBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="logo-apple" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.footer, { marginTop: 40 }]}>
            <Text style={[styles.footerText, typography.body, { color: colors.textSecondary }]}>Bạn chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.registerText, typography.body, { color: colors.primary }]}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>

          {/* Hotline - Đẩy xuống đáy */}
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={[styles.hotlineContainer, { paddingVertical: 24 }]} onPress={handleOpenHotline}>
            <Ionicons name="headset-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.hotlineText, typography.caption, { color: colors.textSecondary }]}> Gặp sự cố? Liên hệ Hotline: <Text style={[styles.hotphoneNumber, { color: colors.text }]}>0901.234.567</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  inputGroup: {
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
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    fontWeight: '600',
  },
  loginButton: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  socialIconOnlyBtn: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
  },
  registerText: {
    fontWeight: 'bold',
  },
  hotlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotlineText: {
    marginLeft: 4,
  },
  hotphoneNumber: {
    fontWeight: 'bold',
  }
});
