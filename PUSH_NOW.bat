@echo off
echo Adding all changes...
git add -A

echo Committing...
git commit -m "Fix: Authorization header forwarding in Netlify Function + other updates"

echo Pushing to GitHub...
git push

echo.
echo Done! Netlify will rebuild in 2-3 minutes.
echo Wait for Netlify to finish, then try the payment again.
pause
