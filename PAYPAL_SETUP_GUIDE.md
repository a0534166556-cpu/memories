# 💳 מדריך: הגדרת PayPal לתשלומים

## 🎯 משתנים שצריך להוסיף ב-Railway

| שם משתנה | תיאור | דוגמה |
|----------|-------|-------|
| `PAYPAL_CLIENT_ID` | PayPal Client ID | `AeA1QIZXiflr1_-...` |
| `PAYPAL_CLIENT_SECRET` | PayPal Secret | `ELg0Xh...` |
| `PAYPAL_MODE` | סביבה | `sandbox` (בדיקות) או `live` (פרודקשן) |

---

## 📝 שלב 1: קבלת פרטי PayPal

### א. היכנס ל-PayPal Developer Dashboard
1. לך ל: https://developer.paypal.com/
2. התחבר עם חשבון PayPal שלך
3. אם אין לך חשבון - צור אחד (חינם)

### ב. צור App חדש
1. לחץ על **"Dashboard"** או **"My Apps & Credentials"**
2. בחר **"Sandbox"** (לבדיקות) או **"Live"** (פרודקשן)
3. לחץ על **"Create App"**

### ג. מלא פרטים:
- **App Name**: `Memorial Pages App` (או כל שם שתרצה)
- **Merchant**: בחר את החשבון שלך
- **Features**: בחר **"Accept Payments"**
4. לחץ **"Create App"**

### ד. העתק את ה-Credentials:
אחרי יצירת ה-App, תראה:
- **Client ID** - העתק את זה
- **Secret** - לחץ "Show" והעתק גם את זה

**⚠️ חשוב**: שמור את ה-Secret במקום בטוח - לא תראה אותו שוב!

---

## 📝 שלב 2: הוספה ב-Railway

### 1️⃣ הוסף PAYPAL_CLIENT_ID:
```
שם משתנה: PAYPAL_CLIENT_ID
ערך: [הדבק את ה-Client ID שקיבלת מ-PayPal]
```

### 2️⃣ הוסף PAYPAL_CLIENT_SECRET:
```
שם משתנה: PAYPAL_CLIENT_SECRET
ערך: [הדבק את ה-Secret שקיבלת מ-PayPal]
```

### 3️⃣ הוסף PAYPAL_MODE:
```
שם משתנה: PAYPAL_MODE
ערך: sandbox
```

**💡 טיפ**: 
- השתמש ב-`sandbox` לבדיקות (לא תשלומים אמיתיים)
- כשמוכן לפרודקשן, שנה ל-`live` והשתמש ב-Credentials של "Live"

---

## 🧪 בדיקות (Sandbox Mode)

### איך לבדוק בחשבון Sandbox:
1. ב-PayPal Developer Dashboard, לך ל-**"Sandbox"** → **"Accounts"**
2. PayPal יוצר אוטומטית חשבון בדיקה
3. השתמש בחשבון הזה לבדיקת תשלומים

**💳 פרטי בדיקה (Sandbox):**
- משתמש: `sb-xxxxx@business.example.com`
- סיסמה: תראה ב-PayPal Dashboard

---

## 🚀 העברה ל-Production (Live)

### כשמוכן לפרודקשן:
1. ב-PayPal Developer Dashboard, בחר **"Live"**
2. צור App חדש (אותו תהליך)
3. העתק את ה-Credentials החדשים
4. עדכן ב-Railway:
   - `PAYPAL_CLIENT_ID` → הערך החדש מ-Live
   - `PAYPAL_CLIENT_SECRET` → הערך החדש מ-Live
   - `PAYPAL_MODE` → שנה ל-`live`

---

## ✅ בדיקה אחרי הוספה

### 1. בדוק את הלוגים ב-Railway:
לאחר הוספת המשתנים, בדוק את הלוגים. צריך לראות:
```
✅ PayPal SDK loaded
```

### 2. בדוק באתר:
1. נסה ליצור דף זיכרון
2. נסה לעבור לתשלום
3. בדוק שהטופס של PayPal נפתח

---

## 🔒 אבטחה

**⚠️ חשוב מאוד:**
- ❌ אל תעלה את ה-Secret ל-Git!
- ✅ שמור את ה-Secret רק ב-Railway Variables
- ✅ השתמש ב-Sandbox לבדיקות
- ✅ עבור ל-Live רק כשיהיה מוכן לפרודקשן

---

## 📌 סיכום - מה להוסיף עכשיו:

1. ✅ `PAYPAL_CLIENT_ID` - מ-PayPal Developer Dashboard
2. ✅ `PAYPAL_CLIENT_SECRET` - מ-PayPal Developer Dashboard  
3. ✅ `PAYPAL_MODE` = `sandbox` (לבדיקות)

---

## ❓ בעיות נפוצות

### "PayPal לא מוגדר":
- ✅ וודא שהוספת את כל 3 המשתנים
- ✅ וודא שה-Service הופעל מחדש
- ✅ בדוק שהלוגים מראים `✅ PayPal SDK loaded`

### תשלומים לא עובדים:
- ✅ וודא שאתה ב-Sandbox mode וסביבת הבדיקה
- ✅ בדוק שהחשבון Sandbox פעיל
- ✅ בדוק את הלוגים ב-Railway לשגיאות

---

**🎓 טיפ**: התחל עם Sandbox, בדוק הכל, ורק אחר כך עבור ל-Live!
