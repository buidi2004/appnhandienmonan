import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { themeColors, gradients } from '../theme';
import { glass } from '../theme/glass';
import { glow } from '../theme/glow';
import { borderWidth, borderRadius, borderColors, borderPresets } from '../theme/borders';

const RecipeDetailScreen = ({ route, navigation }: any) => {
  const recipe = route.params?.recipe || {
    title: 'Phở Bò Gia Truyền',
    image: '',
    time: '45 phút',
    calories: '450 kcal',
    difficulty: 'Khó',
    ingredients: ['500g Bánh phở', '300g Thịt bò thăn', '1.5L Nước dùng xương', 'Gừng, hành tím, thảo quả', 'Rau thơm, giá đỗ'],
    instructions: [
      'Nấu nước dùng: Ninh xương ống cùng gừng và hành tím nướng thơm trong ít nhất 4 tiếng.',
      'Sơ chế thịt bò: Thái thịt bò mỏng, trần sơ qua nước sôi hoặc dùng tái tùy sở thích.',
      'Chuẩn bị bánh phở: Chần bánh phở qua nước sôi rồi cho vào bát.',
      'Hoàn thiện: Xếp thịt bò lên bánh phở, rắc hành lá và chan nước dùng nóng hổi.'
    ]
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroWrapper}>
          {recipe.image ? (
            <Image source={{ uri: recipe.image }} style={styles.heroImage} />
          ) : (
            <LinearGradient
              colors={['#534AB7', '#1A0B3B']}
              style={styles.heroImage}
            >
              <Ionicons name="restaurant-outline" size={48} color="rgba(224, 222, 255, 0.4)" />
            </LinearGradient>
          )}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{recipe.title}</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.badgeContainer}
          >
            <View style={styles.badge}>
              <Ionicons name="time-outline" size={16} color="#A89FFF" />
              <Text style={styles.badgeText}>{recipe.time}</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="flame-outline" size={16} color="#A89FFF" />
              <Text style={styles.badgeText}>{recipe.calories}</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="speedometer-outline" size={16} color="#A89FFF" />
              <Text style={styles.badgeText}>{recipe.difficulty}</Text>
            </View>
          </ScrollView>

          {/* Ingredients Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Nguyên liệu</Text>
            {recipe.ingredients.map((item: string, idx: number) => (
              <View key={idx} style={styles.ingredientRow}>
                <View style={styles.dot} />
                <Text style={styles.ingredientText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Instructions Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Cách nấu</Text>
            {recipe.instructions.map((step: string, idx: number) => (
              <View key={idx} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{idx + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Start Cooking CTA */}
      <SafeAreaView style={styles.footer}>
        <TouchableOpacity 
          style={styles.startBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('CookingMode', { recipe })}
        >
          <Text style={styles.startBtnText}>Bắt đầu nấu ngay</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0B3B',
  },
  heroWrapper: {
    height: 220,
    width: '100%',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  title: {
    fontFamily: 'System',
    fontSize: 24,
    fontWeight: '800',
    color: '#E0DEFF',
    marginBottom: 16,
  },
  badgeContainer: {
    gap: 8,
    marginBottom: 24,
  },
  badge: {
    ...borderPresets.chip,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  badgeText: {
    fontFamily: 'System',
    color: '#E0DEFF',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionCard: {
    ...borderPresets.cardPurple,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '700',
    color: '#7F77DD',
    marginBottom: 16,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7F77DD',
    marginRight: 12,
  },
  ingredientText: {
    fontFamily: 'System',
    fontSize: 15,
    color: '#E0DEFF',
    lineHeight: 24,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#7F77DD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontFamily: 'System',
    fontSize: 15,
    color: '#E0DEFF',
    lineHeight: 24,
  },
  footer: {
    padding: 20,
    backgroundColor: '#1A0B3B',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  startBtn: {
    backgroundColor: '#7F77DD',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7F77DD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  startBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default RecipeDetailScreen;
