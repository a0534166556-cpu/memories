# 🧪 איך להריץ את הבדיקות

## דרך מהירה - VS Code Terminal

1. פתח את VS Code
2. לחץ `Ctrl + ~` (פתח Terminal)
3. הרץ:
   ```bash
   cd backend
   node quick-test.js
   ```

## דרך מהירה - Command Prompt

1. פתח Command Prompt (לא PowerShell!)
2. הרץ:
   ```cmd
   cd "C:\Users\a0534\OneDrive\שולחן העבודה\memories\backend"
   node quick-test.js
   ```

## דרך מהירה - Double Click

1. פתח את התיקייה `backend`
2. לחץ כפול על `run-test.bat`

## בדיקות זמינות

### 1. `quick-test.js` - בדיקה מהירה (מומלץ!)
- בודק את השרת ב-Railway
- לא צריך dependencies
- הכי מהיר ופשוט

**הרצה:**
```bash
cd backend
node quick-test.js
```

### 2. `test-railway.js` - בדיקה מלאה של Railway
- בודק הכל ב-Railway
- צריך axios (מותקן אוטומטית)

**הרצה:**
```bash
cd backend
node test-railway.js
```

### 3. `test-local.js` - בדיקה מקומית
- בודק את השרת המקומי
- צריך שהשרת ירוץ על `localhost:8080`

**הרצה:**
```bash
# Terminal 1:
cd backend
npm start

# Terminal 2:
cd backend
node test-local.js
```

## מה הבדיקות בודקות

✅ **חיבור לשרת** - האם השרת רץ ומגיב  
✅ **CORS Headers** - האם CORS מוגדר נכון  
✅ **API Endpoints** - האם ה-API עובד  
✅ **Database Readiness** - האם השרת מטפל נכון ב-database readiness  

## תוצאות

### ✅ הצלחה
```
✅ Server is running and responding!
✅ CORS header: *
✅ Found 0 memorials
```

### ⚠️ אזהרה (זה תקין!)
```
⚠️  Server is running but database is initializing (503)
```
זה תקין בזמן startup - חכה כמה שניות ונסה שוב.

### ❌ כשל
```
❌ Server URL cannot be resolved - server might not be running
```
השרת לא רץ - בדוק את Railway logs.

## פתרון בעיות

### "Cannot find module"
```bash
cd backend
npm install
```

### "Server is not running"
1. לך ל-Railway → Logs
2. בדוק אם השרת רץ
3. אם לא, לחץ "Redeploy"

### "CORS header missing"
1. ודא שהקוד החדש עלה ל-Railway
2. בדוק את `backend/server.js` - ה-CORS middleware צריך להיות שם


