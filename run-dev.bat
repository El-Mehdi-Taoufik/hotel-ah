@echo off
echo Starting Hotel Management System Development Servers...
echo.

echo Starting Backend Server...
cd backend\Hotel.API
start dotnet run

echo.
echo Starting Frontend Server...
cd ..\..
start npm run dev

echo.
echo Both servers are starting...
echo Backend: http://localhost:5134
echo Frontend: http://localhost:3000
echo.
echo Press any key to stop both servers...
pause

echo.
echo Stopping servers...
taskkill /F /IM dotnet.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
echo Servers stopped.