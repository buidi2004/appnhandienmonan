import AsyncStorage from '@react-native-async-storage/async-storage';

export const aiPantryService = {
  /**
   * So sánh danh sách nguyên liệu của công thức với thực phẩm hiện có trong Pantry.
   * Trả về danh sách những nguyên liệu thực sự còn thiếu.
   */
  getMissingIngredients: async (recipeIngredients: string[]) => {
    try {
      const pantryData = await AsyncStorage.getItem('inventory');
      const pantryItems = pantryData ? JSON.parse(pantryData) : [];
      
      const pantryNames = pantryItems.map((item: any) => item.name.toLowerCase().trim());
      
      const missing = recipeIngredients.filter(ing => {
        const normalizedIng = ing.toLowerCase().trim();
        // Kiểm tra xem có nguyên liệu nào trong pantry khớp hoặc nằm trong tên nguyên liệu công thức không
        return !pantryNames.some((pName: string) => 
          normalizedIng.includes(pName) || pName.includes(normalizedIng)
        );
      });
      
      return missing;
    } catch (error) {
      console.error('Error in aiPantryService:', error);
      return recipeIngredients; // Fallback: coi như thiếu hết nếu lỗi
    }
  },

  /**
   * Gợi ý mua sắm thông minh: Tự động thêm vào Shopping List những thứ thiếu.
   */
  addSmartShoppingList: async (recipeTitle: string, ingredients: string[]) => {
    const missing = await aiPantryService.getMissingIngredients(ingredients);
    if (missing.length === 0) return 0;

    const stored = await AsyncStorage.getItem('shoppingList');
    const currentList = stored ? JSON.parse(stored) : [];
    
    const newItems = missing.map(name => ({
      id: Math.random().toString(36).substr(2, 9),
      name,
      checked: false,
      recipeTitle
    }));

    const updated = [...currentList, ...newItems];
    await AsyncStorage.setItem('shoppingList', JSON.stringify(updated));
    return missing.length;
  }
};
