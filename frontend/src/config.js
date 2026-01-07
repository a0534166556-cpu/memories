// API Configuration
// תמיד משתמש ב-relative path כדי שהבקשות יעברו דרך Netlify proxy
// ב-development: זה יעבוד עם ה-proxy ב-vite.config.js
// ב-production: זה יעבוד עם ה-proxy ב-netlify.toml

const getApiUrl = () => {
  // תמיד השתמש ב-relative path (ריק) כדי שהבקשות יעברו דרך proxy
  // זה יעבוד גם ב-development (Vite proxy) וגם ב-production (Netlify proxy)
  return '';
};

export const API_URL = getApiUrl();

// Helper function ליצירת URL מלא
export const getApiEndpoint = (endpoint) => {
  // אם endpoint מתחיל ב-/, הסר אותו
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // אם יש API_URL, הוסף אותו
  if (API_URL) {
    return `${API_URL}${cleanEndpoint}`;
  }
  
  // אחרת, השתמש ב-relative path (יעבוד עם proxy ב-development)
  return cleanEndpoint;
};

// יצירת axios instance מותאם
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: API_URL || '', // ריק = relative path (עובד עם proxy)
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default {
  API_URL,
  getApiEndpoint,
  apiClient,
};

