@echo off
cd /d "%~dp0"
echo Fixing image paths in MemorialPage to ensure they work with Netlify redirects...
git add frontend/src/pages/MemorialPage.jsx backend/server.js PUSH_FIX_QR_CODE_URL.bat PUSH_FIX_EDIT_MEMORIAL_FORM.bat PUSH_FIX_IMAGE_PATHS_MEMORIAL_PAGE.bat
git commit -m "Fix: Normalize image/video/QR code paths in MemorialPage to work with Netlify redirects"
git push
echo Done! Images and QR codes should now load correctly on memorial pages.
pause
