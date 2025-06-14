@echo off
echo Starting PDFMasterTool2 servers...

echo.
echo Starting API Server on port 5001...
start "API Server" cmd /k "python api_app.py"

echo.
echo Waiting 3 seconds for API server to start...
timeout /t 3 /nobreak > nul

echo.
echo Starting React Frontend on port 3000...
start "React Frontend" cmd /k "cd frontend && npm start"

echo.
echo Both servers are starting...
echo API Server: http://localhost:5001
echo React Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause > nul 