@echo off
cd /d "%~dp0"

echo Pushing assetlinks for Play Console...
echo.

git add frontend/public/.well-known/assetlinks.json
git add *assetlinks*.md
git status

echo.
set /p confirm="Push these changes? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo Cancelled.
    pause
    exit /b 0
)

git commit -m "Add assetlinks.json for Play Console domain verification"
git push

echo.
echo Done. After Netlify deploys, check:
echo https://memoriesman.netlify.app/.well-known/assetlinks.json
echo.
pause
