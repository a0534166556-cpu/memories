@echo off
chcp 65001 >nul
echo ============================================
echo מוסיף את כל השינויים החדשים ל-Git
echo ============================================
echo.

cd /d "%~dp0"

echo [1/3] מוסיף את כל הקבצים...
git add -A

echo.
echo [2/3] מציג מה נוסף...
git status --short

echo.
echo [3/3] יוצר commit...
git commit -m "Add new features: About, Pricing, Login, SaveMemorial, PaymentSuccess, PaymentCancel + Authentication + PayPal Integration + Expiry Warnings + Update pricing: 100₪ annual, 400₪ lifetime with edit, 330₪ lifetime without edit + Remove pricing link from home"

if %errorlevel% equ 0 (
    echo.
    echo ============================================
    echo Commit נוצר בהצלחה!
    echo עכשיו תצטרך להריץ: git push
    echo ============================================
) else (
    echo.
    echo ============================================
    echo אין שינויים חדשים ל-commit או שיש שגיאה
    echo ============================================
)

echo.
pause
