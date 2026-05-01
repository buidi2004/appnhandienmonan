import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Linking, Alert } from 'react-native';
import AlertManager from '../components/CustomAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnimatedButton from '../components/AnimatedButton';
import { auth, signInWithEmailAndPassword, signInWithGoogle } from '../services/authService';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

export default function AuthScreen({ navigation }: Props) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      AlertManager.alert('Lỗi', 'Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }
    try {
      AlertManager.alert('Đăng nhập', 'Đang xác thực...');
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      // Lấy token thật từ Firebase để gửi cho Backend sau này
      const token = await userCredential.user.getIdToken();
      await AsyncStorage.setItem('userToken', token);
      
      // Nếu Firebase login thành công
      AlertManager.alert('Đăng nhập thành công', `Chào mừng trở lại!`);
      navigation.replace('Terms');
    } catch (error: any) {
      console.error(error);
      let errorMessage = 'Sai email hoặc mật khẩu';
      if (error.code === 'auth/user-not-found') errorMessage = 'Tài khoản không tồn tại';
      if (error.code === 'auth/wrong-password') errorMessage = 'Mật khẩu không chính xác';
      if (error.code === 'auth/invalid-email') errorMessage = 'Email không hợp lệ';
      AlertManager.alert('Lỗi đăng nhập', errorMessage);
    }
  };

  const handleOpenHotline = () => {
    Linking.openURL('tel:0901234567');
  };

  const handleSocialLogin = async (platform: string) => {
    if (platform === 'Google') {
      try {
        AlertManager.alert('Đăng nhập', 'Đang kết nối tới Google...');
        const userCredential = await signInWithGoogle();
        const token = await userCredential.user.getIdToken();
        await AsyncStorage.setItem('userToken', token);
        
        AlertManager.alert('Đăng nhập thành công', `Chào mừng bạn!`);
        navigation.replace('Terms');
      } catch (error) {
        AlertManager.alert('Lỗi', 'Không thể đăng nhập bằng Google');
      }
    } else {
      AlertManager.alert('Thông báo', `${platform} hiện chưa khả dụng. Vui lòng dùng Google hoặc Email.`);
    }
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
                <AnimatedButton onPress={() => setShowPassword(!showPassword)} style={[styles.eyeIcon, { paddingHorizontal: spacing.md }]}>
                  <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={colors.textSecondary} />
                </AnimatedButton>
              </View>

              <AnimatedButton style={styles.forgotPassword} onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={[styles.forgotText, typography.caption, { color: colors.primary }]}>Quên mật khẩu?</Text>
              </AnimatedButton>

              <AnimatedButton 
                style={[styles.loginButton, { backgroundColor: colors.primary, borderRadius: borderRadius.md, marginTop: 24, shadowColor: colors.primary }]} 
                onPress={handleLogin}
                activeOpacity={0.8}
              >
                <Text style={[styles.loginButtonText, typography.h3, { color: colors.background }]}>Đăng nhập</Text>
              </AnimatedButton>
            </View>

            {/* Cụm Social - Hiện đại & Gọn gàng */}
            <View style={[styles.dividerContainer, { marginVertical: 32 }]}>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, typography.caption, { marginHorizontal: spacing.md, color: colors.textSecondary }]}>Hoặc tiếp tục với</Text>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            </View>

            <View style={styles.socialRow}>
              <AnimatedButton activeOpacity={0.7} onPress={() => handleSocialLogin('Google')} style={[styles.socialIconOnlyBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="logo-google" size={24} color="#DB4437" />
              </AnimatedButton>
              
              <AnimatedButton activeOpacity={0.7} onPress={() => handleSocialLogin('Facebook')} style={[styles.socialIconOnlyBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="logo-facebook" size={24} color="#1877F2" />
              </AnimatedButton>

              <AnimatedButton activeOpacity={0.7} onPress={() => handleSocialLogin('Zalo')} style={[styles.socialIconOnlyBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="chatbubble" size={24} color="#0068FF" />
              </AnimatedButton>

              <AnimatedButton activeOpacity={0.7} onPress={() => handleSocialLogin('Apple')} style={[styles.socialIconOnlyBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="logo-apple" size={24} color={colors.text} />
              </AnimatedButton>
            </View>
          </View>

          <View style={[styles.footer, { marginTop: 40 }]}>
            <Text style={[styles.footerText, typography.body, { color: colors.textSecondary }]}>Bạn chưa có tài khoản? </Text>
            <AnimatedButton onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.registerText, typography.body, { color: colors.primary }]}>Đăng ký ngay</Text>
            </AnimatedButton>
          </View>

          {/* Hotline - Đẩy xuống đáy */}
          <View style={{ flex: 1 }} />
          <AnimatedButton style={[styles.hotlineContainer, { paddingVertical: 24 }]} onPress={handleOpenHotline}>
            <Ionicons name="headset-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.hotlineText, typography.caption, { color: colors.textSecondary }]}> Gặp sự cố? Liên hệ Hotline: <Text style={[styles.hotphoneNumber, { color: colors.text }]}>0901.234.567</Text></Text>
          </AnimatedButton>
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
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  socialIconOnlyBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
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

