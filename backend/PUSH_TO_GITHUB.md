# 🚀 איך לדחוף את הקוד ל-GitHub

## אתה נמצא ב: `backend/`

### שלב 1: עלה תיקייה אחת למעלה
```powershell
cd ..
```

### שלב 2: בדוק את מצב Git
```powershell
git status
```

### שלב 3: הוסף את הקבצים
```powershell
git add backend/server.js
git add backend/package.json
git add backend/test-server.js
git add backend/test-local.js
git add backend/test-railway.js
git add backend/quick-test.js
git add backend/run-test.bat
git add backend/TESTING.md
```

### שלב 4: Commit
```powershell
git commit -m "Fix CORS headers and add test scripts"
```

### שלב 5: Push
```powershell
git push
```

---

## או דרך VS Code (קל יותר!)

1. פתח VS Code בתיקיית `memories` (לא `backend`)
2. לחץ `Ctrl + Shift + G` (Source Control)
3. הוסף את הקבצים
4. Commit
5. Push

---

## אחרי ה-Push

Railway יעשה deploy אוטומטית (כמה דקות).

אחרי ה-deploy, בדוק שוב:
```powershell
cd backend
node quick-test.js
```

אמור להיות: `✅ CORS header: *`


