# תיקון מהיר: שגיאת 500 ב-Login באתר המקומי

## הבעיה:
שגיאת 500 Internal Server Error ב-`/api/auth/login` באתר המקומי.

## הסיבות האפשריות:

### 1. **MySQL לא רץ**
- השרת לא יכול להתחבר ל-MySQL

### 2. **אין קובץ .env**
- השרת לא יודע איך להתחבר ל-MySQL

### 3. **הגדרות שגויות ב-.env**
- Host, user, password או database לא נכונים

### 4. **מסד נתונים לא קיים**
- מסד הנתונים `memorial` לא קיים

## פתרון מהיר:

### שלב 1: בדוק ש-MySQL רץ
```bash
# Windows: פתח Services → MySQL → Start
# Mac: brew services start mysql
# Linux: sudo systemctl start mysql
```

### שלב 2: צור/בדוק קובץ .env
```bash
cd backend
copy env.example.txt .env  # Windows
# or
cp env.example.txt .env    # Mac/Linux
```

### שלב 3: ערוך .env והתאם את ההגדרות
```env
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=        # השאר ריק אם לא הגדרת סיסמה
MYSQL_DATABASE=memorial
MYSQL_PORT=3306
```

### שלב 4: צור את המסד אם צריך
```bash
mysql -u root -p
```
```sql
CREATE DATABASE IF NOT EXISTS memorial;
EXIT;
```

### שלב 5: התקן את dotenv
```bash
cd backend
npm install
```

### שלב 6: הפעל מחדש את השרת
```bash
npm run dev
```

### שלב 7: בדוק את הלוגים
השרת אמור להציג:
```
📁 Loaded .env file for local development
Connecting to MySQL database...
Database config: { host: 'localhost', port: 3306, ... }
✅ Connected to MySQL database
✅ Database initialization successful
```

אם אתה רואה שגיאות, בדוק:
- האם MySQL רץ?
- האם ההגדרות ב-.env נכונות?
- האם המסד `memorial` קיים?

## אם זה עדיין לא עובד:

1. בדוק את הלוגים של השרת - הם יראו את הבעיה המדויקת
2. נסה להתחבר ל-MySQL ידנית:
   ```bash
   mysql -u root -p memorial
   ```
3. אם זה לא עובד, ייתכן ש-MySQL לא מותקן או לא מוגדר נכון
