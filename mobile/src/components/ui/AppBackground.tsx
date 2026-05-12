import React from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

const { width, height } = Dimensions.get('window')

export const AppBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <View style={styles.container}>
      {/* Gradient nền chính */}
      <LinearGradient
        colors={['#0D0D1A', '#12102A', '#0D0D1A']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Blob tím trên trái */}
      <View style={[styles.blob, styles.blobTopLeft]} />

      {/* Blob hồng dưới phải */}
      <View style={[styles.blob, styles.blobBottomRight]} />

      {/* Blob tím nhỏ giữa */}
      <View style={[styles.blob, styles.blobMid]} />

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  blob: {
    position: 'absolute',
    borderRadius: 9999,
    opacity: 0.45,
  },
  blobTopLeft: {
    width: width * 0.7,
    height: width * 0.7,
    backgroundColor: '#5C2EE8',
    top: -width * 0.25,
    left: -width * 0.25,
    // Blur blob bằng cách dùng nhiều lớp opacity
    opacity: 0.30,
  },
  blobBottomRight: {
    width: width * 0.6,
    height: width * 0.6,
    backgroundColor: '#FF6584',
    bottom: height * 0.05,
    right: -width * 0.20,
    opacity: 0.20,
  },
  blobMid: {
    width: width * 0.4,
    height: width * 0.4,
    backgroundColor: '#7C4DFF',
    top: height * 0.35,
    left: width * 0.55,
    opacity: 0.18,
  },
  content: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
})

export default AppBackground
