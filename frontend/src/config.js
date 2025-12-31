// API Configuration
// ב-development: משתמש ב-proxy (localhost:5000)
// ב-production: משתמש ב-VITE_API_URL או ב-URL של Netlify

const getApiUrl = () => {
  // אם יש משתנה סביבה מוגדר, השתמש בו (הכי חשוב!)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // ב-development, השתמש ב-proxy (ריק = relative path)
  // זה יעבוד עם ה-proxy ב-vite.config.js
  if (import.meta.env.DEV) {
    return '';
  }
  
  // ב-production ללא VITE_API_URL, נשתמש ב-relative path
  // זה יעבוד אם ה-backend על אותו domain
  // אחרת, תצטרך להגדיר VITE_API_URL ב-Netlify
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

