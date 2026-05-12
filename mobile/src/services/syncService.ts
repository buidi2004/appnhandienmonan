import axios from 'axios';
import API_CONFIG from '../config/apiConfig';
import { auth } from '../config/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const syncService = {
  /**
   * Đồng bộ nhật ký dinh dưỡng lên server
   */
  async syncNutrition(goalData: any) {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      
      await axios.post(`${API_CONFIG.BASE_URL}/api/user/sync-nutrition`, goalData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('[SYNC] Nutrition synced to cloud');
    } catch (e) {
      console.error('[SYNC] Nutrition sync failed:', e);
    }
  },

  /**
   * Đồng bộ hồ sơ sức khỏe lên server
   */
  async syncHealthProfile(profile: any) {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      
      await axios.post(`${API_CONFIG.BASE_URL}/api/user/sync-health`, profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('[SYNC] Health profile synced to cloud');
    } catch (e) {
      console.error('[SYNC] Health sync failed:', e);
    }
  },

  /**
   * Đồng bộ lịch sử nấu ăn lên server
   */
  async syncCookingHistory(history: any) {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      
      await axios.post(`${API_CONFIG.BASE_URL}/api/user/sync-history`, history, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('[SYNC] Cooking history synced to cloud');
    } catch (e) {
      console.error('[SYNC] History sync failed:', e);
    }
  },

  /**
   * Đồng bộ tủ lạnh (inventory)
   */
  async syncInventory(items: any) {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      await axios.post(`${API_CONFIG.BASE_URL}/api/user/sync-inventory`, items, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('[SYNC] Inventory synced to cloud');
    } catch (e) {
      console.error('[SYNC] Inventory sync failed:', e);
    }
  },

  /**
   * Đồng bộ danh sách mua sắm
   */
  async syncShoppingList(items: any) {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      await axios.post(`${API_CONFIG.BASE_URL}/api/user/sync-shopping`, items, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('[SYNC] Shopping list synced to cloud');
    } catch (e) {
      console.error('[SYNC] Shopping list sync failed:', e);
    }
  },

  /**
   * Đồng bộ kế hoạch bữa ăn
   */
  async syncMealPlan(plan: any) {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      await axios.post(`${API_CONFIG.BASE_URL}/api/user/sync-mealplan`, plan, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('[SYNC] Meal plan synced to cloud');
    } catch (e) {
      console.error('[SYNC] Meal plan sync failed:', e);
    }
  },

  /**
   * Đồng bộ hồ sơ người dùng
   */
  async syncProfile(profile: any) {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      await axios.post(`${API_CONFIG.BASE_URL}/api/user/sync-profile`, profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('[SYNC] Profile synced to cloud');
    } catch (e) {
      console.error('[SYNC] Profile sync failed:', e);
    }
  },

  /**
   * Đồng bộ lịch sử quét
   */
  async syncScanHistory(history: any) {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();

      await axios.post(`${API_CONFIG.BASE_URL}/api/user/sync-scan-history`, history, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('[SYNC] Scan history synced to cloud');
    } catch (e) {
      console.error('[SYNC] Scan history sync failed:', e);
    }
  },

  /**
   * Khôi phục toàn bộ dữ liệu từ Cloud về Local
   */
  async restoreAllData() {
    try {
      const user = auth.currentUser;
      if (!user) return null;
      const token = await user.getIdToken();
      
      const response = await axios.get(`${API_CONFIG.BASE_URL}/api/user/data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const { nutrition, health, history, inventory, shopping, mealPlan, profile, scanHistory } = response.data;
      
      if (nutrition) await AsyncStorage.setItem('nutritionGoal', JSON.stringify(nutrition));
      if (health) await AsyncStorage.setItem('healthProfile', JSON.stringify(health));
      if (history) await AsyncStorage.setItem('cookingHistory', JSON.stringify(history));
      if (inventory) await AsyncStorage.setItem('inventory', JSON.stringify(inventory));
      if (shopping) await AsyncStorage.setItem('shoppingList', JSON.stringify(shopping));
      if (mealPlan) await AsyncStorage.setItem('mealPlan', JSON.stringify(mealPlan));
      if (scanHistory) await AsyncStorage.setItem('scanHistory', JSON.stringify(scanHistory));
      if (profile) {
        if (profile.avatar) await AsyncStorage.setItem('userAvatar', profile.avatar);
        if (profile.name) await AsyncStorage.setItem('userName', profile.name);
        if (profile.bio) await AsyncStorage.setItem('userBio', profile.bio);
        if (profile.email) await AsyncStorage.setItem('userEmail', profile.email);
      }
      
      return response.data;
    } catch (e) {
      console.error('[SYNC] Restore failed:', e);
      return null;
    }
  }
};
