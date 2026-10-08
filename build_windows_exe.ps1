<#
.SYNOPSIS
    AI Token Pet - Windows 11 PowerShell 自动化打包工具
#>

$ErrorActionPreference = "Continue"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "       AI Token Pet - Windows 11 一键打包工具 (PowerShell)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检查 Python
Write-Host "[1/3] 正在检查系统 Python 环境..." -ForegroundColor Cyan
$pyCmd = Get-Command python -ErrorAction SilentlyContinue

if (-not $pyCmd) {
    Write-Host "[错误] 你的系统尚未安装 Python 或未添加至环境变量 PATH！" -ForegroundColor Red
    Write-Host ""
    Write-Host "请按以下步骤安装 Python:" -ForegroundColor Yellow
    Write-Host "1. 打开浏览器下载 Python: https://www.python.org/downloads/" -ForegroundColor Yellow
    Write-Host "2. 安装第一步务必勾选底部的 [Add python.exe to PATH]" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "按回车键退出..."
    exit 1
}

$pyVersion = (& python --version 2>&1)
Write-Host "[OK] 检测到 Python: $pyVersion" -ForegroundColor Green

# 2. 检查前端静态资源 Data
Write-Host ""
Write-Host "[2/3] 检查前端界面 Data 资源..." -ForegroundColor Cyan
if (Test-Path "app\dist\index.html") {
    Write-Host "[OK] 检测到已包含完整编译资源 app\dist\index.html，直接打包！" -ForegroundColor Green
} else {
    Write-Host "[*] 正在通过 npm 构建前端 UI 产物..." -ForegroundColor Yellow
    Set-Location app
    npm install
    npm run build
    Set-Location ..
}

# 3. 安装 PyInstaller & PyWebView
Write-Host ""
Write-Host "[3/3] 安装打包依赖 (pyinstaller, pywebview)..." -ForegroundColor Cyan
python -m pip install -q pyinstaller pywebview

# 4. 打包 Windows EXE
Write-Host ""
Write-Host "正在编译生成 Windows 桌面软件 AITokenPet.exe ..." -ForegroundColor Cyan
pyinstaller --noconfirm --onedir --windowed --name "AITokenPet" --add-data "app/dist;dist" desktop_main.py

$targetExe = "dist\AITokenPet\AITokenPet.exe"
if (Test-Path $targetExe) {
    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "   恭喜！Windows 11 桌面程序打包成功！" -ForegroundColor Green
    Write-Host "   生成路径: $targetExe" -ForegroundColor White
    Write-Host "   所有拟人立绘、皮肤与交互 Data 已全部就绪！" -ForegroundColor White
    Write-Host "========================================================" -ForegroundColor Green
    Invoke-Item "dist\AITokenPet"
} else {
    Write-Host "[错误] 未能生成 EXE 文件，请检查上方控制台报错。" -ForegroundColor Red
}

Write-Host ""
Read-Host "按回车键退出..."
