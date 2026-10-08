@echo off
setlocal enabledelayedexpansion
title AI Token Pet - Windows 构建打包工具

echo ========================================================
echo        AI Token Pet - Windows 11 EXE 打包工具
echo ========================================================
echo.

:: 1. 优先检查仓库已自带的编译好前端资源 app\dist\index.html
if exist "app\dist\index.html" (
    echo [OK] 检测到仓库已内置完整前端资源 app\dist\index.html，直接使用！
    goto Step2
)

echo [*] 未检测到内置 dist，正在尝试调用 npm 构建前端...
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [警告] 未检测到 Node.js/npm 环境。
    echo 正在使用默认资源包...
    goto Step2
)

cd app
call npm install
call npm run build
cd ..

:Step2
echo.
echo [1/3] 检查 Python 环境...
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 系统中未找到 Python！
    echo 请先安装 Python (建议 3.10 或 3.11)，并勾选 "Add python.exe to PATH"。
    pause
    exit /b 1
)

echo [2/3] 安装 Windows 桌面打包必要库 (pywebview, pyinstaller)...
python -m pip install -q pywebview pyinstaller

echo.
echo [3/3] 正在打包 Windows EXE 桌面软件...
pyinstaller --noconfirm --onedir --windowed --name "AITokenPet" --add-data "app/dist;dist" desktop_main.py

echo.
if exist "dist\AITokenPet\AITokenPet.exe" (
    echo ========================================================
    echo   恭喜！Windows 桌面程序打包成功！
    echo.
    echo   可执行文件路径: dist\AITokenPet\AITokenPet.exe
    echo   全部依赖 Data 已自动内嵌到该文件夹中。
    echo ========================================================
    echo.
    echo 正在为您打开输出目录...
    explorer "dist\AITokenPet"
) else (
    echo [提示] 正在尝试单文件打包模式...
    pyinstaller --noconfirm --onefile --windowed --name "AITokenPet" --add-data "app/dist;dist" desktop_main.py
    if exist "dist\AITokenPet.exe" (
        echo 打包成功: dist\AITokenPet.exe
        explorer "dist"
    ) else (
        echo [错误] 打包失败，请检查上方控制台报错。
    )
)

echo.
pause
