# 🗄️ איך להגדיר MySQL ב-Railway

## הבעיה עם SQLite

SQLite לא מתאים ל-Railway ב-production כי:
- זה file-based - ה-database file יכול להיעלם כשהשרת מתחיל מחדש
- לא מתאים ל-containerized environments
- MySQL/PostgreSQL הם managed services - יותר יציבים

## פתרון: MySQL ב-Railway

### שלב 1: הוסף MySQL Service ב-Railway

1. לך ל-Railway → Project שלך
2. לחץ על **"+ New"** → **"Database"** → **"Add MySQL"**
3. Railway ייצור MySQL service חדש
4. העתק את ה-connection string מה-Variables

### שלב 2: עדכן את הקוד

הקוד צריך להשתמש ב-MySQL במקום SQLite.

### שלב 3: הוסף את ה-Environment Variables

ב-Railway → Service → Variables:
- `MYSQL_HOST` - מה-MySQL service
- `MYSQL_USER` - מה-MySQL service  
- `MYSQL_PASSWORD` - מה-MySQL service
- `MYSQL_DATABASE` - מה-MySQL service

## האם אתה רוצה שאני אשנה את הקוד ל-MySQL?

אם כן, אני יכול:
1. לשנות את הקוד מ-SQLite ל-MySQL
2. לעדכן את כל ה-queries
3. להוסיף את ה-dependencies הנדרשים

זה יפתור את הבעיה של SQLite ב-Railway!


