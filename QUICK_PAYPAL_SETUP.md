# ⚡ הוספה מהירה - PayPal

## 🎯 3 משתנים להוסיף ב-Railway:

### 1️⃣ PAYPAL_CLIENT_ID
```
קבל מ: https://developer.paypal.com/
Dashboard → Create App → Copy Client ID
```

### 2️⃣ PAYPAL_CLIENT_SECRET  
```
קבל מ: PayPal Dashboard → Show Secret → Copy
```

### 3️⃣ PAYPAL_MODE
```
ערך: sandbox
```
(לבדיקות - לא תשלומים אמיתיים)

---

## 📍 איפה להוסיף:
Railway → memories service → Variables → Add

---

## ✅ אחרי זה:
- בדוק הלוגים - צריך לראות `✅ PayPal SDK loaded`
- נסה ליצור תשלום באתר
