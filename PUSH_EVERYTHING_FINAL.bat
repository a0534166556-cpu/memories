@echo off
echo Pushing all fixes...
git add -A

echo Committing all changes...
git commit -m "Fix: Authorization header forwarding + Mishnayot cleanup + Token handling improvements"

echo Pushing to GitHub...
git push

echo Done! Netlify will rebuild in 2-3 minutes.
echo After rebuild, check if payment works.
pause
