# 🚀 מדריך פרסום ב-Netlify

## ⚠️ חשוב להבין

הפרויקט הזה מורכב מ-**Frontend** ו-**Backend**:
- **Frontend** (React) - יכול לרוץ ב-Netlify ✅
- **Backend** (Node.js + Express) - צריך שרת נפרד ⚠️

## פתרון מומלץ: Frontend ב-Netlify + Backend ב-Railway/Render

### אפשרות 1: Frontend ב-Netlify + Backend ב-Railway (מומלץ)

#### שלב 1: פרסום Backend ב-Railway

1. **היכנס ל-[Railway.app](https://railway.app)**
2. **צור פרויקט חדש** → "New Project"
3. **חבר את GitHub repository**
4. **בחר את התיקייה `backend`**
5. **הגדר משתני סביבה:**
   ```
   NODE_ENV=production
   PORT=5000
   FRONTEND_URL=https://your-netlify-site.netlify.app
   BASE_URL=https://your-netlify-site.netlify.app
   ```
6. **Railway יזהה אוטומטית** את `package.json` ויריץ את `npm start`

#### שלב 2: פרסום Frontend ב-Netlify

1. **היכנס ל-[Netlify](https://app.netlify.com)**
2. **"Add new site" → "Import an existing project"**
3. **חבר את GitHub repository**
4. **הגדר Build settings:**
   - **Base directory:** `frontend`
   - **Build command:** `npm install && npm run build`
   - **Publish directory:** `frontend/dist`
5. **הוסף משתני סביבה:**
   ```
   REACT_APP_API_URL=https://your-railway-backend.railway.app
   ```
6. **Deploy!**

#### שלב 3: עדכן את ה-Frontend להשתמש ב-Backend URL

עדכן את `frontend/vite.config.js` או צור קובץ `.env.production`:

```env
VITE_API_URL=https://your-railway-backend.railway.app
```

ואז עדכן את כל הקריאות ל-API להשתמש במשתנה הזה.

---

### אפשרות 2: Frontend ב-Netlify + Backend ב-Render

#### שלב 1: פרסום Backend ב-Render

1. **היכנס ל-[Render.com](https://render.com)**
2. **"New +" → "Web Service"**
3. **חבר את GitHub repository**
4. **הגדר:**
   - **Name:** memorial-backend
   - **Root Directory:** `backend`
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. **הוסף משתני סביבה:**
   ```
   NODE_ENV=production
   PORT=10000
   FRONTEND_URL=https://your-netlify-site.netlify.app
   BASE_URL=https://your-netlify-site.netlify.app
   ```
6. **Deploy!**

#### שלב 2: פרסום Frontend ב-Netlify

(זהה לשלב 2 באפשרות 1)

---

### אפשרות 3: הכל ב-Netlify (Frontend + Functions)

⚠️ **זה דורש שינויים משמעותיים בקוד!**

אם אתה רוצה הכל ב-Netlify, צריך להמיר את ה-backend ל-Netlify Functions. זה דורש:
- המרת כל ה-API routes ל-Functions
- שימוש ב-Netlify Storage או שירות חיצוני למסד נתונים
- שינויים רבים בקוד

**לא מומלץ** אלא אם אתה רוצה להשקיע זמן רב.

---

## 📝 הוראות מפורטות ל-Netlify

### 1. הכנת Repository

ודא שיש לך:
- ✅ `netlify.toml` (כבר נוצר)
- ✅ `frontend/public/_redirects` (כבר נוצר)
- ✅ קובץ `.gitignore` (כבר קיים)

### 2. הגדרת Netlify

1. **היכנס ל-Netlify Dashboard**
2. **"Add new site" → "Import an existing project"**
3. **בחר את ה-repository שלך**
4. **הגדר:**
   ```
   Base directory: frontend
   Build command: npm install && npm run build
   Publish directory: frontend/dist
   ```

### 3. משתני סביבה ב-Netlify

הוסף ב-Site settings → Environment variables:

```
VITE_API_URL=https://your-backend-url.com
```

### 4. עדכון הקוד להשתמש ב-API URL

צריך ליצור קובץ `frontend/src/config.js`:

```javascript
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

ואז להשתמש בו בכל הקריאות ל-API.

---

## 🔗 חיבור Frontend ל-Backend

אחרי שיש לך:
- Frontend ב-Netlify: `https://memorials.netlify.app`
- Backend ב-Railway: `https://memorial-backend.railway.app`

צריך לעדכן את ה-Frontend להשתמש ב-Backend URL.

---

## ✅ בדיקות אחרי פרסום

1. ✅ בדוק שה-Frontend נטען: `https://your-site.netlify.app`
2. ✅ בדוק שה-API עובד: `https://your-backend.railway.app/api/memorials`
3. ✅ בדוק שה-QR codes מכילים את ה-URL הנכון
4. ✅ בדוק העלאת קבצים
5. ✅ בדוק הדלקת נרות
6. ✅ בדוק הודעות תנחומים

---

## 💡 המלצות

1. **Railway** - הכי קל ופשוט ל-backend
2. **Render** - חלופה טובה, חינמי עם הגבלות
3. **Vercel** - טוב גם ל-frontend וגם ל-backend (אבל דורש שינויים)

---

## 🆘 בעיות נפוצות

### CORS errors
- ודא ש-`FRONTEND_URL` ב-backend תואם ל-URL של Netlify
- ודא ש-`VITE_API_URL` ב-frontend תואם ל-URL של Backend

### QR codes לא עובדים
- ודא ש-`BASE_URL` מוגדר נכון (חייב להיות ה-URL המלא של Netlify)

### קבצים לא נטענים
- בדוק שהתיקיות `uploads/` ו-`qrcodes/` קיימות ב-backend
- בדוק הרשאות כתיבה

---

**בהצלחה!** 🎉

