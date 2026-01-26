# שימוש ב-Railway Tunnel לחיבור מקומי

## אופציה: Railway CLI עם Tunnel

אם Railway לא מספק כתובת חיצונית, אפשר להשתמש ב-Railway CLI עם tunnel:

### שלב 1: התקן Railway CLI
```bash
# Windows (PowerShell)
iwr https://railway.app/install.ps1 | iex

# או דרך npm
npm install -g @railway/cli
```

### שלב 2: התחבר
```bash
railway login
```

### שלב 3: בחר את הפרויקט
```bash
railway link
```

### שלב 4: הפעל tunnel
```bash
railway connect mysql
```

זה יפתח tunnel ויתן לך כתובת מקומית (כמו `localhost:3306`)

### שלב 5: עדכן את .env
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306  # או הפורט שהתקבל
MYSQL_USER=root
MYSQL_PASSWORD=הסיסמה_מ-Railway
MYSQL_DATABASE=railway
```

---

## אופציה פשוטה יותר: Public Network

1. לך ל-Railway → MySQL service
2. Settings → Networking
3. הפעל "Public Network"
4. העתק את ה-Public Hostname
5. עדכן את `.env` עם הכתובת החיצונית
