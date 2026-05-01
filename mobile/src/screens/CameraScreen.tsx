import AlertManager from '../components/CustomAlert';
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  Animated, 
  Dimensions, 
  StatusBar,
  Pressable
} from 'react-native';
import { CameraView, useCameraPermissions, FlashMode } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme } from '../theme/theme';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import AnimatedButton from '../components/AnimatedButton';
import GlassCard from '../components/GlassCard';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabParamList, RootStackParamList } from '../../App';

type Props = BottomTabScreenProps<TabParamList, 'Camera'>;

const { width, height } = Dimensions.get('window');
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CameraScreen({ navigation: tabNavigation }: Props) {
  const { colors, typography, spacing, borderRadius } = useAppTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [flash, setFlash] = useState<FlashMode>('off');
  const [showFlashOverlay, setShowFlashOverlay] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const navigation = useNavigation<NavigationProp>();

  // Scanner Line Animation
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  if (!permission) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background, padding: spacing.xl }]}>
        <Ionicons name="camera-outline" size={64} color={colors.textSecondary} />
        <Text style={[styles.permissionText, typography.body, { color: colors.textSecondary, marginVertical: spacing.lg }]}>Chúng tôi cần quyền truy cập Camera để quét nguyên liệu</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, borderRadius: borderRadius.md }]} onPress={requestPermission}>
          <Text style={[styles.buttonText, typography.body, { color: colors.background }]}>Cấp quyền</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      setIsProcessing(true);
      
      // Tối ưu 4: Phản hồi thị giác & xúc giác
      setShowFlashOverlay(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setShowFlashOverlay(false), 50);

      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.1 });
        if (photo) {
          navigation.navigate('AIResult', { imageUri: photo.uri });
        }
      } catch (error) {
        AlertManager.alert('Lỗi', 'Không thể chụp ảnh');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled) {
      navigation.navigate('AIResult', { imageUri: result.assets[0].uri });
    }
  };

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 240], // Chiều cao của khung quét
  });

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <CameraView 
        style={styles.camera} 
        facing="back" 
        ref={cameraRef}
        flash={flash}
      >
        <View style={styles.overlay}>
          {/* Tối ưu 1: Top Bar với nút Đóng & Flash */}
          <View style={styles.header}>
            <AnimatedButton 
              style={styles.iconBtn} 
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="close" size={28} color="#FFF" />
            </AnimatedButton>

            <View style={styles.hintContainer}>
              <Text style={[styles.hintText, typography.caption]}>QUÉT NGUYÊN LIỆU</Text>
            </View>

            <AnimatedButton 
              style={styles.iconBtn} 
              onPress={() => setFlash(flash === 'off' ? 'on' : 'off')}
            >
              <Ionicons 
                name={flash === 'on' ? "flash" : "flash-off"} 
                size={24} 
                color={flash === 'on' ? colors.primary : "#FFF"} 
              />
            </AnimatedButton>
          </View>
          
          {/* Tối ưu 3: Khung nhận diện AI Style */}
          <View style={styles.scannerWrapper}>
            {/* 4 Góc vuông */}
            <View style={[styles.corner, styles.topLeft, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.topRight, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.bottomRight, { borderColor: colors.primary }]} />
            
            {/* Vạch sáng chạy */}
            <Animated.View style={[
              styles.scanLine, 
              { 
                backgroundColor: colors.primary,
                transform: [{ translateY }]
              }
            ]} />
            
            <View style={styles.scannerHint}>
              <Text style={styles.scannerHintText}>Đặt nguyên liệu vào khung</Text>
            </View>
          </View>

          {/* Tối ưu 2: Điều khiển phía dưới */}
          <View style={styles.footer}>
            <AnimatedButton style={styles.secondaryBtn} onPress={pickImage}>
              <Ionicons name="images" size={28} color="#FFF" />
            </AnimatedButton>

            <AnimatedButton 
              style={styles.captureButton} 
              onPress={takePicture}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : (
                <View style={[styles.captureInner, { backgroundColor: colors.primary }]} />
              )}
            </AnimatedButton>

            <AnimatedButton 
              style={styles.secondaryBtn}
              onPress={() => {
                setIsProcessing(false);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Ionicons name="reload" size={28} color="#FFF" />
            </AnimatedButton>
          </View>
        </View>

        {/* Visual Flash Feedback */}
        {showFlashOverlay && <View style={styles.flashOverlay} />}
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    textAlign: 'center',
  },
  button: {
    paddingVertical: 12,
  },
  buttonText: {
    fontWeight: 'bold',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  hintText: {
    color: '#FFF',
    letterSpacing: 1,
    fontWeight: '700',
  },
  scannerWrapper: {
    width: 260,
    height: 260,
    alignSelf: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 10,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 10,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 10,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 10,
  },
  scanLine: {
    width: '100%',
    height: 2,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  scannerHint: {
    position: 'absolute',
    bottom: -40,
    width: '100%',
    alignItems: 'center',
  },
  scannerHintText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  captureButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  secondaryBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 100,
  },
});


