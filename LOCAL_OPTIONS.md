# הרצה מקומית בלי לפגוע באתר שפורסם

האתר שפורסם (Netlify + Railway) **לא משתנה**. רק הגדרות מקומיות.

---

## אופציה 1: מקומי עם מסד הנתונים של Railway

כש-MySQL מקומי לא עובד, השרת המקומי יכול להתחבר **למסד של Railway**.

1. היכנס ל-**Railway** → הפרויקט → **Variables**.
2. העתק את: `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_PORT`.
3. פתח `backend/.env` (או צור מ-`env.example.txt`) והדבק שם את הערכים.
4. הרץ כרגיל: `npm run dev` (או `npm run server` + `npm run client`).

האתר שפורסם ממשיך להשתמש בהגדרות של Railway. המקומי פשוט מתחבר **לאותו** מסד.

---

## אופציה 2: פרונט מקומי + API של האתר שפורסם

בלי MySQL ובלי backend מקומי – רק פרונט locally, וה-API של **האתר שפורסם**.

1. בתיקיית `frontend` צור קובץ **`.env.local`** עם:
   ```
   VITE_API_URL=https://YOUR-NETLIFY-SITE.netlify.app
   ```
   החלף את `YOUR-NETLIFY-SITE` בכתובת האתר שלך ב-Netlify.

2. הרץ רק את הפרונט:
   ```bash
   npm run client
   ```
   (או `cd frontend && npm run dev`)

3. פתח `http://localhost:3000`. ההתחברות וכל הבקשות ילכו ל-API של האתר שפורסם.

---

## איזה אופציה מתאימה?

- **אופציה 1:** פיתוח עם backend מקומי (עריכות ב-`server.js` וכו') – צריך מסד.  
- **אופציה 2:** רק לבדוק UI / להכנס כמנהל וכו' – בלי MySQL, בלי backend.

**בשני המקרים האתר שפורסם נשאר כפי שהוא.**
