// API Configuration
// Default: relative path → requests go through Vite proxy (dev) or Netlify proxy (prod).
// If VITE_API_URL is set (e.g. your published Netlify URL): use it so local frontend talks to production API.

const getApiUrl = () => {
  const u = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL;
  const url = (typeof u === 'string' && u.trim()) ? u.trim().replace(/\/$/, '') : '';
  if (url && import.meta.env?.DEV) {
    console.warn('📍 Using VITE_API_URL (production API):', url);
  }
  return url;
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

