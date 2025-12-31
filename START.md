# 🚀 הוראות הפעלה מהירות

## התקנה פעם ראשונה

```bash
npm run install-all
```

## הפעלת האפליקציה

```bash
npm run dev
```

אחרי כמה שניות, האפליקציה תהיה זמינה ב:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## פתיחת האפליקציה

פתח את הדפדפן בכתובת:
```
http://localhost:3000
```

## 📋 שלבים מהירים

1. **התקנה** (רק בפעם הראשונה):
   ```bash
   npm run install-all
   ```

2. **הפעלה**:
   ```bash
   npm run dev
   ```

3. **שימוש**:
   - עבור ל-http://localhost:3000
   - לחץ "צור דף זיכרון חדש"
   - מלא פרטים והעלה תמונות/סרטונים/שיר
   - צור דף זיכרון
   - הורד QR code והדפס אותו!

## ⚠️ בעיות נפוצות

**הפורט 3000 תפוס?**
```bash
# הפעל רק את הבקאנד
cd backend
npm run dev

# בחלון נפרד, הפעל את הפרונטאנד
cd frontend
npm run dev
```

**שגיאות התקנה?**
```bash
# נסה למחוק והתקן מחדש
rm -rf node_modules backend/node_modules frontend/node_modules
npm run install-all
```

## 📁 קבצים חשובים

- `backend/memorial.db` - מסד הנתונים (נוצר אוטומטית)
- `backend/uploads/` - כל התמונות, סרטונים ושירים
- `backend/qrcodes/` - QR codes שנוצרו

## 🎯 תכונות מיוחדות

✅ שיר רקע אוטומטי במצגת  
✅ פרקי תהילים מובנים  
✅ QR code אוטומטי  
✅ גלריית תמונות וסרטונים  
✅ ממשק עברי מלא RTL  

---

**מוכן? הפעל `npm run dev` ותתחיל!** 🚀

