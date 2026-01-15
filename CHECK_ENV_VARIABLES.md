# ✅ בדיקת משתני סביבה ב-Railway

## 🔍 מה לבדוק:

### 1. JWT_SECRET (חשוב מאוד!)
**למה זה חשוב:**
- הטוקן נוצר עם JWT_SECRET אחד
- השרת מאמת אותו עם אותו JWT_SECRET
- אם הם לא תואמים → שגיאה 401/403

**איך לבדוק:**
1. היכנס ל-Railway Dashboard
2. בחר את הפרויקט שלך
3. לך ל-"Variables" או "Environment"
4. חפש `JWT_SECRET`
5. **ודא שהוא מוגדר ומכיל ערך!**

**דוגמה לערך טוב:**
```
JWT_SECRET=my-super-secret-key-12345-change-me
```

**אם אין JWT_SECRET:**
1. לחץ "New Variable"
2. Name: `JWT_SECRET`
3. Value: כתוב כל מחרוזת אקראית (לפחות 32 תווים)
   - דוגמה: `memories-app-secret-2024-random-string-xyz`
4. שמור
5. השרת יתחיל מחדש אוטומטית

---

### 2. MySQL משתנים (אם יש שגיאות DB)
```
MYSQL_HOST=xxx.up.railway.app
MYSQL_USER=root
MYSQL_PASSWORD=xxxxx
MYSQL_DATABASE=railway
MYSQL_PORT=3306
```

---

### 3. PayPal משתנים (אם יש שגיאות תשלום)
```
PAYPAL_CLIENT_ID=xxxxx
PAYPAL_CLIENT_SECRET=xxxxx
PAYPAL_MODE=sandbox
```

---

## 🐛 אם עדיין יש בעיה:

1. **בדוק את הלוגים ב-Railway:**
   - לך ל-"Deployments" → בחר את ה-deployment האחרון → "View Logs"
   - חפש הודעות שמתחילות ב-`🔍` או `❌`

2. **בדוק אם השרת עובד:**
   - פתח בדפדפן: `https://memories-production-47ee.up.railway.app/api/memorials`
   - אמור לראות JSON (או שגיאה 404, אבל לא שגיאה 500)

3. **נסה להתחבר מחדש:**
   - היכנס לאתר
   - התנתק (אם יש כפתור)
   - נסה להתחבר שוב
   - נסה ליצור תשלום שוב

---

## ⚠️ בעיה נפוצה:

**אם שינית JWT_SECRET אחרי שהמשתמשים כבר התחברו:**
- כל הטוקנים הישנים לא יעבדו יותר!
- הפתרון: כל המשתמשים צריכים להתחבר מחדש

**אם יש לך 2 שרתים (local + Railway) עם JWT_SECRET שונה:**
- טוקן שנוצר ב-local לא יעבוד ב-Railway
- ודא שיש אותו JWT_SECRET ב-2 המקומות
