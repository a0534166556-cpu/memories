@echo off
echo Pushing all fixes: token handling, mishnayot cleanup, database fix...
git add -A

echo Committing...
git commit -m "Fix: Token handling improvements + Remove Short Messages + Add mishnayot column + Better error messages"

echo Pushing to GitHub...
git push

echo Done! Netlify and Railway will rebuild in 2-3 minutes.
pause
