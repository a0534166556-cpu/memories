# 🔍 איך לבדוק לוגים של Netlify Functions

## שלב 1: היכנס ל-Netlify Dashboard
1. פתח: https://app.netlify.com
2. היכנס לחשבון שלך

## שלב 2: בחר את ה-site
1. לחץ על "Sites"
2. בחר את ה-site שלך: `memoriesman` (או איך שהוא נקרא)

## שלב 3: לך ל-Functions
1. בתפריט הצד לחץ על **"Functions"** (או "Serverless Functions")
2. תראה רשימה של functions
3. לחץ על **"api"** (זה ה-function הראשי)

## שלב 4: בדוק את הלוגים
1. לחץ על טאב **"Logs"** (או "Invocations")
2. תראה רשימה של כל ה-invocations
3. לחץ על האחרון (הכי למעלה)

## שלב 5: חפש את הלוגים שלנו
חפש הודעות שמתחילות ב:
- `🔵🔵🔵 FUNCTION CALLED!`
- `📋📋📋 ALL HEADERS KEYS:`
- `🔑🔑🔑 Authorization header value:`
- `❌❌❌ NO Authorization header in request!`

## שלב 6: העתק הכל
העתק את כל הלוגים מה-Function, במיוחד:
1. כל ה-headers שנקלטו
2. האם Authorization header נמצא או לא
3. מה ה-URL של הבקשה

---

## 💡 טיפ:
אם לא רואה function בשם "api":
- יכול להיות שהוא נקרא אחרת
- או שהוא לא נדחף עדיין

אם לא רואה לוגים חדשים:
- בדוק שהבנייה הסתיימה ב-Netlify
- נסה לעשות request חדש (ליצור תשלום)
- רענן את דף ה-Logs
