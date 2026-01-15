@echo off
echo Adding all files...
git add -A

echo Committing changes...
git commit -m "Update all changes: Popular Tehilim chapters, Mishnayot feature, UI updates, PWA version update"

echo Pushing to GitHub...
git push

echo Done! Netlify will rebuild in 2-3 minutes.
pause
