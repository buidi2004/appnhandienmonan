import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/theme';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'cancel' | 'default' | 'destructive';
}

export interface AlertOptions {
  title: string;
  message: string;
  buttons?: AlertButton[];
  type?: 'success' | 'error' | 'warning' | 'info';
}

class AlertManager {
  static listeners: ((options: AlertOptions) => void)[] = [];
  
  static alert(
    title: string,
    message: string,
    buttons?: AlertButton[],
    options?: { cancelable?: boolean }
  ) {
    if (this.listeners.length > 0) {
      let type: 'success' | 'error' | 'warning' | 'info' = 'info';
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes('lỗi') || lowerTitle.includes('thất bại')) type = 'error';
      else if (lowerTitle.includes('thành công') || lowerTitle.includes('hoàn thành') || lowerTitle.includes('chúc mừng') || lowerTitle.includes('lên cấp')) type = 'success';
      else if (lowerTitle.includes('cảnh báo') || lowerTitle.includes('xóa')) type = 'warning';
      
      const topListener = this.listeners[this.listeners.length - 1];
      topListener({ title, message, buttons, type });
    } else {
      // Fallback in case component is not mounted
      import('react-native').then(({ Alert }) => {
        Alert.alert(title, message, buttons);
      });
    }
  }
}

export const CustomAlert = () => {
  const { colors, typography, borderRadius } = useAppTheme();
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions | null>(null);
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const listener = (opts: AlertOptions) => {
      setOptions(opts);
      setVisible(true);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    };
    
    AlertManager.listeners.push(listener);
    
    return () => {
      AlertManager.listeners = AlertManager.listeners.filter(l => l !== listener);
    };
  }, []);

  const close = (onPress?: () => void) => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start(() => {
      setVisible(false);
      setOptions(null);
      if (onPress) onPress();
    });
  };

  if (!visible || !options) return null;

  const { title, message, type = 'info', buttons } = options;

  let iconName = 'information-circle';
  let iconColor = colors.primary;
  
  if (type === 'success') {
    iconName = 'checkmark-circle';
    iconColor = colors.success || '#34C759';
  } else if (type === 'error') {
    iconName = 'close-circle';
    iconColor = colors.error || '#FF3B30';
  } else if (type === 'warning') {
    iconName = 'warning';
    iconColor = '#FF9500';
  }

  const defaultButtons: AlertButton[] = [{ text: 'OK', onPress: () => {} }];
  const activeButtons = buttons && buttons.length > 0 ? buttons : defaultButtons;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[styles.overlayBg, { opacity: fadeAnim }]} />
        <Animated.View 
          style={[
            styles.alertBox, 
            { 
              backgroundColor: colors.card,
              borderRadius: borderRadius.xl,
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim
            }
          ]}
        >
          <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
            <Ionicons name={iconName as any} size={40} color={iconColor} />
          </View>
          
          <Text style={[typography.h2, styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[typography.body, styles.message, { color: colors.textSecondary }]}>{message}</Text>
          
          <View style={styles.buttonContainer}>
            {activeButtons.map((btn, index) => (
              <TouchableOpacity 
                key={index}
                activeOpacity={0.8}
                style={[
                  styles.button, 
                  { 
                    backgroundColor: btn.style === 'destructive' ? colors.error : (btn.style === 'cancel' ? colors.border : colors.primary),
                    flex: activeButtons.length > 1 ? 1 : undefined,
                    width: activeButtons.length === 1 ? '100%' : undefined,
                    marginLeft: index > 0 ? 12 : 0
                  }
                ]}
                onPress={() => close(btn.onPress)}
              >
                <Text style={[
                  typography.h3, 
                  { color: btn.style === 'cancel' ? colors.text : '#FFF' }
                ]}>
                  {btn.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  alertBox: {
    width: '85%',
    maxWidth: 340,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  button: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default AlertManager;
