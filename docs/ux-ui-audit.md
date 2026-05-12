# UX/UI Audit - Appnauan (mobile)

## Scope
- Codebase: mobile app UI
- Date: 2026-05-10
- Muc tieu: kiem tra UX/UI, de xuat nang cap uu tien cao, va danh sach trang thieu (can xac nhan)
- Nguon: navigation va toan bo screen files

## Screen inventory (35)
Auth + Onboarding
- [mobile/src/screens/SplashScreen.tsx](mobile/src/screens/SplashScreen.tsx)
- [mobile/src/screens/TermsScreen.tsx](mobile/src/screens/TermsScreen.tsx)
- [mobile/src/screens/OnboardingScreen.tsx](mobile/src/screens/OnboardingScreen.tsx)
- [mobile/src/screens/AuthScreen.tsx](mobile/src/screens/AuthScreen.tsx)
- [mobile/src/screens/RegisterScreen.tsx](mobile/src/screens/RegisterScreen.tsx)
- [mobile/src/screens/ForgotPasswordScreen.tsx](mobile/src/screens/ForgotPasswordScreen.tsx)
- [mobile/src/screens/PermissionScreen.tsx](mobile/src/screens/PermissionScreen.tsx)

Main tabs
- [mobile/src/screens/HomeScreen.tsx](mobile/src/screens/HomeScreen.tsx)
- [mobile/src/screens/FavoritesScreen.tsx](mobile/src/screens/FavoritesScreen.tsx)
- [mobile/src/screens/CameraScreen.tsx](mobile/src/screens/CameraScreen.tsx)
- [mobile/src/screens/CommunityScreen.tsx](mobile/src/screens/CommunityScreen.tsx)
- [mobile/src/screens/ProfileScreen.tsx](mobile/src/screens/ProfileScreen.tsx)

Core flows
- [mobile/src/screens/IngredientInputScreen.tsx](mobile/src/screens/IngredientInputScreen.tsx)
- [mobile/src/screens/IngredientReviewScreen.tsx](mobile/src/screens/IngredientReviewScreen.tsx)
- [mobile/src/screens/ScanHistoryScreen.tsx](mobile/src/screens/ScanHistoryScreen.tsx)
- [mobile/src/screens/AIResultScreen.tsx](mobile/src/screens/AIResultScreen.tsx)
- [mobile/src/screens/RecipeCustomizeScreen.tsx](mobile/src/screens/RecipeCustomizeScreen.tsx)
- [mobile/src/screens/PrepChecklistScreen.tsx](mobile/src/screens/PrepChecklistScreen.tsx)
- [mobile/src/screens/CookingModeScreen.tsx](mobile/src/screens/CookingModeScreen.tsx)
- [mobile/src/screens/CookingCompleteScreen.tsx](mobile/src/screens/CookingCompleteScreen.tsx)
- [mobile/src/screens/CookingHistoryScreen.tsx](mobile/src/screens/CookingHistoryScreen.tsx)
- [mobile/src/screens/DishResultScreen.tsx](mobile/src/screens/DishResultScreen.tsx)
- [mobile/src/screens/MissingIngredientsScreen.tsx](mobile/src/screens/MissingIngredientsScreen.tsx)

Lists + planning
- [mobile/src/screens/ShoppingListScreen.tsx](mobile/src/screens/ShoppingListScreen.tsx)
- [mobile/src/screens/InventoryScreen.tsx](mobile/src/screens/InventoryScreen.tsx)
- [mobile/src/screens/MealPlannerScreen.tsx](mobile/src/screens/MealPlannerScreen.tsx)
- [mobile/src/screens/NutritionSummaryScreen.tsx](mobile/src/screens/NutritionSummaryScreen.tsx)
- [mobile/src/screens/NutritionDiaryScreen.tsx](mobile/src/screens/NutritionDiaryScreen.tsx)

Profile + settings
- [mobile/src/screens/EditProfileScreen.tsx](mobile/src/screens/EditProfileScreen.tsx)
- [mobile/src/screens/SettingsScreen.tsx](mobile/src/screens/SettingsScreen.tsx)
- [mobile/src/screens/NotificationsScreen.tsx](mobile/src/screens/NotificationsScreen.tsx)
- [mobile/src/screens/SupportScreen.tsx](mobile/src/screens/SupportScreen.tsx)
- [mobile/src/screens/HealthProfileScreen.tsx](mobile/src/screens/HealthProfileScreen.tsx)

Business + commerce
- [mobile/src/screens/ProUpgradeScreen.tsx](mobile/src/screens/ProUpgradeScreen.tsx)
- [mobile/src/screens/OnlineShoppingScreen.tsx](mobile/src/screens/OnlineShoppingScreen.tsx)

## Navigation map
- Root Stack + Tab navigator: [mobile/App.tsx](mobile/App.tsx)
- Tabs: Home, Favorites, Camera, Community, Profile
- Flow tong quan: Splash -> Terms -> Onboarding -> Auth/Register/Forgot -> Permission -> MainTabs -> (AI, Cooking, Inventory, Meal Planner, Profile, etc.)

## Uu tien cao: UX/UI can nang cap

### 1) Design system consistency
- Hardcoded colors xuat hien nhieu o screens. De xuat dua ve theme tokens (vi du: `colors.overlay`, `colors.warning`, `colors.achievement`).
  - Vi du files: [mobile/src/screens/AIResultScreen.tsx](mobile/src/screens/AIResultScreen.tsx), [mobile/src/screens/CameraScreen.tsx](mobile/src/screens/CameraScreen.tsx), [mobile/src/screens/CookingCompleteScreen.tsx](mobile/src/screens/CookingCompleteScreen.tsx), [mobile/src/screens/CookingHistoryScreen.tsx](mobile/src/screens/CookingHistoryScreen.tsx), [mobile/src/screens/HomeScreen.tsx](mobile/src/screens/HomeScreen.tsx), [mobile/src/screens/ProUpgradeScreen.tsx](mobile/src/screens/ProUpgradeScreen.tsx), [mobile/src/screens/CommunityScreen.tsx](mobile/src/screens/CommunityScreen.tsx)
- Custom alert dang dung hardcoded color cho warning/success/error. Nen doi sang theme tokens de dong bo mau va dark mode.
  - [mobile/src/components/CustomAlert.tsx](mobile/src/components/CustomAlert.tsx)
- Theme co san typography/spacing/borderRadius nhung chua du tokens semantic (overlay, badge, state). Nen bo sung trong [mobile/src/theme/theme.tsx](mobile/src/theme/theme.tsx)

### 2) Accessibility (a11y)
- Khong thay a11y props (accessibilityLabel/Role/Hint) trong screens. Nen them cho icon-only buttons, CTA, tab actions, modal close.
- Tang contrast cho text tren image/gradient, nhat la cac the co overlay.
- Bo sung focus order va `accessible` cho card co tap targets lon.

### 3) Performance / perceived speed
- Man hinh co list dai nen co skeleton/placeholder: Home, Community, AIResult, Favorites, Inventory, ShoppingList.
- Gioi han shadow/heavy blur; chuyen sang CSS layer nhe cho card lists.
- Anh: them cache, prefetch va placeholder cho ảnh mon an.

### 4) Onboarding / activation
- Onboarding + Permission + Auth la 3 buoc lien tiep: can giam ma sat (skip, gia tri loi ich, giai thich quyen camera).
- Neu user vao Camera lan dau: them quick tour (1-2 step) va nut "thu ngay".
- Tao "first success" flow ro: quet -> ingredient review -> AI result -> cooking start.

## Trang thieu / de xuat (can xac nhan voi PRD)
- Recipe search + filter (global search, tags, dietary filters)
- Recipe detail (non-AI) + share/save, neu can thu vien cong thuc
- Community post detail + create/edit post + comment/reaction
- Subscription management (billing, restore purchase, cancel) neu co Pro
- Account deletion + data export (legal/compliance)
- Privacy policy (Terms da co, can xac nhan Privacy)
- Offline/empty/error dedicated states (thay vi chi text thong bao)

## Quick wins (1-2 tuan)
- Them 8-12 theme tokens semantic (overlay, warning, successBg, badge, surfaceElevated)
- Thay hardcoded colors trong 5 screens nhieu nhat: AIResult, Camera, CookingComplete, CookingHistory, Home
- Them a11y label cho tat ca icon-only buttons va modal close
- Them EmptyState component cho Inventory/ShoppingList/Favorites neu chua dung

## Notes
- Danh sach "thieu trang" la de xuat do chua co PRD/roadmap. Neu co tai lieu, toi se doi chieu lai.
