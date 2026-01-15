@echo off
chcp 65001 >nul
echo ============================================
echo דוחף את כל השינויים החדשים ל-GitHub
echo ============================================
echo.

cd /d "%~dp0"

echo [1/5] מוסיף קבצים חדשים...
git add frontend/src/pages/About.jsx
git add frontend/src/pages/About.css
git add frontend/src/pages/Pricing.jsx
git add frontend/src/pages/Pricing.css
git add frontend/src/pages/Login.jsx
git add frontend/src/pages/Login.css
git add frontend/src/pages/PaymentSuccess.jsx
git add frontend/src/pages/PaymentSuccess.css
git add frontend/src/pages/PaymentCancel.jsx
git add frontend/src/pages/SaveMemorial.jsx
git add frontend/src/pages/SaveMemorial.css

echo [2/5] מעדכן קבצים קיימים...
git add frontend/src/pages/CreateMemorial.jsx
git add frontend/src/pages/CreateMemorial.css
git add frontend/src/pages/Gallery.jsx
git add frontend/src/pages/Gallery.css
git add frontend/src/pages/MemorialPage.jsx
git add frontend/src/pages/MemorialPage.css
git add frontend/src/pages/Home.jsx
git add frontend/src/App.jsx

echo [3/5] מעדכן backend...
git add backend/server.js
git add backend/package.json

echo.
echo [4/5] מציג מה נוסף...
git status --short

echo.
echo [5/5] יוצר commit...
git commit -m "Add new features: About, Pricing, Login, SaveMemorial, PaymentSuccess, PaymentCancel + Authentication + PayPal Integration + Expiry Warnings" || echo Commit failed or no changes to commit

echo.
echo ============================================
echo סיימתי! עכשיו תצטרך להריץ: git push
echo ============================================
echo.
pause
