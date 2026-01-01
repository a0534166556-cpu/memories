# 🧪 Server Testing Guide

סקריפטי בדיקה לשרת הזיכרון.

## 📋 סקריפטי בדיקה

### 1. `test-server.js` - בדיקה מלאה
בדיקה מקיפה של כל הפונקציונליות:
- ✅ בדיקת חיבור לשרת
- ✅ בדיקת CORS headers
- ✅ בדיקת טבלאות database
- ✅ בדיקת API endpoints
- ✅ בדיקת database readiness

**שימוש:**
```bash
cd backend
npm test
```

או עם URL מותאם:
```bash
API_URL=https://memories-production-31c0.up.railway.app npm test
```

### 2. `test-local.js` - בדיקה מהירה מקומית
בדיקה מהירה לשרת מקומי.

**שימוש:**
```bash
cd backend
node test-local.js
```

**דרישות:**
- השרת צריך לרוץ על `http://localhost:8080`
- הפעל את השרת עם: `npm start`

### 3. `test-railway.js` - בדיקת Railway
בדיקה ספציפית לשרת ב-Railway.

**שימוש:**
```bash
cd backend
node test-railway.js
```

או עם URL מותאם:
```bash
API_URL=https://memories-production-31c0.up.railway.app node test-railway.js
```

## 🚀 איך להריץ בדיקות

### בדיקה מקומית (Local)
1. הפעל את השרת:
   ```bash
   cd backend
   npm start
   ```

2. בחלון אחר, הרץ את הבדיקה:
   ```bash
   cd backend
   node test-local.js
   ```

### בדיקת Railway
1. ודא שהשרת רץ ב-Railway
2. הרץ את הבדיקה:
   ```bash
   cd backend
   node test-railway.js
   ```

## ✅ מה הבדיקות בודקות

### 1. חיבור לשרת
- האם השרת רץ ומגיב
- האם ה-URL נכון
- האם יש שגיאות חיבור

### 2. CORS Headers
- האם ה-`Access-Control-Allow-Origin` header קיים
- האם הוא מוגדר נכון (`*` או domain ספציפי)
- האם ה-`Access-Control-Allow-Methods` קיים

### 3. Database Tables
- האם הטבלאות `memorials`, `condolences`, `candles` קיימות
- האם יש חיבור ל-database

### 4. API Endpoints
- האם `/api/music` עובד
- האם `/api/memorials` עובד
- האם ה-responses תקינים

### 5. Database Readiness
- האם השרת מחזיר 503 כשה-database לא מוכן
- האם השרת מטפל בבקשות אחרי שה-database מוכן

## 📊 פירוש תוצאות

### ✅ הצלחה
- כל הבדיקות עברו
- השרת עובד תקין
- CORS מוגדר נכון
- Database מוכן

### ⚠️ אזהרות
- השרת רץ אבל database עדיין לא מוכן (זה תקין בזמן startup)
- חלק מהבדיקות עברו אבל יש אזהרות

### ❌ כשל
- השרת לא רץ
- CORS לא מוגדר נכון
- Database לא מוכן
- API endpoints לא עובדים

## 🔧 פתרון בעיות

### "Server is not running"
- ודא שהשרת רץ: `npm start`
- בדוק את ה-port (8080)
- בדוק את ה-logs

### "Cannot resolve server URL"
- בדוק שה-URL נכון
- בדוק שה-Railway service רץ
- בדוק את ה-DNS

### "CORS header missing"
- בדוק את `backend/server.js` - ה-CORS middleware צריך להיות מוגדר
- ודא שה-`Access-Control-Allow-Origin` header נשלח

### "Database not ready (503)"
- זה תקין בזמן startup
- חכה כמה שניות ונסה שוב
- בדוק את ה-logs ב-Railway

## 📝 דוגמאות פלט

### בדיקה מוצלחת:
```
🧪 Quick Server Test

1. Testing server connection...
   ✅ Server is running!
   ✅ CORS header: *

2. Testing CORS...
   ✅ CORS is working! (*)

3. Testing API endpoint...
   ✅ API endpoint is working!
   ✅ Found 0 memorials

✅ All tests completed!
```

### בדיקה עם שגיאות:
```
1. Testing server connection...
   ❌ Server is not running!
   💡 Start the server with: npm start
```

## 🎯 טיפים

1. **הרץ בדיקות לפני deploy** - ודא שהכל עובד מקומית
2. **בדוק אחרי deploy** - ודא שהשרת ב-Railway עובד
3. **בדוק את ה-logs** - אם יש שגיאות, בדוק את ה-logs ב-Railway
4. **השתמש ב-`test-railway.js`** - לבדיקה מהירה של Railway

## 📞 תמיכה

אם יש בעיות:
1. בדוק את ה-logs ב-Railway
2. בדוק את ה-console ב-Netlify
3. הרץ את הבדיקות ובדוק את התוצאות

