# Setup MySQL Locally for Development

## שלב 1: התקנת MySQL

### Windows:
1. הורד MySQL מ: https://dev.mysql.com/downloads/installer/
2. התקן את MySQL Server
3. במהלך ההתקנה, הגדר:
   - Root password (או השאר ריק אם אתה רוצה)
   - Port: 3306 (ברירת מחדל)

### Mac:
```bash
# Using Homebrew
brew install mysql
brew services start mysql

# Or download from: https://dev.mysql.com/downloads/mysql/
```

### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

## שלב 2: יצירת מסד הנתונים

1. התחבר ל-MySQL:
```bash
mysql -u root -p
# Enter your password (if you set one, or press Enter if empty)
```

2. צור מסד נתונים חדש:
```sql
CREATE DATABASE memorial;
```

3. בדוק שהמסד נוצר:
```sql
SHOW DATABASES;
```

4. צא מ-MySQL:
```sql
EXIT;
```

## שלב 3: הגדרת Environment Variables

1. העתק את קובץ ההגדרות:
```bash
cd backend
copy env.example.txt .env  # Windows
# or
cp env.example.txt .env    # Mac/Linux
```

2. ערוך את `.env` והתאם את ההגדרות שלך:
```env
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=        # השאר ריק אם לא הגדרת סיסמה
MYSQL_DATABASE=memorial
MYSQL_PORT=3306
```

**חשוב**: קובץ `.env` לא יישמר ב-git (זה בסדר - כל אחד יוצר את שלו)

## שלב 4: הרצת השרת

1. התקן dependencies:
```bash
cd backend
npm install
```

2. הרץ את השרת:
```bash
npm run dev    # עם auto-reload
# or
npm start      # ללא auto-reload
```

השרת אמור להתחבר ל-MySQL מקומי ולהגדיר את הטבלאות אוטומטית!

## בדיקה שהכל עובד

1. פתח טרמינל חדש והתחבר ל-MySQL:
```bash
mysql -u root -p memorial
```

2. בדוק שהטבלאות נוצרו:
```sql
SHOW TABLES;
```

אמור להציג:
- memorials
- users
- payments
- subscriptions

3. בדוק את הלוג של השרת - אמור להציג:
```
✅ Connected to MySQL database
✅ Database initialization successful
```

## שימוש בסקריפט האוטומטי

**Windows:**
```bash
cd backend
setup-local-db.bat
```

**Mac/Linux:**
```bash
cd backend
chmod +x setup-local-db.sh
./setup-local-db.sh
```

הסקריפט ייצור את קובץ `.env` ויתקין את ה-dependencies אוטומטית.

## פתרון בעיות

### שגיאת חיבור:
```
❌ Database connection failed: connect ECONNREFUSED
```

**פתרון:**
1. ודא ש-MySQL רץ:
   - Windows: פתח Services → מצא MySQL → Start
   - Mac: `brew services start mysql`
   - Linux: `sudo systemctl start mysql`

2. בדוק שה-port נכון (3306)

3. ודא שהסיסמה נכונה ב-`.env`

### שגיאת מסד נתונים לא נמצא:
```
❌ Error: Unknown database 'memorial'
```

**פתרון:**
1. צור את המסד ידנית (ראה שלב 2)

### שגיאת הרשאות:
```
❌ Access denied for user 'root'@'localhost'
```

**פתרון:**
1. ודא שה-username נכון ב-`.env`
2. בדוק את הסיסמה
3. או צור משתמש חדש:
```sql
CREATE USER 'memorial_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON memorial.* TO 'memorial_user'@'localhost';
FLUSH PRIVILEGES;
```

ואז עדכן את `.env`:
```env
MYSQL_USER=memorial_user
MYSQL_PASSWORD=your_password
```

## הערות חשובות

- **המסד המקומי נפרד לחלוטין מ-Railway** - אין התערבבות בין הנתונים
- הטבלאות נוצרות אוטומטית כשהשרת מתחיל - אין צורך ליצור טבלאות ידנית
- השרת מנסה להתחבר 5 פעמים, ואז מתחיל גם בלי חיבור (endpoints יחזירו 503)
- ב-Railway - שום דבר לא משתנה, ממשיך לעבוד עם מסד הנתונים של Railway
- במקומי - משתמש ב-MySQL המקומי שלך

## מה קורה כשיש .env במקומי?

- השרת קורא את `.env` ומתחבר ל-localhost
- אם אין `.env`, השרת ינסה להשתמש בערכי ברירת מחדל (localhost, root, וכו')

## מה קורה ב-Railway?

- Railway יש לו Environment Variables משלו
- השרת משתמש בהגדרות של Railway
- אין `.env` ב-Railway - הכל מוגדר ב-Environment Variables
