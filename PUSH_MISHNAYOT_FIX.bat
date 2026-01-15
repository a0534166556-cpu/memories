@echo off
echo Removing old Short Messages code and fixing Mishnayot display...
git add frontend/src/pages/MemorialPage.jsx frontend/src/pages/MemorialPage.css

echo Committing...
git commit -m "Remove Short Messages section - keep only Mishnayot (Jewish texts)"

echo Pushing to GitHub...
git push

echo Done! Netlify will rebuild in 2-3 minutes.
pause
