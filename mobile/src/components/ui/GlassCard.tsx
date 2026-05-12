import React from 'react'
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native'
import { BlurView } from 'expo-blur'
import { glass } from '../../theme'

type GlassVariant = 'default' | 'purple' | 'pink' | 'modal' | 'input' | 'chip'

interface GlassCardProps {
  children: React.ReactNode
  variant?: GlassVariant
  style?: StyleProp<ViewStyle>
  intensity?: number
  borderRadius?: number
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  style,
  intensity,
  borderRadius,
}) => {
  const preset = {
    default: glass.card,
    purple: glass.cardPurple,
    pink: glass.cardPink,
    modal: glass.modal,
    input: glass.input,
    chip: glass.chip,
  }[variant]

  const blurIntensity = intensity ?? preset.intensity
  const br = borderRadius ?? preset.borderRadius ?? 20

  return (
    <View
      style={[
        styles.wrapper,
        {
          borderRadius: br,
          borderColor: preset.borderColor,
          borderWidth: preset.borderWidth,
        },
        style,
      ]}
    >
      <BlurView
        intensity={blurIntensity}
        tint="dark"
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: br, overflow: 'hidden' },
        ]}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: preset.backgroundColor, borderRadius: br },
        ]}
      />
      <View style={{ position: 'relative', zIndex: 2 }}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    position: 'relative',
  },
})

export default GlassCard
