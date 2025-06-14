@echo off
echo Starting Dental App Servers...
echo.

REM Kill any existing Python processes
taskkill /F /IM python.exe >nul 2>&1

REM Start API server in background
echo Starting API Server on port 5001...
start "API Server" cmd /c "python api_app.py"

REM Wait a moment for API to start
timeout /t 3 >nul

REM Start React frontend
echo Starting React Frontend...
cd frontend
start "React Frontend" cmd /c "npm start"

echo.
echo Both servers are starting...
echo API Server: http://localhost:5001
echo React App: http://localhost:3000 or http://localhost:3001
echo.
echo Press any key to stop all servers...
pause >nul

REM Kill all processes when done
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
echo Servers stopped. 