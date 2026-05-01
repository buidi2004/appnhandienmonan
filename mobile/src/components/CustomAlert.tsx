import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
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
      const lowerMsg = message.toLowerCase();
      
      if (lowerTitle.includes('lỗi') || lowerTitle.includes('thất bại') || lowerMsg.includes('sai') || lowerMsg.includes('vui lòng')) type = 'error';
      else if (lowerTitle.includes('thành công') || lowerTitle.includes('hoàn thành') || lowerTitle.includes('chào mừng')) type = 'success';
      else if (lowerTitle.includes('cảnh báo') || lowerTitle.includes('xác nhận')) type = 'warning';
      
      const topListener = this.listeners[this.listeners.length - 1];
      topListener({ title, message, buttons, type });
    } else {
      // Fallback
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
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
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
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
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
  let bgIcon = `${colors.primary}15`;
  
  if (type === 'success') {
    iconName = 'checkmark-circle';
    iconColor = colors.success || '#2ECC71';
    bgIcon = '#E8F5E9';
  } else if (type === 'error') {
    iconName = 'close-circle';
    iconColor = colors.error || '#EF4444';
    bgIcon = '#FFEBEE';
  } else if (type === 'warning') {
    iconName = 'alert-circle';
    iconColor = '#F59E0B';
    bgIcon = '#FFF3E0';
  }

  const defaultButtons: AlertButton[] = [{ text: 'Đã hiểu', onPress: () => {} }];
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
              borderRadius: 30,
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim
            }
          ]}
        >
          <View style={[styles.iconWrapper, { backgroundColor: bgIcon }]}>
             <Ionicons name={iconName as any} size={50} color={iconColor} />
          </View>
          
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
          
          <View style={[styles.buttonRow, { flexDirection: activeButtons.length > 2 ? 'column' : 'row' }]}>
            {activeButtons.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              
              return (
                <TouchableOpacity 
                  key={index}
                  activeOpacity={0.8}
                  style={[
                    styles.button, 
                    { 
                      backgroundColor: isCancel ? colors.cardSecondary : (isDestructive ? colors.error : colors.primary),
                      flex: activeButtons.length <= 2 ? 1 : 0,
                      marginTop: activeButtons.length > 2 && index > 0 ? 10 : 0,
                      marginLeft: activeButtons.length <= 2 && index > 0 ? 10 : 0,
                      borderRadius: 18,
                    }
                  ]}
                  onPress={() => close(btn.onPress)}
                >
                  <Text style={[
                    styles.buttonText, 
                    { color: isCancel ? colors.text : '#FFF' }
                  ]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
    padding: 24,
  },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  alertBox: {
    width: '100%',
    maxWidth: 320,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  buttonRow: {
    width: '100%',
  },
  button: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default AlertManager;
