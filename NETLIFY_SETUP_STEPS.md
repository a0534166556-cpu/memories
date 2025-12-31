# 🚀 הוראות הגדרת Netlify

## שלב 1: היכנס ל-Netlify

1. **היכנס ל-[app.netlify.com](https://app.netlify.com)**
2. **התחבר עם GitHub** (אם עדיין לא)

## שלב 2: צור פרויקט חדש

1. **לחץ על "Add new site"** (כפתור ירוק בפינה הימנית העליונה)
2. **בחר "Import an existing project"**
3. **בחר "GitHub"** → התחבר אם צריך
4. **חפש את ה-repository `memories`** → לחץ עליו

## שלב 3: הגדר Build Settings

**חשוב מאוד!** הגדר את ההגדרות הבאות:

### Base directory:
```
frontend
```

### Build command:
```
npm install && npm run build
```

### Publish directory:
```
frontend/dist
```

## שלב 4: הוסף משתני סביבה

לפני שלוחצים "Deploy site", לחץ על **"Show advanced"** או **"New variable"** והוסף:

### משתנה 1:
- **Key:** `VITE_API_URL`
- **Value:** `https://YOUR_RAILWAY_URL.railway.app`
  - (החלף ב-URL האמיתי של Railway - תמצא אותו ב-Railway Dashboard)

### משתנה 2 (אופציונלי):
- **Key:** `NODE_VERSION`
- **Value:** `18`

## שלב 5: Deploy!

1. **לחץ "Deploy site"**
2. **חכה שהבנייה תסתיים** (כמה דקות)
3. **תקבל URL** כמו: `memories-xxxxx.netlify.app`

## שלב 6: עדכן את Railway

אחרי שיש לך את ה-URL של Netlify:

1. **חזור ל-Railway Dashboard**
2. **לך ל-Variables** (משתני סביבה)
3. **עדכן:**
   - `FRONTEND_URL` → `https://YOUR_NETLIFY_URL.netlify.app`
   - `BASE_URL` → `https://YOUR_NETLIFY_URL.netlify.app`

4. **Redeploy** את השרת (Railway יעשה את זה אוטומטית)

---

## ✅ בדיקות

אחרי שהכל עובד:

1. ✅ פתח את ה-URL של Netlify
2. ✅ בדוק שהאתר נטען
3. ✅ נסה ליצור דף זיכרון חדש
4. ✅ בדוק שה-QR codes עובדים

---

## 🆘 בעיות נפוצות

### CORS errors
- ודא ש-`FRONTEND_URL` ב-Railway תואם ל-URL של Netlify בדיוק

### API לא עובד
- ודא ש-`VITE_API_URL` ב-Netlify תואם ל-URL של Railway בדיוק
- ודא שה-URL מתחיל ב-`https://`

### Build נכשל
- בדוק שהתיקייה `frontend` קיימת
- בדוק שיש `package.json` ב-`frontend/`

---

**בהצלחה!** 🎉

