@echo off
echo Starting SkillNest Services...
echo.

echo [0/8] Starting Docker (Postgres + Redis + Elasticsearch)...
docker-compose up -d
timeout /t 5 /nobreak >nul

echo [1/8] Starting Auth Service (Port 4006)...
start "Auth-Service" cmd /k "cd /d c:\Users\LENOVO\Desktop\skillnest\services\auth-service && node index.js"
timeout /t 3 /nobreak >nul

echo [2/8] Starting Gateway (Port 4000)...
start "Gateway" cmd /k "cd /d c:\Users\LENOVO\Desktop\skillnest\gateway && node index.js"
timeout /t 2 /nobreak >nul

echo [3/8] Starting User Service (Port 4001)...
start "User-Service" cmd /k "cd /d c:\Users\LENOVO\Desktop\skillnest\services\user-service && node src/index.js"
timeout /t 2 /nobreak >nul

echo [4/8] Starting Follow Service (Port 4002)...
start "Follow-Service" cmd /k "cd /d c:\Users\LENOVO\Desktop\skillnest\services\follow-service && node src/index.js"
timeout /t 2 /nobreak >nul

echo [5/8] Starting Connect Service (Port 4003)...
start "Connect-Service" cmd /k "cd /d c:\Users\LENOVO\Desktop\skillnest\services\connect-service && node src/index.js"
timeout /t 2 /nobreak >nul

echo [6/8] Starting Chat Service (Port 4004)...
start "Chat-Service" cmd /k "cd /d c:\Users\LENOVO\Desktop\skillnest\services\chat-service && node src/index.js"
timeout /t 2 /nobreak >nul

echo [7/8] Starting Search Service (Port 4005)...
start "Search-Service" cmd /k "cd /d c:\Users\LENOVO\Desktop\skillnest\services\search-service && node src/index.js"
timeout /t 2 /nobreak >nul

echo [8/8] Starting Next.js Client (Port 3000)...
start "Next.js-Client" cmd /k "cd /d c:\Users\LENOVO\Desktop\skillnest\client && npm run dev"

echo.
echo ========================================
echo All services started!
echo ========================================
echo Gateway:         http://localhost:4000
echo Auth Service:    http://localhost:4006
echo User Service:    http://localhost:4001
echo Follow Service:  http://localhost:4002
echo Connect Service: http://localhost:4003
echo Chat Service:    http://localhost:4004
echo Search Service:  http://localhost:4005
echo Frontend:        http://localhost:3000
echo ========================================
echo.
pause
