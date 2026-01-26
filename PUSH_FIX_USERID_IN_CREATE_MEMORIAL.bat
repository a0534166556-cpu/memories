@echo off
cd /d "%~dp0"
echo Fixing CreateMemorial to send Authorization header so userId is saved...
git add frontend/src/pages/CreateMemorial.jsx
git commit -m "Fix: Send Authorization header when creating memorial so userId is saved correctly"
git push
echo Done! Now new memorials will be associated with the logged-in user.
pause
