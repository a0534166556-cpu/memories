@echo off
chcp 65001 >nul
echo Adding all changes...
git add -A

echo Committing all changes...
git commit -m "Push all changes" || echo No changes to commit or already committed.

echo Pushing to GitHub...
git push

echo.
echo Done! All changes have been pushed.
pause
