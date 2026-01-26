# שימוש במסד הנתונים של Railway (ללא MySQL מקומי)

## למה?
- ✅ לא צריך להתקין MySQL
- ✅ לא צריך להגדיר PATH
- ✅ עובד מיד
- ✅ האתר שפורסם ממשיך לעבוד כרגיל

## איך לעשות:

### שלב 1: קבל את ההגדרות מ-Railway

1. לך ל: https://railway.app
2. בחר את הפרויקט שלך
3. לחץ על **Variables** (בסרגל הצד)
4. מצא את המשתנים הבאים:
   - `MYSQL_HOST` (או `MYSQLHOST`)
   - `MYSQL_USER` (או `MYSQLUSER`)
   - `MYSQL_PASSWORD` (או `MYSQLPASSWORD`)
   - `MYSQL_DATABASE` (או `MYSQLDATABASE`)
   - `MYSQL_PORT` (או `MYSQLPORT`)

### שלב 2: העתק את הערכים

העתק את כל הערכים (לחץ על העין כדי לראות סיסמאות)

### שלב 3: הדבק ב-.env

פתח את `backend/.env` והחלף את השורות:

```env
MYSQL_HOST=הערך_מ-Railway
MYSQL_USER=הערך_מ-Railway
MYSQL_PASSWORD=הערך_מ-Railway
MYSQL_DATABASE=הערך_מ-Railway
MYSQL_PORT=הערך_מ-Railway
```

### שלב 4: בדוק

```bash
cd backend
npm run check-setup
```

אמור לראות:
```
✅ Connected to MySQL server
✅ Database 'memorial' exists
✅ All checks passed!
```

### שלב 5: הפעל את השרת

```bash
npm run dev
```

---

## הערות חשובות:

- 🔒 **האתר שפורסם ממשיך לעבוד כרגיל** - Railway משתמש באותן הגדרות
- 🚀 **הסביבה המקומית תתחבר ל-Railway** - כל השינויים יישמרו במסד של Railway
- ⚠️ **זה בסדר** - זה לא ישפיע על האתר שפורסם

---

## אם Railway משתמש בשמות משתנים שונים:

אם ב-Railway יש:
- `MYSQLHOST` במקום `MYSQL_HOST`
- `MYSQLUSER` במקום `MYSQL_USER`
- וכו'

השתמש בשמות האלה ב-.env (הקוד תומך בשניהם).
