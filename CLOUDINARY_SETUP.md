# הגדרת Cloudinary – תמונות, סרטונים ואודיו בענן

כשמוגדר, כל ההעלאות (תמונות, וידאו, אודיו) נשלחות ל-Cloudinary ומקבלות קישור ציבורי. הדפים לא תלויים ב-Volume ב-Railway.

---

## 1. חשבון Cloudinary

- היכנס ל-[cloudinary.com](https://cloudinary.com) וצור חשבון (יש חינמי).
- ב-**Dashboard** → **API Keys** תמצא: **Cloud name**, **API Key**, **API Secret**.

---

## 2. משתני סביבה

ב-**Railway** → Service **memories** → **Variables** הוסף:

| משתנה | ערך |
|--------|-----|
| `CLOUDINARY_CLOUD_NAME` | ה-Cloud name מהדשבורד |
| `CLOUDINARY_API_KEY` | ה-API Key |
| `CLOUDINARY_API_SECRET` | ה-API Secret |

אם **לא** מגדירים את שלושת המשתנים – הקבצים ימשיכו להישמר על דיסק/Volume כמו היום.

---

## 3. התקנת חבילה

בתיקיית `backend`:

```bash
npm install
```

(החבילה `cloudinary` כבר רשומה ב-`package.json`.)

---

## 4. אחרי דיפלוי

- העלאות **חדשות** יישמרו ב-Cloudinary ויקבלו כתובת מתחילה ב-`https://res.cloudinary.com/...`.
- דפים **קיימים** עם נתיבים כמו `/uploads/...` ימשיכו לעבוד (Netlify מפנה ל-Railway).
