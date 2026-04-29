/**
 * Cấu hình địa chỉ API cho toàn bộ ứng dụng.
 * Khi chạy local: dùng IP máy tính (ví dụ: http://192.168.1.3:5000)
 * Khi deploy: dùng link Render (ví dụ: https://app-nau-an-backend.onrender.com)
 */
const API_CONFIG = {
  // Thay link này sau khi bạn deploy lên Render thành công
  BASE_URL: 'https://appnhandienmonan.onrender.com', 
  
  ENDPOINTS: {
    HEALTH: '/api/health',
    SCAN_INGREDIENTS: '/api/scan-ingredients',
    SUGGEST_RECIPES: '/api/suggest-recipes',
    SCAN_AND_SUGGEST: '/api/scan-and-suggest',
    IDENTIFY_DISH: '/api/identify-dish',
  }
};

export default API_CONFIG;
