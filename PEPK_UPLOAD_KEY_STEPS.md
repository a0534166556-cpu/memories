# העלאת מפתח החתימה ל-Google Play (PEPK)

## מה לעשות – לפי המסך ב-Play Console

### שלב 1: הורדת מפתח ציבורי להצפנה
- ב-Play Console, באותו מסך "ייצוא והעלאה של מפתח ממאגר המפתחות של Java":
- לוחצים **"הורדת מפתח ציבורי להצפנה"** (Download public key for encryption).
- קובץ **encryption_public_key.pem** יורד. להעביר אותו למקום נוח, למשל:
  - `C:\pepk-run\`  
  או  
  - תיקיית ההורדות (Downloads).

### שלב 2: הורדת כלי PEPK
- לוחצים **"הורדת הכלי PEPK"** (Download PEPK tool).
- מורידים את **pepk.jar** (או קובץ ZIP שמכיל אותו).
- אם יורד ZIP – לחלץ ולוודא שיש **pepk.jar**.

### שלב 3: הכנת הקבצים
צריך באותה תיקייה (או עם נתיבים ברורים):
1. **pepk.jar**
2. **encryption_public_key.pem** (משלב 1)
3. **signing.keystore** – מתוך החבילה "Google Play package (4)" (או החבילה הנוכחית שלך).

אם ה-**signing.keystore** נמצא בתיקייה עם תווים בעברית (למשל "דפי זיכרון"), עדיף להעתיק את שלושת הקבצים לתיקייה עם נתיב באנגלית בלבד, למשל:  
`C:\pepk-run\`

### שלב 4: סיסמה ו-alias
- **סיסמת ה-keystore:** נמצאת בקובץ **signing-key-info** באותה חבילה (או זו שסיפק PWA Builder).
- **alias של המפתח:** ב-PWA Builder לרוב השם הוא **my-key-alias**. אם לא עובד, לנסות **upload** או **key0**.

### שלב 5: הרצת PEPK
פותחים **Command Prompt** או **PowerShell** ועוברים לתיקייה שבה נמצאים הקבצים (למשל `C:\pepk-run`).

**אם Java מותקן (גרסה 11 ומעלה):**
```cmd
java -jar pepk.jar --keystore=signing.keystore --alias=my-key-alias --output=private_key.zip --include-cert --rsa-aes-encryption --encryption-key-path=encryption_public_key.pem
```

**אם הקבצים לא באותה תיקייה** – להחליף בנתיבים מלאים:
- `--keystore=C:\pepk-run\signing.keystore`
- `--encryption-key-path=C:\pepk-run\encryption_public_key.pem`
- `--output=C:\pepk-run\private_key.zip`

כשמבקשים סיסמה – להזין את **סיסמת ה-keystore** (מהקובץ signing-key-info).

### שלב 6: העלאת הקובץ ל-Play Console
- אחרי שהפקודה מסתיימת בהצלחה נוצר **private_key.zip**.
- ב-Play Console באותו מסך: לוחצים **"העלאת קובץ ה-ZIP שנוצר"**.
- בוחרים את **private_key.zip** → שמירה.

אחרי שגוגל יאשרו את המפתח – להעלות את קובץ ה-**AAB** (דפי זיכרון דיגיטלים.aab) במסך "יצירת גרסה לבדיקות סגורות".
