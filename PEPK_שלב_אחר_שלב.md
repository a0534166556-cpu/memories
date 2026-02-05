# העלאת מפתח החתימה ל-Google Play – שלב אחר שלב

## שלב 1: להתקין Java 11

1. נכנסים לאתר: **https://adoptium.net**
2. בוחרים: **Version: 11 (LTS)** | **Operating System: Windows** | **Architecture: x64**
3. לוחצים **Download** ומורידים את הקובץ (למשל `.msi`)
4. פותחים את הקובץ שהורדת ומריצים **התקנה** (Next → Next)
5. בסוף ההתקנה – סוגרים

---

## שלב 2: לפתוח PowerShell בתיקייה pepk-run

1. פותחים **סייר הקבצים** (Windows + E)
2. עוברים לתיקייה: **שולחן העבודה** → **pepk-run**
3. **בתוך** התיקייה pepk-run – לוחצים עם הכפתור הימני על ריק
4. בוחרים **"פתח בחלון PowerShell כאן"** או **"Open in Terminal"**
5. נפתח חלון שחור (PowerShell) והשורה מתחילה ב־`PS ...\pepk-run>`

---

## שלב 3: להריץ את PEPK עם Java 11

1. ב־PowerShell מקלידים או מעתיקים את השורה הזו (להחליף את המספר בגרסה אם שונה):

```
"C:\Program Files\Eclipse Adoptium\jdk-11.0.25.11-hotspot\bin\java.exe" -jar "pepk (1).jar" --keystore=signing.keystore --alias=my-key-alias --output=private_key.zip --include-cert --rsa-aes-encryption --encryption-key-path="encryption_public_key (1).pem"
```

2. אם יש שגיאה "הנתיב לא נמצא" – לבדוק מה שם התיקייה:
   - נכנסים ל־**מחשב** → **C:** → **Program Files** → **Eclipse Adoptium**
   - רואים תיקייה כמו `jdk-11.0.25.11-hotspot` או `jdk-17.0.x`
   - מעתיקים את **השם המדויק** של התיקייה ומחליפים בחלק `jdk-11.0.25.11-hotspot` בפקודה

3. לוחצים **Enter**

4. אם מבקשים **Keystore password** – מקלידים את הסיסמה של ה־keystore (נמצאת בקובץ **signing-key-info** בתיקיית החבילה 4) ולוחצים Enter

5. אם הכל עבד – יופיע משהו כמו "Done" ובתיקייה pepk-run ייווצר קובץ **private_key.zip**

---

## שלב 4: להעלות את private_key.zip ל-Google Play

1. נכנסים ל־**Google Play Console** בדפדפן
2. בוחרים את האפליקציה **דפי זיכרון**
3. בתפריט השמאלי: **הגדרה** או **בדיקה ופרסום** → **ניהול ההגנה על תקינות האפליקציה** (App integrity)
4. לוחצים **חתימת אפליקציה** (App signing)
5. באותו מסך – מחפשים **"העלאת קובץ ה-ZIP שנוצר"** או **"Upload the generated ZIP file"**
6. לוחצים **העלאה** ובוחרים את הקובץ **private_key.zip** מתוך התיקייה **pepk-run**
7. לוחצים **שמירה** / **Save**
8. מחכים שגוגל יאשרו (לרוב מיידי)

---

## שלב 5: להעלות את קובץ ה-AAB

1. ב־Play Console עוברים ל־**בדיקה ופרסום** → **בדיקות בקבוצות מוגדרות** → **יצירת גרסה** (או עריכת הגרסה הקיימת)
2. בחלק **"קובצי App Bundle"** לוחצים **העלאה** או גרירת קובץ
3. בוחרים את **דפי זיכרון דיגיטלים.aab** (מתוך החבילה "Google Play package (4)")
4. ממלאים **שם גרסה** (למשל 1.0.0)
5. לוחצים **שמירה** / **הבא**

אם המפתח אושר בשלב 4 – העלאת ה־AAB אמורה לעבור בלי שגיאת "מפתח שגוי".
