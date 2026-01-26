@echo off
echo Finding process using port 8080...
echo.

netstat -ano | findstr :8080
echo.

echo To kill the process:
echo 1. Find the PID (last number in the line above)
echo 2. Run: taskkill /PID <PID> /F
echo.
echo Or press Ctrl+C in the terminal where the server is running
echo.

pause
