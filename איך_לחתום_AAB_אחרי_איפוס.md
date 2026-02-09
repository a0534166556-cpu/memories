# איך ליצור ולחתום AAB אחרי איפוס המפתח

## אחרי שגוגל מאשרים את איפוס מפתח ההעלאה

### שלב 1 – יצירת AAB חדש

1. היכנס ל־**https://www.pwabuilder.com**
2. הזן את כתובת האתר (הכתובת ב-Netlify של דפי זיכרון)
3. בחר **Package for stores** → **Google Play**
4. הורד את חבילת Google Play (ZIP)

5. **אם PWA Builder נותן להזין Keystore:**
   - השתמש ב־**new-upload.keystore** (מהתיקייה play-keys על שולחן העבודה)
   - **Alias:** `upload`
   - **סיסמה:** הסיסמה שבחרת כשיצרת את new-upload.keystore
   - אחרי בניית החבילה – ה-AAB כבר יהיה חתום. עוברים לשלב 3.

6. **אם PWA Builder נותן AAB לא חתום** (או קובץ .aab בתוך ה-ZIP) – עוברים לשלב 2.

---

### שלב 2 – חתימת AAB ידנית (אם קיבלת AAB לא חתום)

פתח **Command Prompt** או **PowerShell**.

**א.** עבור לתיקייה שבה נמצא **new-upload.keystore** (למשל play-keys):
```bat
cd "C:\Users\a0534\OneDrive\שולחן העבודה\play-keys"
```

**ב.** העתק את קובץ ה־AAB לתיקייה הזו (או כתוב את הנתיב המלא אליו בפקודה הבאה).

**ג.** הרץ (החלף `שם_הקובץ.aab` בשם האמיתי של ה-AAB):
```bat
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore new-upload.keystore "שם_הקובץ.aab" upload
```

**ד.** כשמבקשים – הזן את **סיסמת new-upload.keystore**.

**ה.** ה-AAB עכשיו חתום. הקובץ נשאר באותו שם; החתימה מעודכנת בתוכו.

---

### שלב 3 – העלאה ל-Google Play

1. **Play Console** → **בדיקה ופרסום** → **בדיקה פנימית** (או רצועה אחרת)
2. **יצירת גרסה** → **העלאת App Bundle**
3. בחר את קובץ ה־**AAB** שחתמת עם **new-upload.keystore**
4. שמור ופרסם

---

## סיכום

| מה | איפה |
|----|------|
| Keystore לחתימה | **new-upload.keystore** (תיקיית play-keys) |
| Alias | **upload** |
| סיסמה | זו שבחרת כשיצרת את new-upload.keystore |

**חשוב:** כל גרסה עתידית שתעלה ל-Play חייבת להיות חתומה עם **new-upload.keystore**. שמור את הקובץ והסיסמה במקום בטוח.
