<#
.SYNOPSIS
    AI Token Pet - Windows 11 PowerShell 一键打包脚本
.DESCRIPTION
    无需配编码，原生 Windows PowerShell 脚本，自动安装 PyInstaller 和 PyWebView 并打包 EXE
#>

$ErrorActionPreference = "Stop"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "       AI Token Pet - Windows 11 一键打包工具 (PowerShell)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检查前端静态产物
if (Test-Path "app\dist\index.html") {
    Write-Host "[OK] 检测到已包含完整编译资源 app\dist\index.html" -ForegroundColor Green
} else {
    Write-Host "[*] 正在构建前端 UI..." -ForegroundColor Yellow
    Set-Location app
    npm install
    npm run build
    Set-Location ..
}

# 2. 检查 Python
Write-Host "[1/3] 检查 Python 运行环境..." -ForegroundColor Cyan
try {
    $pythonVersion = python --version
    Write-Host "Python 版本: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "[错误] 系统未安装 Python 或未加入环境变量 PATH！" -ForegroundColor Red
    Write-Host "请前往 python.org 安装 Python，并勾选 'Add python.exe to PATH'" -ForegroundColor Yellow
    Read-Host "按回车键退出..."
    exit 1
}

# 3. 安装依赖库
Write-Host "[2/3] 安装/更新打包依赖 (pyinstaller, pywebview)..." -ForegroundColor Cyan
python -m pip install -q pyinstaller pywebview

# 4. 执行 PyInstaller 打包
Write-Host "[3/3] 正在生成独立的 Windows 可执行文件 AITokenPet.exe..." -ForegroundColor Cyan
pyinstaller --noconfirm --onedir --windowed --name "AITokenPet" --add-data "app/dist;dist" desktop_main.py

$targetExe = "dist\AITokenPet\AITokenPet.exe"
if (Test-Path $targetExe) {
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "   恭喜！Windows 11 桌面程序打包成功！" -ForegroundColor Green
    Write-Host "   EXE 路径: $targetExe" -ForegroundColor White
    Write-Host "   包含完整 Data 资源，双击即可运行桌面伴侣！" -ForegroundColor White
    Write-Host "========================================================" -ForegroundColor Green
    Invoke-Item "dist\AITokenPet"
} else {
    Write-Host "[错误] 未能成功生成 EXE，请检查上方输出信息。" -ForegroundColor Red
}

Read-Host "打包完毕，按回车键退出..."
