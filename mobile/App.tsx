import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { LogBox, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
  fabShadow: {
    shadowColor: '#F09035',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  }
});

// Ẩn cảnh báo về Push Notifications trên Expo Go SDK 53 (đây là cảnh báo hệ thống, không phải lỗi code)
LogBox.ignoreLogs(['expo-notifications: Android Push notifications']);
// Screens
import SplashScreen from './src/screens/SplashScreen';
import AuthScreen from './src/screens/AuthScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import PermissionScreen from './src/screens/PermissionScreen';
import HomeScreen from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AIResultScreen from './src/screens/AIResultScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import SupportScreen from './src/screens/SupportScreen';
import TermsScreen from './src/screens/TermsScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import ShoppingListScreen from './src/screens/ShoppingListScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import MealPlannerScreen from './src/screens/MealPlannerScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import CookingModeScreen from './src/screens/CookingModeScreen';
import HealthProfileScreen from './src/screens/HealthProfileScreen';
import CookingHistoryScreen from './src/screens/CookingHistoryScreen';
import ProUpgradeScreen from './src/screens/ProUpgradeScreen';
import NutritionDiaryScreen from './src/screens/NutritionDiaryScreen';
import OnlineShoppingScreen from './src/screens/OnlineShoppingScreen';
import CookingCompleteScreen from './src/screens/CookingCompleteScreen';
import IngredientInputScreen from './src/screens/IngredientInputScreen';
import IngredientReviewScreen from './src/screens/IngredientReviewScreen';
import PrepChecklistScreen from './src/screens/PrepChecklistScreen';

import { ThemeProvider, useAppTheme, typography } from './src/theme/theme';
import { requestNotificationPermissions, scheduleDailyNotifications } from './src/services/notificationService';
import AlertManager, { CustomAlert } from './src/components/CustomAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Permission: undefined;
  MainTabs: undefined;
  AIResult: { imageUri?: string; initialIngredients?: string[]; initialRecipe?: any };
  EditProfile: undefined;
  Settings: undefined;
  Notifications: undefined;
  Support: undefined;
  Terms: undefined;
  Onboarding: undefined;
  ShoppingList: undefined;
  Inventory: undefined;
  MealPlanner: undefined;
  Community: undefined;
  CookingMode: { steps: string[]; dishName: string; ingredients?: string[]; tips?: string };
  HealthProfile: undefined;
  CookingHistory: undefined;
  ProUpgrade: undefined;
  NutritionDiary: undefined;
  OnlineShopping: undefined;
  CookingComplete: { dishName: string; totalSteps: number; cookingTime: number; photosCount: number };
  IngredientInput: undefined;
  IngredientReview: { imageUri?: string; detectedIngredients: string[] };
  PrepChecklist: { steps: string[]; dishName: string; ingredients?: string[]; tips?: string };
};

export type TabParamList = {
  Home: undefined;
  Favorites: undefined;
  Camera: undefined;
  Community: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabNavigator() {
  const { colors, isDark } = useAppTheme();

  return (
    <Tab.Navigator
      id="MainTabs"
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTitleStyle: {
          fontFamily: 'Poppins_600SemiBold',
          fontSize: 20,
          color: colors.text,
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Camera') {
            iconName = focused ? 'camera' : 'camera-outline';
          } else if (route.name === 'Favorites') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Community') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={26} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 5,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarLabelStyle: {
          fontFamily: 'Poppins_400Regular',
          fontSize: 11,
          marginTop: 2,
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Trang chủ', headerShown: false }} 
      />
      <Tab.Screen 
        name="Favorites" 
        component={FavoritesScreen} 
        options={{ title: 'Yêu thích', headerShown: false }}
      />
      <Tab.Screen 
        name="Camera" 
        component={CameraScreen} 
        options={{ 
          title: 'Quét',
          tabBarStyle: { display: 'none' },
          tabBarIcon: () => null,
          tabBarButton: (props: any) => (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={props.onPress}
              style={{
                top: -15,
                justifyContent: 'center',
                alignItems: 'center',
                ...styles.fabShadow
              }}
            >
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Ionicons name="camera" size={28} color="#FFF" />
              </View>
            </TouchableOpacity>
          )
        }}
      />
      <Tab.Screen 
        name="Community" 
        component={CommunityScreen} 
        options={{ title: 'Cộng đồng', headerShown: false }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Cá nhân', headerShown: false }}
      />
    </Tab.Navigator>
  );
}

function MainApp() {
  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const { isDark, colors } = useAppTheme();

  useEffect(() => {
    async function setupNotifications() {
      const hasPermission = await requestNotificationPermissions();
      if (hasPermission) {
        const isEnabled = await AsyncStorage.getItem('notificationsEnabled');
        if (isEnabled !== 'false') { // Mặc định là true nếu chưa set
          await scheduleDailyNotifications();
        }
      }
    }
    setupNotifications();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Stack.Navigator 
          id="RootStack"
          initialRouteName="Splash"
          screenOptions={{ 
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Terms" component={TermsScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="Permission" component={PermissionScreen} />
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen 
            name="AIResult" 
            component={AIResultScreen} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: true, title: 'Chỉnh sửa hồ sơ', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true, title: 'Cài đặt chung', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: true, title: 'Thông báo', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
          <Stack.Screen name="Support" component={SupportScreen} options={{ headerShown: true, title: 'Trung tâm hỗ trợ', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
          <Stack.Screen name="ShoppingList" component={ShoppingListScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Inventory" component={InventoryScreen} options={{ headerShown: false }} />
          <Stack.Screen name="MealPlanner" component={MealPlannerScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Community" component={CommunityScreen} />
          <Stack.Screen name="CookingMode" component={CookingModeScreen} options={{ headerShown: false, presentation: 'fullScreenModal' }} />
          <Stack.Screen name="HealthProfile" component={HealthProfileScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CookingHistory" component={CookingHistoryScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ProUpgrade" component={ProUpgradeScreen} options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="NutritionDiary" component={NutritionDiaryScreen} options={{ headerShown: false }} />
          <Stack.Screen name="OnlineShopping" component={OnlineShoppingScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CookingComplete" component={CookingCompleteScreen} options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="IngredientInput" component={IngredientInputScreen} options={{ headerShown: false }} />
          <Stack.Screen name="IngredientReview" component={IngredientReviewScreen} options={{ headerShown: false }} />
          <Stack.Screen name="PrepChecklist" component={PrepChecklistScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
      <CustomAlert />
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}
