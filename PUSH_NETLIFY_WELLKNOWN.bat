@echo off
cd /d "%~dp0"

echo Pushing netlify.toml - .well-known redirect for assetlinks...
echo.

git add netlify.toml frontend/public/well-known/assetlinks.json
git status

echo.
set /p confirm="Push? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo Cancelled.
    pause
    exit /b 0
)

git commit -m "Netlify: serve assetlinks from well-known path"
git push

echo.
echo Done. After deploy, check: https://memoriesman.netlify.app/.well-known/assetlinks.json
echo.
pause
