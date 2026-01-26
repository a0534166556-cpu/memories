@echo off
cd /d "%~dp0"
echo Fixing Netlify redirects configuration for static files...
git add netlify.toml
git commit -m "Fix: Improve Netlify redirects configuration for uploads and qrcodes proxy"
git push
echo Done! Redirects should now work correctly.
echo.
echo NOTE: If files still don't load, they may not exist on Railway (ephemeral filesystem).
echo Solution: Regenerate QR codes and re-upload images after Railway restarts.
pause
