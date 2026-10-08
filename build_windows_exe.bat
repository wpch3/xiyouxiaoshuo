@echo off
chcp 65001 >nul
echo ========================================================
echo        AI Token Pet - Windows EXE 一键构建脚本
echo ========================================================
echo.

echo [1/4] 检查前端构建环境并打包 React UI 静态产物...
cd app
call npm install
call npm run build
cd ..

if not exist "app\dist\index.html" (
    echo [错误] 前端构建失败，未找到 app\dist\index.html
    pause
    exit /b 1
)
echo [成功] 前端 UI 产物已构建完毕！
echo.

echo [2/4] 检查 Python 运行与打包依赖...
python -m pip install --upgrade pip
python -m pip install pyinstaller pywebview

echo.
echo [3/4] 正在通过 PyInstaller 打包独立 Windows 可执行程序 AITokenPet.exe ...
pyinstaller --noconfirm --onedir --windowed --name "AITokenPet" --add-data "app\dist;dist" desktop_main.py

echo.
echo [4/4] 正在整理完整发布文件夹...
if exist "dist\AITokenPet\AITokenPet.exe" (
    echo.
    echo ========================================================
    echo  恭喜！打包完成！
    echo  可执行文件与完整运行 Data 已输出到:
    echo  dist\AITokenPet\
    echo.
    echo  双击运行: dist\AITokenPet\AITokenPet.exe
    echo ========================================================
) else (
    echo [警告] 未在 dist\AITokenPet 中检测到 exe，请检查上方控制台报错信息。
)

pause
