# 🎵 הוראות: הוספת קבצי שירים

## שלב 1: העתק את קבצי MP3

הקבצים נמצאים ב: `C:\Users\a0534\Downloads`
- `Quiet Honor (5).mp3`
- `Quiet Honor (4).mp3`
- `Quiet Honor (3).mp3`

**מה לעשות:**
1. פתח את File Explorer
2. לך ל: `C:\Users\a0534\Downloads`
3. בחר את 3 הקבצים: `Quiet Honor (3).mp3`, `Quiet Honor (4).mp3`, `Quiet Honor (5).mp3`
4. לחץ Copy (Ctrl+C)
5. לך ל: `C:\Users\a0534\OneDrive\שולחן העבודה\memories\backend\uploads\audio`
6. לחץ Paste (Ctrl+V)

**או דרך PowerShell:**
```powershell
cd "C:\Users\a0534\Downloads"
Copy-Item "Quiet Honor (3).mp3" "C:\Users\a0534\OneDrive\שולחן העבודה\memories\backend\uploads\audio\"
Copy-Item "Quiet Honor (4).mp3" "C:\Users\a0534\OneDrive\שולחן העבודה\memories\backend\uploads\audio\"
Copy-Item "Quiet Honor (5).mp3" "C:\Users\a0534\OneDrive\שולחן העבודה\memories\backend\uploads\audio\"
```

## שלב 2: בדוק שהקבצים נוספו

לך ל: `backend\uploads\audio`
צריך לראות:
- `e4715ab8-d7b9-461b-b055-39b9a1730699.mp3` (קיים)
- `Quiet Honor (3).mp3` (חדש)
- `Quiet Honor (4).mp3` (חדש)
- `Quiet Honor (5).mp3` (חדש)

## שלב 3: בדוק באתר

1. פתח את האתר
2. לך ליצירת דף זיכרון
3. בחלק "שיר רקע למצגת"
4. בחר "בחר משירים קיימים"
5. אמור לראות את 4 השירים (כולל החדשים)

## ⚠️ חשוב:

**אם השרת רץ locally:**
- הקבצים יעבדו מיד

**אם השרת ב-Railway:**
- צריך להעלות את הקבצים ידנית ל-Railway
- או להשתמש ב-upload דרך האתר (העלה שיר חדש)
