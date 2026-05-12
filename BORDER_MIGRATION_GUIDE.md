# 🔄 BORDER MIGRATION GUIDE

## 📚 Hướng dẫn sử dụng Border Design Tokens

### ✅ **Phase 1 HOÀN THÀNH**

Đã tạo thành công:
- ✅ `src/theme/borders.ts` - Border design tokens
- ✅ Export từ `src/theme/index.ts`
- ✅ TypeScript types đầy đủ

---

## 🎯 CÁCH SỬ DỤNG

### 1. Import Tokens

```typescript
// Import individual tokens
import { borderWidth, borderRadius, borderColors, borderPresets } from '../theme';

// Hoặc import tất cả
import { borders } from '../theme';
```

### 2. Sử dụng trong StyleSheet

#### ❌ **TRƯỚC ĐÂY** (Không đồng nhất)
```typescript
const styles = StyleSheet.create({
  card: {
    borderWidth: 0.5,
    borderColor: 'rgba(200,150,255,0.25)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.14)',
    borderRadius: 20,
  },
  button: {
    borderWidth: 1,
    borderColor: 'rgba(180,100,255,0.22)',
    borderRadius: 12,
  },
});
```

#### ✅ **SAU KHI FIX** (Đồng nhất, dễ maintain)
```typescript
import { borderWidth, borderRadius, borderColors, borderPresets } from '../theme';

const styles = StyleSheet.create({
  // Cách 1: Sử dụng tokens riêng lẻ
  card: {
    borderWidth: borderWidth.thin,
    borderColor: borderColors.purple.normal,
    borderTopWidth: borderWidth.normal,
    borderTopColor: borderColors.white.strong,
    borderRadius: borderRadius.xl,
  },
  
  // Cách 2: Sử dụng presets (KHUYẾN KHÍCH)
  button: {
    ...borderPresets.button,
  },
  
  // Cách 3: Kết hợp preset + override
  specialCard: {
    ...borderPresets.card,
    borderRadius: borderRadius['2xl'], // Override radius
  },
});
```

---

## 📖 REFERENCE NHANH

### Border Width
```typescript
borderWidth.none    // 0
borderWidth.thin    // 0.5  - Cards, dividers
borderWidth.normal  // 1    - Inputs, checkboxes
borderWidth.thick   // 1.5  - Selected states
borderWidth.heavy   // 2    - Avatars, radio
borderWidth.ultra   // 3    - Extra emphasis
```

### Border Radius
```typescript
borderRadius.none   // 0
borderRadius.xs     // 6    - Checkboxes
borderRadius.sm     // 8    - Small badges
borderRadius.md     // 12   - Buttons, inputs
borderRadius.lg     // 16   - Medium cards
borderRadius.xl     // 20   - Large cards
borderRadius['2xl'] // 24   - XL cards
borderRadius['3xl'] // 28   - Modals
borderRadius['4xl'] // 32   - Hero cards
borderRadius.full   // 9999 - Circles
```

### Border Colors - Purple
```typescript
borderColors.purple.subtle  // rgba(180,100,255,0.18)
borderColors.purple.light   // rgba(180,100,255,0.22)
borderColors.purple.normal  // rgba(200,150,255,0.25)
borderColors.purple.medium  // rgba(168,85,247,0.35)
borderColors.purple.strong  // rgba(168,85,247,0.45)
borderColors.purple.heavy   // rgba(168,85,247,0.5)
```

### Border Colors - White
```typescript
borderColors.white.subtle   // rgba(255,255,255,0.05)
borderColors.white.light    // rgba(255,255,255,0.08)
borderColors.white.normal   // rgba(255,255,255,0.1)
borderColors.white.medium   // rgba(255,255,255,0.12)
borderColors.white.strong   // rgba(255,255,255,0.14)
borderColors.white.heavy    // rgba(255,255,255,0.15)
```

### Border Presets (KHUYẾN KHÍCH)
```typescript
borderPresets.card          // Standard card
borderPresets.cardPurple    // Purple accent card
borderPresets.cardSubtle    // Subtle card
borderPresets.input         // Input field
borderPresets.inputFocused  // Focused input
borderPresets.button        // Button
borderPresets.buttonPrimary // Primary button
borderPresets.chip          // Chip/tag
borderPresets.chipActive    // Active chip
borderPresets.badge         // Badge
borderPresets.divider       // Divider line
borderPresets.avatar        // Avatar border
borderPresets.checkbox      // Checkbox
borderPresets.radio         // Radio button
borderPresets.modal         // Modal
borderPresets.bottomSheet   // Bottom sheet
```

---

## 🔄 MIGRATION CHECKLIST

### Priority 1 - Core Screens (30 phút) ✅ COMPLETED
- [x] AIResultScreen.tsx
- [x] CookingModeScreen.tsx
- [x] HomeScreen.tsx
- [x] ProfileScreen.tsx

### Priority 2 - Feature Screens (45 phút)
- [ ] PrepChecklistScreen.tsx
- [ ] CookingCompleteScreen.tsx
- [ ] FavoritesScreen.tsx
- [ ] MealPlannerScreen.tsx

### Priority 3 - Secondary Screens (45 phút)
- [ ] SettingsScreen.tsx
- [ ] ProUpgradeScreen.tsx
- [ ] NutritionDiaryScreen.tsx
- [ ] CommunityScreen.tsx

### Priority 4 - Utility Screens (30 phút)
- [ ] AuthScreen.tsx
- [ ] RegisterScreen.tsx
- [ ] SupportScreen.tsx
- [ ] Remaining screens

---

## 🎨 MIGRATION PATTERNS

### Pattern 1: Simple Card
```typescript
// BEFORE
{
  borderWidth: 0.5,
  borderColor: 'rgba(200,150,255,0.25)',
  borderRadius: 20,
}

// AFTER
{
  ...borderPresets.card,
}
```

### Pattern 2: Input Field
```typescript
// BEFORE
{
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.12)',
  borderRadius: 12,
}

// AFTER
{
  ...borderPresets.input,
}
```

### Pattern 3: Active/Selected State
```typescript
// BEFORE
{
  borderWidth: 1.5,
  borderColor: 'rgba(168,85,247,0.45)',
  borderRadius: 16,
}

// AFTER
{
  borderWidth: borderWidth.thick,
  borderColor: borderColors.purple.strong,
  borderRadius: borderRadius.lg,
}
```

### Pattern 4: Divider
```typescript
// BEFORE
{
  borderBottomWidth: 0.5,
  borderBottomColor: 'rgba(180,100,255,0.1)',
}

// AFTER
{
  ...borderPresets.divider,
}
```

---

## 🚀 NEXT STEPS

1. **Bắt đầu với Priority 1** - Core screens (AIResultScreen, CookingModeScreen, HomeScreen, ProfileScreen)
2. **Test visual** sau mỗi screen
3. **Commit changes** theo từng priority group
4. **Move to Priority 2** khi Priority 1 hoàn thành

---

## 💡 TIPS

1. **Sử dụng Find & Replace** để tăng tốc:
   - Find: `borderWidth: 0.5`
   - Replace: `borderWidth: borderWidth.thin`

2. **Ưu tiên borderPresets** thay vì tokens riêng lẻ

3. **Test trên cả iOS và Android** sau khi migrate

4. **Giữ nguyên logic**, chỉ thay đổi visual values

---

**Status**: ✅ Phase 1 Complete | ✅ Priority 1 Complete - Ready for Priority 2  
**Next**: Migrate Priority 2 screens (PrepChecklistScreen, CookingCompleteScreen, FavoritesScreen, MealPlannerScreen)
