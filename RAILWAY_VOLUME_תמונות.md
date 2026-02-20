# שמירת תמונות/וידאו/אודיו אחרי דיפלוי (Railway Volume)

אחרי דיפלוי ב-Railway התמונות נעלמות כי הקבצים נשמרים בתוך הקונטיינר, והוא מתחלף בכל דיפלוי.

**הפתרון:** להוסיף **Volume** (דיסק קבוע) ל-service של ה-backend.

---

## צעדים ב-Railway

1. היכנס ל-**Railway** → הפרויקט → בחר את ה-service **memories** (ה-backend).
2. לחץ על **Variables** (או **Settings**).
3. גלול ל-**Volumes** (או **+ New** → **Volume**).
4. **הוסף Volume:**
   - **Mount Path:** ` /app/data ` (בדיוק ככה, עם הקידומת `/app`)
5. שמור. Railway יגדיר אוטומטית את המשתנה `RAILWAY_VOLUME_MOUNT_PATH=/app/data`.
6. עשה **Redeploy** ל-service (Deployments → ⋮ → Redeploy).

מעכשיו כל קבצים שנשמרים תחת `/app/data` (תמונות, וידאו, אודיו, קודי QR) יישארו גם אחרי דיפלוי.

---

## הערות

- **תמונות שכבר הועלו לפני ה-Volume:** הן אבדו עם הדיפלוי הקודם. משתמשים יצטרכו להעלות שוב או שתשחזר מגיבוי אם יש.
- הקוד ב-`server.js` כבר משתמש ב-`RAILWAY_VOLUME_MOUNT_PATH` – אין צורך להוסיף משתנה `STORAGE_PATH` ב-Variables אלא אם אתה רוצה path אחר (אז תגדיר `STORAGE_PATH=/app/data`).
