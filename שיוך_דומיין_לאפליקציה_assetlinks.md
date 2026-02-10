# שיוך הדומיין לאפליקציה (Digital Asset Links)

כדי שגוגל יאשרו את האפליקציה וה־TWA יעבוד במלואו, האתר **memoriesman.netlify.app** חייב להיות משויך לאפליקציה באמצעות קובץ `assetlinks.json`.

---

## שלב 1 – קבלת טביעת האצבע SHA-256 של מפתח ההעלאה

**אפשרות א: מ־Play Console (הכי פשוט)**

1. היכנס ל־**Google Play Console** → האפליקציה **דף זיכרון דיגיטלי**.
2. בתפריט: **הגדרות** (Setup) → **App integrity** (או **שלמות האפליקציה**).
3. גלול ל־**App signing** / **חתימת האפליקציה**.
4. תחת **Upload key certificate** (או **מפתח ההעלאה**) תמצא **SHA-256 certificate fingerprint**.
5. **העתק** את המחרוזת – נראית בערך כך:  
   `AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99`

**אפשרות ב: מהמחשב (keytool)**

1. פתח **Command Prompt** (cmd) – לא PowerShell.
2. הרץ:
   ```bat
   cd /d "C:\Users\a0534\OneDrive\שולחן העבודה\play-keys"
   keytool -list -v -keystore new-upload.keystore -alias upload
   ```
3. הזן את סיסמת ה־keystore כשיתבקש.
4. בפלט, חפש את השורה שמתחילה ב־**SHA256:**.
5. **העתק** את הטביעה – כל השורה אחרי "SHA256:" (עם הנקודותיים, למשל `AA:BB:CC:...`).

---

## שלב 2 – עדכון הקובץ בפרויקט

1. פתח את הקובץ:
   ```
   memories\frontend\public\.well-known\assetlinks.json
   ```
2. מצא את השורה:
   ```json
   "PUT_SHA256_HERE"
   ```
3. **החלף** את `PUT_SHA256_HERE` בטביעת ה־SHA-256 שהעתקת (בדיוק כמו שהיא, עם נקודותיים).
4. שמור את הקובץ.

**דוגמה** – אם הטביעה היא `A1:B2:C3:...`:
```json
"sha256_cert_fingerprints": [
  "A1:B2:C3:D4:E5:F6:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB"
]
```

---

## שלב 3 – פריסה (deploy) ל־Netlify

1. **ודא** שהקובץ נשמר ב־`frontend/public/.well-known/assetlinks.json`.
2. דחוף את השינויים ל־Git (commit + push), **או** בנה והעלה ל־Netlify כמו שאתה רגיל.
3. אחרי הפריסה, הקובץ אמור להיות זמין בכתובת:
   ```
   https://memoriesman.netlify.app/.well-known/assetlinks.json
   ```

---

## שלב 4 – בדיקה

1. פתח בדפדפן:
   ```
   https://memoriesman.netlify.app/.well-known/assetlinks.json
   ```
2. אמור להופיע JSON עם `package_name` ו־`sha256_cert_fingerprints` (עם הטביעה האמיתית שלך).
3. אם אתה רואה את הקובץ – השיוך מוגדר. אפשר לשלוח שוב את האפליקציה לבדיקה ב־Play Console.

---

## סיכום

| שלב | פעולה |
|-----|--------|
| 1 | להעתיק SHA-256 מ־Play Console (App integrity) או מ־keytool |
| 2 | להחליף `PUT_SHA256_HERE` ב־assetlinks.json בטביעה האמיתית |
| 3 | לשמור, לעשות commit + push (או deploy ל־Netlify) |
| 4 | לבדוק ש־https://memoriesman.netlify.app/.well-known/assetlinks.json נטען עם הטביעה הנכונה |

**חשוב:** הטביעה חייבת להיות של **מפתח ההעלאה** (upload key) – ה־**new-upload.keystore** – לא של מפתח אחר.
