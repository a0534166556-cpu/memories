# 🚀 מדריך פרסום ל-Production

## שלב 1: הכנת הסביבה

### 1.1 התקנת תלויות
```bash
npm run install-all
```

### 1.2 בניית Frontend
```bash
npm run build
```

זה יוצר תיקיית `frontend/dist` עם הקבצים המוכנים לפרסום.

## שלב 2: הגדרת משתני סביבה

צור קובץ `.env` בתיקיית `backend/`:

```env
# פורט השרת
PORT=5000

# סביבת עבודה
NODE_ENV=production

# כתובת ה-Frontend (להגדרות CORS)
FRONTEND_URL=https://yourdomain.com

# כתובת הבסיס ל-QR codes (חשוב מאוד!)
BASE_URL=https://yourdomain.com
```

**⚠️ חשוב:** `BASE_URL` חייב להיות ה-URL המלא עם `https://` כדי שה-QR codes יעבדו נכון!

## שלב 3: הפעלת השרת

### אפשרות א': הפעלה ישירה
```bash
cd backend
npm start
```

### אפשרות ב': עם משתני סביבה
```bash
cd backend
NODE_ENV=production npm start
```

### אפשרות ג': עם PM2 (מומלץ ל-production)
```bash
# התקן PM2
npm install -g pm2

# הפעל את השרת
cd backend
pm2 start server.js --name memorial-app --env production

# שמור את הרשימה
pm2 save

# הגדר הפעלה אוטומטית
pm2 startup
```

## שלב 4: הגדרת Reverse Proxy (Nginx)

אם אתה משתמש ב-Nginx, הוסף את ההגדרות הבאות:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Frontend
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Static files
    location /uploads {
        proxy_pass http://localhost:5000;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    location /qrcodes {
        proxy_pass http://localhost:5000;
        expires 7d;
        add_header Cache-Control "public";
    }
}
```

## שלב 5: בדיקות

### בדוק שהשרת רץ:
```bash
curl http://localhost:5000/api/memorials
```

### בדוק שה-Frontend נטען:
פתח בדפדפן: `https://yourdomain.com`

### בדוק QR codes:
צור דף זיכרון חדש ובדוק שה-QR code מכיל את ה-URL הנכון.

## שלב 6: גיבויים

### גיבוי מסד נתונים:
```bash
# גיבוי יומי (הוסף ל-cron)
cp backend/memorial.db backend/backups/memorial-$(date +%Y%m%d).db
```

### גיבוי קבצים:
```bash
# גיבוי תיקיית uploads
tar -czf backups/uploads-$(date +%Y%m%d).tar.gz backend/uploads/
```

## שלב 7: ניטור ותחזוקה

### בדיקת לוגים (עם PM2):
```bash
pm2 logs memorial-app
```

### בדיקת סטטוס:
```bash
pm2 status
```

### הפעלה מחדש:
```bash
pm2 restart memorial-app
```

## בעיות נפוצות

### השרת לא נגיש מבחוץ
- בדוק שהפורט פתוח בפיירוול
- בדוק שהפורט לא תפוס על ידי תהליך אחר

### QR codes לא עובדים
- ודא ש-`BASE_URL` מוגדר נכון ב-`.env`
- ודא שה-URL מתחיל ב-`https://` (או `http://` אם אין SSL)

### CORS errors
- ודא ש-`FRONTEND_URL` מוגדר נכון ב-`.env`
- ודא שהכתובת תואמת בדיוק (כולל https/http)

### קבצים לא נטענים
- בדוק שהתיקיות `uploads/` ו-`qrcodes/` קיימות
- בדוק הרשאות כתיבה לתיקיות

## המלצות ביטחון

1. ✅ השתמש ב-HTTPS בלבד ב-production
2. ✅ שמור על `.env` פרטי ולא תפרסם אותו
3. ✅ גבה את מסד הנתונים באופן קבוע
4. ✅ עדכן את התלויות באופן קבוע
5. ✅ השתמש ב-firewall להגבלת גישה
6. ✅ הגבל גודל קבצים (כבר מוגדר ל-100MB)

## תמיכה

לשאלות נוספות, עיין ב-README.md או פנה למפתח.

---

**בהצלחה בפרסום!** 🎉


