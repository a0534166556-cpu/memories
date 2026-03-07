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

// קישור לתשלום חד-פעמי (399₪) דרך Upay
export const UPAY_LIFETIME_URL =
  'https://app.upay.co.il/API6/clientsecure/redirectpage.php?msg=QktaV2w3UmZISy9LOGhUQXlJVWprZi9xYzJ0VWdXR3BaZ2ZhUG4rdGJBcTBXU0QyVWhobXhQMkJiS3FKUkQ2VDNEekswNk9mYmRnUDBlQ0dQRmNjUzVsYzVZalZzYnUyaDZPWEFYdHpDWVJ3T2Q0aXRva2NEMFQ1OTJpMklFZkhLaytjcXB1VWdQM3JqWWNWanB4bDBQZTRUTVd3ekM5WkVQQnpxZmlhdDA1aFVIOXNIdm1naDIwSWhRRStTRE5Jc1ozb1h6RGtiYVp5Tnc2UEwxam96c1RYTEhtRlRzOVNMMFZrOTZET1VZOTBEL1dlbHI4Qkpub3NTSWNRZnJyM2lhdEhITGI1clpTUXVOWE1qYUlxZTRPZTl6dmV6c1NlRVFydFlnSDVhenN2dlIyZ1JKbWRQYTFhYXJlRjgyaHYequal';

export default {
  API_URL,
  getApiEndpoint,
  apiClient,
  UPAY_LIFETIME_URL,
};

