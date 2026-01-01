# 🔧 תיקון שגיאת Build ב-Netlify

## הבעיה
```
terser not found. Since Vite v3, terser has become an optional dependency.
```

## הפתרון
שיניתי את `minify: 'terser'` ל-`minify: 'esbuild'` ב-`frontend/vite.config.js`

## מה לעשות עכשיו

### שלב 1: העלה את השינוי ל-GitHub

פתח Terminal בתיקיית הפרויקט והרץ:

```bash
git add frontend/vite.config.js
git commit -m "Fix: Change minify from terser to esbuild for Netlify build"
git push
```

### שלב 2: Netlify יעשה Deploy אוטומטי

אחרי שהקוד עלה ל-GitHub:
- Netlify יזהה את השינוי
- יעשה Deploy אוטומטי
- הפעם זה אמור לעבוד!

---

## אם עדיין יש שגיאה

בדוק את ה-Logs ב-Netlify ושלח לי את השגיאה.


