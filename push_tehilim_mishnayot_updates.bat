@echo off
echo Adding all changes...
git add -A

echo Committing changes...
git commit -m "Add popular Tehilim chapters (16, 32, 41, 49, 72, 103, 150) + Update external links in TehilimReader and MishnayotReader + Change button text to 'Create memory page now'"

echo Pushing to repository...
git push

echo Done!
pause
