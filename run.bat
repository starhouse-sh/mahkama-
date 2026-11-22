@echo off
title دائرة 32 - تشغيل السيرفر
color 0A
echo ========================================
echo   تشغيل نظام دائرة 32 - الجلسات
echo ========================================
echo.

REM جرب بايثون الأول
python --version >nul 2>&1
if %errorlevel%==0 (
    echo ✅ تم العثور على Python
    echo 🌐 الرابط: http://localhost:8000/index.html
    echo.
    start http://localhost:8000/index.html
    python -m http.server 8000
    goto :end
)

REM لو مفيش بايثون جرب Node
npx --version >nul 2>&1
if %errorlevel%==0 (
    echo ✅ تم العثور على Node.js
    echo 🌐 الرابط: http://localhost:8000/index.html
    echo.
    start http://localhost:8000/index.html
    npx http-server -p 8000
    goto :end
)

echo ❌ لا يوجد Python ولا Node.js
echo نزل Python من: https://www.python.org/downloads/
pause

:end