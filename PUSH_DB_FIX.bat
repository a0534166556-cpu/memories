@echo off
echo Adding database fix for mishnayot column...
git add backend/server.js

echo Committing...
git commit -m "Fix: Add mishnayot column to database schema"

echo Pushing to GitHub...
git push

echo Done! Railway will rebuild and add the column automatically.
pause
