# 🚂 הוראות הגדרת Railway

## שלב 1: סגור את ה-Modal

1. **לחץ על ה-X** בפינה הימנית העליונה של ה-Modal (או לחץ מחוץ ל-Modal)

## שלב 2: הוסף Service חדש

יש לך שתי אפשרויות:

### אפשרות א': דרך הכפתור הימני העליון
1. **לחץ על הכפתור הסגול "+ Create"** בפינה הימנית העליונה
2. **בחר "GitHub Repo"** או **"New Service"**

### אפשרות ב': דרך המרכז
1. **לחץ על "Add a Service"** במרכז המסך
2. **בחר "GitHub Repo"**

## שלב 3: בחר את ה-Repository

1. **חפש את `memories`** ברשימה
2. **לחץ עליו**

## שלב 4: הגדר את ה-Service

אחרי ש-Railway יזהה את הפרויקט:

1. **לך ל-Settings** (הגדרות) של ה-Service
2. **Root Directory:** הגדר ל-`backend`
   - זה אומר ל-Railway לחפש את ה-`package.json` בתיקיית `backend/`

## שלב 5: הוסף משתני סביבה

ב-Settings → Variables, הוסף:

```
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://YOUR_NETLIFY_URL.netlify.app
BASE_URL=https://YOUR_NETLIFY_URL.netlify.app
```

**⚠️ חשוב:** 
- `FRONTEND_URL` ו-`BASE_URL` - תעדכן אחרי שיהיה לך את ה-URL של Netlify
- בינתיים, אפשר להשאיר אותם ריקים או עם placeholder

## שלב 6: Deploy

1. **Railway יתחיל לבנות אוטומטית**
2. **חכה שהבנייה תסתיים** (כמה דקות)
3. **תקבל URL** כמו: `memorial-backend.railway.app`

## שלב 7: מצא את ה-URL

אחרי שה-Deploy הסתיים:

1. **לך ל-Settings** של ה-Service
2. **לך ל-"Domains"** או **"Networking"**
3. **תראה את ה-URL** - העתק אותו!

---

## ✅ אחרי שיש לך את ה-URL של Railway

1. **עדכן ב-Netlify:**
   - הוסף משתנה: `VITE_API_URL` = `https://YOUR_RAILWAY_URL.railway.app`

2. **עדכן ב-Railway:**
   - `FRONTEND_URL` = `https://YOUR_NETLIFY_URL.netlify.app`
   - `BASE_URL` = `https://YOUR_NETLIFY_URL.netlify.app`

---

## 🆘 בעיות נפוצות

### Railway לא מוצא את package.json
- ודא ש-Root Directory מוגדר ל-`backend`

### Build נכשל
- בדוק שה-`package.json` ב-`backend/` תקין
- בדוק שה-`start` script קיים

### לא רואה את ה-URL
- לך ל-Settings → Domains
- או לחץ על ה-Service → Networking

---

**בהצלחה!** 🚂


