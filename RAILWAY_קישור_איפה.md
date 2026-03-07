# מאיפה להשיג את הקישור של Railway

הקישור שצריך הוא **כתובת ה-API של הבקאנד** ש-Railway נותן אחרי שמריצים דיפלוי.

## איפה משיגים את הקישור

1. **נכנסים ל-Railway:** [railway.app](https://railway.app) → התחברות.
2. **בוחרים את הפרויקט** (למשל הפרויקט של דפי זיכרון).
3. **בוחרים את השירות** (הבקאנד – לרוב "memories" או שם דומה).
4. **פותחים את ההגדרות של השירות:**
   - **Settings** → **Networking** / **Public Networking**,  
   **או**
   - **Settings** → **Domains**.
5. שם תופיע **Domain** שהמערכת יצרה, למשל:
   - `https://memories-production-47ee.up.railway.app`
   - או `https://<שם-שירות>-<קוד>.up.railway.app`

זה **הקישור של Railway** – אותו מעתיקים למקומות הבאים בפרויקט.

---

## איפה לעדכן את הקישור בפרויקט

אם שינית את השירות ב-Railway או קיבלת domain חדש, עדכן את **אותו קישור** ב־**3 מקומות**:

| מקום | קובץ | מה לעדכן |
|------|------|----------|
| 1 | `netlify/functions/api.js` | בשורה עם `RAILWAY_URL` – להחליף ל־URL המלא של Railway (בלי סלאש בסוף). |
| 2 | `netlify.toml` | בכל redirect שמפנה ל־`https://memories-production-47ee.up.railway.app` – להחליף לכתובת החדשה (יש שניים: `/uploads/*` ו־`/qrcodes/*`). |

### דוגמה

אם הקישור החדש הוא `https://memories-production-abc1.up.railway.app`:

- **netlify/functions/api.js:**  
  `const RAILWAY_URL = 'https://memories-production-abc1.up.railway.app';`

- **netlify.toml:**  
  בשתי השורות של `to = "https://...up.railway.app/..."` להחליף ל־  
  `https://memories-production-abc1.up.railway.app`

---

## סיכום

- **משיגים** את הקישור: ב־**Railway** → הפרויקט → השירות (הבקאנד) → **Settings** → **Networking** / **Domains**.
- **משתמשים** בו ב־`netlify/functions/api.js` (RAILWAY_URL) וב־`netlify.toml` (ב־redirects של `/uploads` ו־`/qrcodes`).
