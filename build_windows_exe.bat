@echo off
title AI Token Pet - Windows 11 EXE 打包工具

echo ========================================================
echo        AI Token Pet - Windows 11 EXE 打包工具
echo ========================================================
echo.

echo [1/3] 正在检查 Python 环境...
python --version >nul 2>&1
if errorlevel 1 goto NoPython

for /f "tokens=*" %%v in ('python --version 2^>^&1') do set PY_VER=%%v
echo [OK] 找到 Python: %PY_VER%
goto CheckDist

:NoPython
echo [错误] 你的 Windows 系统中未检测到 Python 运行环境！
echo.
echo 解决办法:
echo 1. 请前往官网下载安装 Python (推荐 3.10 或 3.11):
echo    https://www.python.org/downloads/
echo 2. 安装时必须务必勾选底部的 [Add python.exe to PATH]
echo.
pause
exit /b 1

:CheckDist
echo.
echo [2/3] 检查前端界面 Data 静态资源...
if exist "app\dist\index.html" (
    echo [OK] 检测到已包含完整编译资源 app\dist\index.html，直接打包！
    goto InstallDeps
)

echo [*] 未发现预编译资源，尝试调用 npm 构建...
call cd app
call npm install
call npm run build
call cd ..

:InstallDeps
echo.
echo [3/3] 安装打包依赖 (pywebview 与 pyinstaller)...
python -m pip install -q pywebview pyinstaller

echo.
echo 正在编译生成独立 Windows 桌面软件 AITokenPet.exe ...
pyinstaller --noconfirm --onedir --windowed --name "AITokenPet" --add-data "app/dist;dist" desktop_main.py

echo.
if exist "dist\AITokenPet\AITokenPet.exe" (
    echo ========================================================
    echo   恭喜！Windows 11 桌面程序打包成功！
    echo   程序路径: dist\AITokenPet\AITokenPet.exe
    echo   完整 Data 资源已全部内嵌，双击即可运行！
    echo ========================================================
    echo.
    explorer "dist\AITokenPet"
) else (
    echo [错误] 打包未能生成目标文件，请查看上方输出信息。
)

echo.
pause
