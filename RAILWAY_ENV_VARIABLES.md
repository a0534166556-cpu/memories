# 📋 מדריך: משתני סביבה ל-Railway Backend

## 🎯 משתנים חובה (MUST HAVE)

| שם משתנה | תיאור | דוגמה |
|----------|-------|-------|
| `JWT_SECRET` | מפתח סודי לאבטחת משתמשים | `my-secret-key-2025-abc123xyz456` |
| `BASE_URL` | כתובת האתר ב-Netlify | `https://memoriesman.netlify.app` |

---

## 🗄️ משתני MySQL (Railway מנהל אותם אוטומטית)

**טוב לדעת:** Railway מוסיף את משתני MySQL אוטומטית! לא צריך להוסיף אותם ידנית.

אם הם כבר קיימים, תן להם להישאר:
- `MYSQLHOST`
- `MYSQLUSER`
- `MYSQLPASSWORD`
- `MYSQLDATABASE`
- `MYSQLPORT`

---

## 💳 משתני PayPal (אופציונלי - רק אם משתמשים בתשלומים)

| שם משתנה | תיאור | דוגמה |
|----------|-------|-------|
| `PAYPAL_CLIENT_ID` | PayPal Client ID | מהדשבורד של PayPal |
| `PAYPAL_CLIENT_SECRET` | PayPal Secret | מהדשבורד של PayPal |
| `PAYPAL_MODE` | סביבה | `sandbox` (בדיקות) או `live` (פרודקשן) |

---

## 📝 הוראות הוספה ב-Railway

### שלב 1: היכנס ל-Railway Dashboard
1. פתח https://railway.app
2. בחר את הפרויקט שלך
3. לחץ על השירות **"memories"**

### שלב 2: הוסף משתנים
1. לחץ על הטאב **"Variables"**
2. הוסף כל משתנה בנפרד:

#### ✅ JWT_SECRET (חובה!)
```
VARIABLE_NAME: JWT_SECRET
VALUE: [הכנס מחרוזת אקראית ארוכה, לפחות 32 תווים]
```

**דוגמאות לערך:**
```
super-secret-jwt-key-2025-abc123xyz456789
```
או (לאבטחה גבוהה יותר):
```bash
# רץ בטרמינל ליצירת מפתח אקראי:
openssl rand -hex 32
```

#### ✅ BASE_URL (חובה!)
```
VARIABLE_NAME: BASE_URL
VALUE: https://your-netlify-site.netlify.app
```

**איך למצוא את ה-URL שלך:**
1. היכנס ל-Netlify Dashboard
2. בחר את ה-site שלך
3. ה-URL יהיה: `https://[שם-האתר].netlify.app`

---

### שלב 3: בדיקה
1. **חכה 30 שניות** - Railway יפעיל את השירות מחדש
2. **בדוק את הלוגים:**
   - לחץ על טאב **"Logs"** ב-Railway
   - חפש: `✅ Server running`
   - חפש: `✅ Database connected - all endpoints available`
3. **בדוק את האתר:**
   - נסה ליצור דף זיכרון
   - נסה להרשם/להיכנס

---

## ⚠️ פתרון בעיות

### שגיאת 500 ב-API:
- ✅ וודא ש-`JWT_SECRET` הוסף
- ✅ וודא ש-`BASE_URL` מצביע ל-Netlify (לא Railway!)
- ✅ בדוק את הלוגים ב-Railway

### שגיאת חיבור למסד נתונים:
- ✅ וודא שמשתני MySQL קיימים (Railway מוסיף אותם אוטומטית)
- ✅ בדוק שה-MySQL service רץ (ירוק = Online)

### QR codes לא עובדים:
- ✅ וודא ש-`BASE_URL` מוגדר ומצביע ל-Netlify
- ✅ וודא שהשירות הופעל מחדש אחרי הוספת המשתנה

---

## 📌 סיכום - מה להוסיף עכשיו:

### ✅ חובה (2 משתנים):
1. `JWT_SECRET` - מפתח אבטחה
2. `BASE_URL` - כתובת האתר ב-Netlify

### 🔵 אופציונלי (3 משתנים - רק אם יש PayPal):
3. `PAYPAL_CLIENT_ID`
4. `PAYPAL_CLIENT_SECRET`
5. `PAYPAL_MODE` = `sandbox`

---

## 🎓 טיפים:
- 💡 לאחר הוספת כל משתנה, Railway יפעיל את השירות מחדש אוטומטית
- 💡 תמיד בדוק את הלוגים אחרי שינוי משתנים
- 💡 שמור העתק של כל המשתנים במקום בטוח
