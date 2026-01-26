# דחיפה מהירה ל-GitHub

## הבעיה:
האתר שפורסם עדיין מציג את השגיאה `grantingId is not defined` כי השינויים לא נדחפו ל-GitHub.

## פתרון:

### אופציה 1: דרך Git GUI
1. פתח את Git GUI או GitHub Desktop
2. הוסף את כל הקבצים (Add All)
3. צור commit עם ההודעה:
   ```
   Add location feature for graves - cemetery name, address, GPS coordinates, age calculation, mishnayot in example page, and fix ManageMemorials grantingId bug
   ```
4. לחץ Push

### אופציה 2: דרך Command Prompt (לא PowerShell)
פתח Command Prompt (cmd) במקום PowerShell והרץ:
```bash
cd "c:\Users\a0534\OneDrive\שולחן העבודה\memories"
git add -A
git commit -m "Add location feature for graves - cemetery name, address, GPS coordinates, age calculation, mishnayot in example page, and fix ManageMemorials grantingId bug"
git push
```

### אופציה 3: דרך PowerShell (עם .\)
```powershell
cd "c:\Users\a0534\OneDrive\שולחן העבודה\memories"
.\PUSH_LOCATION_FEATURE.bat
```

---

## אחרי הדחיפה:
1. Netlify יבנה מחדש את האתר אוטומטית
2. תוך כמה דקות האתר יעודכן
3. השגיאה תיעלם

---

## מה נדחף:
- ✅ תיקון באג `grantingId` ב-ManageMemorials
- ✅ שדות מיקום (cemeteryName, cemeteryAddress, latitude, longitude)
- ✅ חישוב גיל בפטירה
- ✅ משניות בדף דוגמא
- ✅ שיפורים נוספים
