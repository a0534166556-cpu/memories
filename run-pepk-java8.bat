@echo off
chcp 65001 >nul
echo === הרצת PEPK עם Java 8 ===
echo.

set "JAVA8=C:\Program Files\Eclipse Adoptium\jdk-8.0.472.8-hotspot\bin\java.exe"
set "SOURCE=C:\Users\a0534\Downloads\דפי זיכרון - Google Play package (3)\source"
set "PEM=C:\Users\a0534\Downloads\encryption_public_key.pem"

if not exist "%JAVA8%" (
    echo שגיאה: Java 8 לא נמצא בנתיב.
    echo חפש את java.exe בתיקיית Eclipse Adoptium ותקן את JAVA8 בסקריפט.
    pause
    exit /b 1
)

if not exist "%SOURCE%\pepk.jar" (
    echo שגיאה: pepk.jar לא נמצא ב: %SOURCE%
    echo העתק את pepk.jar לתיקיית source.
    pause
    exit /b 1
)

if not exist "%PEM%" (
    echo שגיאה: encryption_public_key.pem לא נמצא ב: %PEM%
    echo הורד מקונסול Google Play והנח ב-Downloads.
    pause
    exit /b 1
)

:: מצא keystore (signingKey או upload-key וכו')
set "KEYSTORE="
if exist "%SOURCE%\signingKey.keystore" set "KEYSTORE=%SOURCE%\signingKey.keystore"
if exist "%SOURCE%\upload-key.keystore" set "KEYSTORE=%SOURCE%\upload-key.keystore"
if exist "%SOURCE%\release.keystore" set "KEYSTORE=%SOURCE%\release.keystore"
if "%KEYSTORE%"=="" (
    echo שגיאה: לא נמצא קובץ .keystore בתיקיית source.
    dir /b "%SOURCE%\*.keystore" 2>nul
    pause
    exit /b 1
)

echo Java 8: %JAVA8%
echo Keystore: %KEYSTORE%
echo Output: %SOURCE%\private_key.zip
echo.
echo כשמבקשים סיסמה - הזן את סיסמת ה-keystore (אותה סיסמה פעמיים אם שואלים).
echo.

cd /d "%SOURCE%"
"%JAVA8%" -jar pepk.jar --keystore="%KEYSTORE%" --alias=my-key-alias --output="%SOURCE%\private_key.zip" --include-cert --rsa-aes-encryption --encryption-key-path="%PEM%"

if %ERRORLEVEL% neq 0 (
    echo.
    echo PEPK הסתיים בשגיאה. אולי ה-alias שונה - נסה my-key-alias / upload / key0.
    pause
    exit /b 1
)

echo.
echo הושלם. הקובץ נוצר: %SOURCE%\private_key.zip
echo העלה אותו ל-Google Play Console ^> App signing ^> Upload new key.
pause
