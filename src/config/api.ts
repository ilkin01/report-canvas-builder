// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://inframedlife-apigateway-cudnbsd4h5f6czdx.germanywestcentral-01.azurewebsites.net/api',
  ENDPOINTS: {
    LOGIN: '/HospitalLab/LoginHospitalLab', // Orijinal endpoint
    // Alternativ endpoint-lər
    // LOGIN: '/api/HospitalLab/LoginHospitalLab',
    // LOGIN: '/HospitalLab/Login',
    // Gələcəkdə əlavə endpoint-lər burada əlavə oluna bilər
    // REPORTS: '/reports',
    // TEMPLATES: '/templates',
    // etc.
  }
} as const;

// Helper function to build full API URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}; 