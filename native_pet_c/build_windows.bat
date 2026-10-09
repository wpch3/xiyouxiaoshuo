@echo off
REM 构建 Windows 原生桌宠 exe。优先 MinGW-w64 gcc；没有则尝试 MSVC cl。
REM 输出：native_pet_c\build\AITokenPetC.exe
setlocal
cd /d "%~dp0"
if not exist build mkdir build

where gcc >nul 2>nul
if %errorlevel%==0 (
  echo [build] MinGW-w64 gcc
  gcc -std=c99 -O2 -Wall -Wextra -Iinclude -municode -mwindows -DUNICODE -D_UNICODE ^
      src\pet_win32.c src\pet_core.c -o build\AITokenPetC.exe -lgdiplus -lshell32 -luser32 -lgdi32 -lmsimg32
  goto :after
)

where cl >nul 2>nul
if %errorlevel%==0 (
  echo [build] MSVC cl
  cl /nologo /utf-8 /W3 /O2 /DUNICODE /D_UNICODE /Iinclude src\pet_win32.c src\pet_core.c ^
     /Fe:build\AITokenPetC.exe /link /SUBSYSTEM:WINDOWS user32.lib gdi32.lib gdiplus.lib shell32.lib msimg32.lib
  goto :after
)

echo [error] 未找到 gcc（MinGW-w64）或 cl（MSVC）。请安装其一后重试。
exit /b 1

:after
if errorlevel 1 (
  echo [error] 编译失败
  exit /b 1
)
echo [ok] build\AITokenPetC.exe
echo 运行示例：build\AITokenPetC.exe  （素材目录默认查找 app\public\characters\deepseek_layers）
endlocal
