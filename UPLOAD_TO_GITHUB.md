# 📤 הוראות העלאת הפרויקט ל-GitHub

## שלב 1: פתח Terminal/Command Prompt

פתח **Git Bash** או **Command Prompt** בתיקיית הפרויקט:
```
C:\Users\a0534\OneDrive\שולחן העבודה\memories
```

## שלב 2: הרץ את הפקודות הבאות

העתק והדבק את הפקודות הבאות אחת אחת:

### 1. אתחל git repository
```bash
git init
```

### 2. הוסף את כל הקבצים
```bash
git add .
```

### 3. צור commit ראשון
```bash
git commit -m "Initial commit - דפי זיכרון דיגיטליים"
```

### 4. שנה את שם ה-branch ל-main
```bash
git branch -M main
```

### 5. הוסף את ה-remote (החיבור ל-GitHub)
```bash
git remote add origin https://github.com/a0534166556-cpu/memories.git
```

### 6. העלה ל-GitHub
```bash
git push -u origin main
```

---

## ⚠️ אם תתבקש להתחבר

אם תתבקש שם משתמש וסיסמה:
- **Username:** `a0534166556-cpu`
- **Password:** השתמש ב-**Personal Access Token** (לא הסיסמה הרגילה!)

### איך ליצור Personal Access Token:

1. היכנס ל-GitHub.com
2. Settings → Developer settings → Personal access tokens → Tokens (classic)
3. Generate new token (classic)
4. סמן `repo` (כל התיבות)
5. Generate token
6. העתק את ה-token (תראה אותו רק פעם אחת!)
7. השתמש ב-token הזה במקום סיסמה

---

## ✅ אחרי שהכל עלה בהצלחה

1. רענן את הדף ב-GitHub - תראה את כל הקבצים!
2. חזור ל-Railway
3. רענן את הדף (F5)
4. ה-repository `memories` יופיע ברשימה
5. לחץ עליו והמשך!

---

## 🆘 בעיות?

אם יש שגיאה, שלח לי את ההודעה ואעזור לך לפתור!


