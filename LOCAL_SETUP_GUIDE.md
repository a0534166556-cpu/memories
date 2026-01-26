# מדריך הפעלת הסביבה המקומית

## שלב 1: בדוק ש-MySQL רץ

### Windows:
1. לחץ `Win + R`
2. הקלד `services.msc` ולחץ Enter
3. חפש `MySQL` ברשימה
4. אם הסטטוס לא "Running", לחץ ימין → Start

### או דרך Command Prompt:
```bash
# בדוק אם MySQL רץ
net start | findstr MySQL
```

אם MySQL לא מותקן, התקן אותו מ: https://dev.mysql.com/downloads/mysql/

---

## שלב 2: בדוק את קובץ .env

הקובץ `backend/.env` צריך להכיל:
```env
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=        # השאר ריק אם אין סיסמה
MYSQL_DATABASE=memorial
MYSQL_PORT=3306
PORT=8080
NODE_ENV=development
```

**אם הסיסמה של MySQL שלך לא ריקה**, עדכן את `MYSQL_PASSWORD` ב-.env

---

## שלב 3: צור את מסד הנתונים (אם צריך)

פתח Command Prompt או MySQL Workbench והרץ:
```sql
CREATE DATABASE IF NOT EXISTS memorial;
```

או דרך Command Line:
```bash
mysql -u root -p
# הקלד את הסיסמה (או Enter אם אין)
CREATE DATABASE IF NOT EXISTS memorial;
EXIT;
```

---

## שלב 4: בדוק את ההגדרות

הרץ את סקריפט הבדיקה:
```bash
cd backend
npm run check-setup
```

זה יבדוק:
- ✅ האם קובץ .env קיים
- ✅ האם MySQL רץ
- ✅ האם המסד `memorial` קיים

---

## שלב 5: הפעל את השרת (Backend)

פתח טרמינל/Command Prompt חדש:
```bash
cd backend
npm install  # רק בפעם הראשונה
npm run dev
```

אמור לראות:
```
✅ Connected to MySQL database
✅ Database initialization successful
🚀 Server running on port 8080
```

**השאר את הטרמינל הזה פתוח!**

---

## שלב 6: הפעל את הפרונטאנד (Frontend)

פתח טרמינל/Command Prompt חדש נוסף:
```bash
cd frontend
npm install  # רק בפעם הראשונה
npm run dev
```

אמור לראות:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:3000/
```

---

## שלב 7: פתח בדפדפן

פתח: **http://localhost:3000**

---

## פתרון בעיות נפוצות:

### שגיאת 503 - Database unavailable
- ✅ בדוק ש-MySQL רץ (שלב 1)
- ✅ בדוק את קובץ .env (שלב 2)
- ✅ בדוק שהמסד `memorial` קיים (שלב 3)

### שגיאת Connection refused
- ✅ בדוק ש-MySQL רץ על פורט 3306
- ✅ בדוק את `MYSQL_PORT` ב-.env

### שגיאת Access denied
- ✅ בדוק את `MYSQL_USER` ו-`MYSQL_PASSWORD` ב-.env
- ✅ נסה להתחבר ידנית: `mysql -u root -p`

---

## טיפים:

1. **השאר שני חלונות טרמינל פתוחים** - אחד לשרת ואחד לפרונטאנד
2. **אם אתה משנה קוד ב-backend**, השרת יתעדכן אוטומטית (nodemon)
3. **אם אתה משנה קוד ב-frontend**, הדף יתרענן אוטומטית (Vite HMR)

---

## אופציה: שימוש במסד הנתונים של Railway (ללא MySQL מקומי)

אם MySQL מקומי לא עובד, אפשר להשתמש במסד של Railway:

1. לך ל-Railway → Variables
2. העתק את: `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_PORT`
3. הדבק ב-`backend/.env`
4. השרת המקומי יתחבר ל-Railway (האתר שפורסם ממשיך לעבוד כרגיל)

---

**הכל מוכן? בואו נתחיל! 🚀**
