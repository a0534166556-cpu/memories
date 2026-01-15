@echo off
echo ============================================
echo Pushing all changes to GitHub
echo ============================================
echo.

cd /d "%~dp0"

echo [1/4] Adding all files...
git add -A

echo.
echo [2/4] Showing what was added...
git status --short

echo.
echo [3/4] Creating commit...
git commit -m "Add new features: About, Pricing, Login, SaveMemorial, PaymentSuccess, PaymentCancel + Authentication + PayPal Integration + Expiry Warnings + Update pricing: 100 annual, 400 lifetime with edit, 330 lifetime without edit + Remove pricing link from home"

if %errorlevel% neq 0 (
    echo.
    echo ============================================
    echo Error creating commit - maybe no new changes
    echo ============================================
    pause
    exit /b
)

echo.
echo [4/4] Pushing to GitHub...
git push

if %errorlevel% equ 0 (
    echo.
    echo ============================================
    echo Success! All changes pushed to GitHub
    echo ============================================
) else (
    echo.
    echo ============================================
    echo Error pushing to GitHub - check connection
    echo ============================================
)

echo.
pause
