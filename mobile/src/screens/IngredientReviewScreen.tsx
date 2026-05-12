import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, TextInput, Dimensions, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AlertManager from '../components/CustomAlert';
import { themeColors, gradients, glass, glow } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'IngredientReview'>;
const { width } = Dimensions.get('window');

export default function IngredientReviewScreen({ route, navigation }: Props) {
  const { colors, typography } = useAppTheme();
  const { imageUri, detectedIngredients } = route.params;
  const [ingredients, setIngredients] = useState<string[]>(detectedIngredients);
  const [addingNew, setAddingNew] = useState(false);
  const [newIngredient, setNewIngredient] = useState('');

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const addIngredient = () => {
    const trimmed = newIngredient.trim();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients([...ingredients, trimmed]);
      setNewIngredient('');
      setAddingNew(false);
      Keyboard.dismiss();
    }
  };

  const handleContinue = () => {
    if (ingredients.length === 0) {
      AlertManager.alert(
        'Thiếu nguyên liệu',
        'Vui lòng chọn ít nhất một nguyên liệu để AI có thể gợi ý món ăn cho bạn.'
      );
      return;
    }
    navigation.replace('AIResult', { imageUri, initialIngredients: ingredients });
  };

  const handleRescan = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bgPrimary }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={[styles.backBtn, { ...glass.card, backgroundColor: themeColors.bgCard }]}>
          <Ionicons name="arrow-back" size={20} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity activeOpacity={0.7} onPress={handleRescan} style={[styles.backBtn, { ...glass.card, backgroundColor: themeColors.bgCard }]}>
          <Ionicons name="camera-outline" size={20} color={themeColors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Title */}
        <Text style={[styles.screenTitle, { color: themeColors.textPrimary }]}>Xác nhận{'\n'}nguyên liệu</Text>
        <Text style={[styles.screenSubtitle, { color: themeColors.textSecondary }]}>
          Kiểm tra kết quả AI nhận diện, thêm hoặc xóa nếu cần
        </Text>

        {/* Image Preview */}
        {imageUri && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            <View style={[styles.imageOverlay]}>
              <View style={[styles.scanBadge, { backgroundColor: 'rgba(52, 199, 89, 0.9)' }]}>
                <Ionicons name="checkmark-circle" size={14} color="#FFF" />
                <Text style={styles.scanBadgeText}>Đã quét</Text>
              </View>
            </View>
          </View>
        )}

        {/* Detection Summary */}
        <View style={[styles.summaryCard, { backgroundColor: `${themeColors.purple}08` }]}>
          <Ionicons name="scan-outline" size={18} color={themeColors.purple} />
          <Text style={[styles.summaryText, { color: themeColors.textPrimary }]}>
            Phát hiện <Text style={{ fontWeight: '800', color: themeColors.purple }}>{ingredients.length}</Text> nguyên liệu
          </Text>
        </View>

        {/* Ingredient List */}
        <View style={styles.ingredientList}>
          {ingredients.map((item, index) => (
            <View key={index} style={[styles.ingredientRow, { ...glass.card, backgroundColor: themeColors.bgCard }]}>
              <View style={[styles.ingredientDot, { backgroundColor: '#43E97B' }]} />
              <Text style={[styles.ingredientName, { color: themeColors.textPrimary }]}>{item}</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => removeIngredient(index)} style={styles.removeBtn}>
                <Ionicons name="close-circle" size={22} color={`${themeColors.textSecondary}60`} />
              </TouchableOpacity>
            </View>
          ))}

          {/* Add New */}
          {addingNew ? (
            <View style={[styles.addInputRow, { ...glass.card, backgroundColor: themeColors.bgCard, borderColor: themeColors.purple }]}>
              <TextInput
                style={[styles.addInput, { color: themeColors.textPrimary }]}
                placeholder="Nhập tên nguyên liệu..."
                placeholderTextColor={`${themeColors.textSecondary}80`}
                value={newIngredient}
                onChangeText={setNewIngredient}
                onSubmitEditing={addIngredient}
                autoFocus
                returnKeyType="done"
              />
              <TouchableOpacity activeOpacity={0.7} onPress={addIngredient} style={[styles.confirmAddBtn, { backgroundColor: themeColors.purple }]}>
                <Ionicons name="checkmark" size={18} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} onPress={() => { setAddingNew(false); setNewIngredient(''); }}>
                <Ionicons name="close" size={22} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.addNewBtn, { borderColor: `${themeColors.purple}40` }]}
              onPress={() => setAddingNew(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color={themeColors.purple} />
              <Text style={[styles.addNewText, { color: themeColors.purple }]}>Thêm nguyên liệu</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tips */}
        <View style={[styles.tipBox, { backgroundColor: `${themeColors.purple}08` }]}>
          <Ionicons name="bulb-outline" size={16} color={themeColors.purple} />
          <Text style={[styles.tipText, { color: themeColors.textSecondary }]}>
            Thêm gia vị (muối, tiêu, nước mắm...) để AI gợi ý chính xác hơn
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { backgroundColor: themeColors.bgPrimary }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleContinue}
          disabled={ingredients.length === 0}
        >
          <LinearGradient
            colors={ingredients.length > 0 ? gradients.button : ['#555', '#444']}
            style={{ ...glow.button, ...styles.continueBtn }}
          >
            <Text style={styles.continueBtnText}>Tìm công thức phù hợp</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  backBtn: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20 },
  screenTitle: { fontSize: 32, fontWeight: '800', lineHeight: 40, marginTop: 16, letterSpacing: -0.5 },
  screenSubtitle: { fontSize: 14, marginTop: 6, marginBottom: 24, lineHeight: 22 },

  // Image
  imagePreview: { borderRadius: 20, overflow: 'hidden', marginBottom: 20, height: 180 },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageOverlay: { position: 'absolute', top: 12, right: 12 },
  scanBadge: { 
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  scanBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  // Summary
  summaryCard: { 
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 14, marginBottom: 20,
  },
  summaryText: { fontSize: 15, fontWeight: '500' },

  // Ingredients
  ingredientList: { gap: 8, marginBottom: 20 },
  ingredientRow: { 
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14,
  },
  ingredientDot: { width: 8, height: 8, borderRadius: 4, marginRight: 14 },
  ingredientName: { flex: 1, fontSize: 16, fontWeight: '600' },
  removeBtn: { padding: 4 },

  // Add new
  addInputRow: { 
    flexDirection: 'row', alignItems: 'center', padding: 10, paddingLeft: 16, borderRadius: 14, borderWidth: 1.5, gap: 8,
  },
  addInput: { flex: 1, fontSize: 15, paddingVertical: 6 },
  confirmAddBtn: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  addNewBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14,
    borderWidth: 1.5, borderStyle: 'dashed',
  },
  addNewText: { fontSize: 15, fontWeight: '600' },

  // Tip
  tipBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 14 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 20 },

  // Bottom
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 34 },
  continueBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 6,
  },
  continueBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
