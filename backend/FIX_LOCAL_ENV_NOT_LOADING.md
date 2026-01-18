# Fix: Local Environment Variables Not Loading

## הבעיה:
השרת המקומי לא טוען את קובץ `.env` אוטומטית, אז הוא מנסה להתחבר ל-MySQL עם הגדרות ברירת מחדל או ללא חיבור בכלל.

## התיקון:
1. ✅ הוספנו `dotenv` ל-`package.json`
2. ✅ הוספנו `require('dotenv').config()` בתחילת `server.js`

## מה לעשות עכשיו:

### שלב 1: התקן את dotenv
```bash
cd backend
npm install
```

### שלב 2: ודא שיש קובץ .env
```bash
cd backend
copy env.example.txt .env  # Windows
# or
cp env.example.txt .env    # Mac/Linux
```

### שלב 3: בדוק שהכל נכון ב-.env
```env
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=memorial
MYSQL_PORT=3306
PORT=8080
```

### שלב 4: ודא ש-MySQL רץ
- Windows: פתח Services → MySQL → Start
- Mac: `brew services start mysql`
- Linux: `sudo systemctl start mysql`

### שלב 5: צור את המסד אם צריך
```bash
mysql -u root -p
```
```sql
CREATE DATABASE memorial;
EXIT;
```

### שלב 6: הרץ את השרת
```bash
npm run dev
```

השרת אמור להתחבר עכשיו ל-MySQL המקומי!

## למה זה עובד עכשיו:

- `dotenv` טוען את קובץ `.env` ומכניס את ההגדרות ל-`process.env`
- השרת קורא את `process.env.MYSQL_HOST` וכו' ומתחבר למסד המקומי
- ב-Railway זה לא משנה כי שם יש Environment Variables מוגדרים
