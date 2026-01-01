# 📤 מדריך העלאת הפרויקט ל-GitHub

## שלב 1: יצירת Repository ב-GitHub

1. **היכנס ל-[GitHub.com](https://github.com)**
2. **לחץ על ה-"+ " בפינה הימנית העליונה** → "New repository"
3. **הגדר:**
   - **Repository name:** `memories` (או שם אחר)
   - **Description:** "דפי זיכרון דיגיטליים"
   - **Public** או **Private** (בחר מה שמתאים לך)
   - **אל תסמן** "Initialize with README" (כי יש לנו כבר קבצים)
4. **לחץ "Create repository"**

## שלב 2: העלאת הפרויקט

### אפשרות א': דרך GitHub Desktop (הכי קל)

1. **הורד [GitHub Desktop](https://desktop.github.com/)**
2. **פתח את הפרויקט** ב-GitHub Desktop
3. **Publish repository** → בחר את ה-repository שיצרת

### אפשרות ב': דרך Command Line (Terminal)

פתח Terminal בתיקיית הפרויקט והרץ:

```bash
# אם עדיין אין git repository
git init

# הוסף את כל הקבצים
git add .

# צור commit ראשון
git commit -m "Initial commit - דפי זיכרון דיגיטליים"

# הוסף את ה-remote (החלף YOUR_USERNAME בשם המשתמש שלך)
git remote add origin https://github.com/YOUR_USERNAME/memories.git

# העלה ל-GitHub
git branch -M main
git push -u origin main
```

## שלב 3: בחירה ב-Railway

אחרי שהפרויקט ב-GitHub:

1. **רענן את הדף ב-Railway** (F5)
2. **חפש את ה-repository** `memories` (או השם שבחרת)
3. **לחץ עליו**
4. **המשך להגדרות**

---

## ⚠️ חשוב לפני העלאה

ודא ש-`.gitignore` כולל:
- `node_modules/`
- `.env`
- `backend/memorial.db`
- `backend/uploads/` (או רק חלק מהקבצים)

הקובץ `.gitignore` כבר קיים ומוגדר נכון!

---

## 🚀 אחרי שהפרויקט ב-GitHub

חזור ל-Railway ובחר את ה-repository החדש!


