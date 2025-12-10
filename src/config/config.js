// Configuration file for API and app settings
// Update the API_BASE_URL when your Laravel backend is ready

export const API_CONFIG = {
  // ⚠️ UPDATE THIS WITH YOUR LARAVEL BACKEND URL
  // For Android Emulator: 'http://10.0.2.2:8000/api/v1' 
  // For Physical Device: 'http://192.168.1.169:8000/api/v1'
  // For production: 'https://yourdomain.com/api/v1'
  API_BASE_URL: 'https://preeternal-ungraded-jere.ngrok-free.dev/api/v1',
  
  // Polling interval for order status updates (in milliseconds)
  POLLING_INTERVAL: 10000, // 10 seconds
  
  // Request timeout
  REQUEST_TIMEOUT: 30000, // 30 seconds
  
  // API Endpoints
  ENDPOINTS: {
    // Auth endpoints
    AUTH: {
      REGISTER: '/auth/register',
      LOGIN: '/auth/login',
      LOGOUT: '/auth/logout',
      REFRESH_TOKEN: '/auth/refresh-token',
      GET_USER: '/auth/user',
    },
    
    // Products endpoints
    PRODUCTS: {
      LIST: '/products',
      GET: '/products/:id',
      SEARCH: '/products/search',
    },
    
    // Cart/Order endpoints
    ORDERS: {
      CREATE: '/orders',
      LIST: '/orders',
      GET: '/orders/:id',
      UPDATE: '/orders/:id',
      CANCEL: '/orders/:id/cancel',
      STATUS: '/orders/:id/status',
    },
    
    // Payment endpoints
    PAYMENT: {
      UPLOAD_PROOF: '/payments/upload-proof',
      VERIFY: '/payments/verify',
      STATUS: '/payments/:orderId/status',
    },
    
    // User endpoints
    USER: {
      GET_PROFILE: '/user/profile',
      UPDATE_PROFILE: '/user/profile',
      GET_ADDRESSES: '/user/addresses',
      CREATE_ADDRESS: '/user/addresses',
      UPDATE_ADDRESS: '/user/addresses/:id',
      DELETE_ADDRESS: '/user/addresses/:id',
    },
  },
};

export default API_CONFIG;
