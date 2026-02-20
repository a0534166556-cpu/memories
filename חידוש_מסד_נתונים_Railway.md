# חידוש / החזרת מסד הנתונים ב-Railway

כשהמסד ירד או ש-**memories** ב-Crashed – עשה לפי הסדר.

---

## אם שירות "memories" ב-Crashed / Failed (לא MySQL)

1. **Root Directory:** ב-Railway → שירות **memories** → **Settings** → **Source** → שדה **Root Directory** הגדר ל-**`backend`** (בלי לוכסן בהתחלה). כך ה-build וה-run ירוצו מתיקיית ה-backend ו-**node_modules** יותקן שם.
2. **Start Command:** וודא ש-**Start Command** ריק (ש-Railway ישתמש ב-`npm start` מתוך backend) או: `npm start`.
3. **Redeploy:** **Deployments** → **Redeploy** או דחוף commit.
4. **Deploy Logs:** אחרי ה-deploy פתח **Deploy Logs** (לא Build Logs) – שם תופיע השגיאה האמיתית אם יש (למשל חיבור ל-MySQL, חסר משתנה וכו').

הודעת "No package manager inferred, using npm default" ב-Build Logs היא רק מידע – לא סיבת הקריסה.

---

## 1. בדיקה ב-Railway

1. היכנס ל-**railway.app** → הפרויקט (friendly-energy / memories).
2. וודא ש-**MySQL** מופיע כ-**Online** (ירוק). אם מופיע Paused / Crashed / Error:
   - לחץ על שירות **MySQL**.
   - **Settings** → אם יש **Restart** – הרץ.
   - או **Redeploy** לשירות MySQL (אם יש כפתור כזה).

---

## 2. חיבור מחדש בין MySQL ל-backend

1. בשירות **memories** (ה-backend):
   - **Variables** – וודא שיש משתנים של MySQL.  
     Railway בדרך כלל מוסיף אוטומטית:  
     `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_PORT`  
     (או עם סיומת כמו `MYSQLHOST` וכו' – השרת תומך בשניהם.)
2. אם **אין** משתני MySQL:
   - לחץ על שירות **MySQL** → **Variables** (או **Connect**).
   - העתק את הערכים (Host, User, Password, Database, Port).
   - היכנס ל-**memories** → **Variables** → **Add Variable** והוסף:
     - `MYSQL_HOST` = ה-Host של MySQL  
     - `MYSQL_USER` = User  
     - `MYSQL_PASSWORD` = Password  
     - `MYSQL_DATABASE` = Database  
     - `MYSQL_PORT` = Port (בדרך כלל 3306)
3. אם יש **"Connect"** או **"Add Reference"** מ-memories ל-MySQL – השתמש בזה כדי ש-Railway יזין את המשתנים אוטומטית.

---

## 3. Redeploy ל-backend (memories)

אחרי ש-MySQL Online והמשתנים קיימים:

1. בשירות **memories**:
   - **Deployments** → **Redeploy** (או **Deploy** מההתחלה).
2. או דחוף commit ל-Git שמחובר ל-Railway – יבנה deploy חדש.
3. אחרי ה-deploy השרת יתחבר מחדש ל-MySQL ו-**initDatabase** ייצור טבלאות אם הן לא קיימות (`CREATE TABLE IF NOT EXISTS`).

---

## 4. אם יצרת MySQL חדש (מסד ריק)

- אם **הסרת** את ה-MySQL הישן והוספת חדש – המסד ריק.
- הנתונים הישנים **לא** חוזרים בלי גיבוי.
- אחרי חיבור המשתנים ו-redeploy ל-**memories**, הטבלאות ייווצרו אוטומטית והאפליקציה תעבוד עם מסד ריק (משתמשים ואנדרטאות חדשים).

---

## סיכום

| שלב | פעולה |
|-----|--------|
| 1 | Railway → MySQL **Online**, Restart אם צריך |
| 2 | memories → **Variables** עם MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, MYSQL_PORT |
| 3 | **Redeploy** לשירות memories |
| 4 | בדוק ב-Deploy Logs ש־"Connected to MySQL database" ו־"Database initialization successful" |

אם אחרי זה עדיין 503 / "Database unavailable" – העתק את השגיאה מ-**Deploy Logs** של memories (או MySQL) ונמשיך משם.
