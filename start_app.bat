@echo off
echo Starting Dental App...
echo.

REM Kill any existing processes
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1

echo Starting API Server...
start "API Server" cmd /c "python api_app.py"

echo Waiting for API to start...
timeout /t 5 >nul

echo Starting React Frontend...
cd frontend
start "React App" cmd /c "npm start"

echo.
echo Both servers are starting...
echo API Server: http://localhost:5001
echo React App: http://localhost:3000
echo.
echo Login with:
echo Email: mhanna-aj@hotmail.com
echo Password: password123
echo.
pause 