#include "../include/DesktopPetApp.h"
#include <shellapi.h>
#include <wrl.h>
#include <wil/com.h>
#include <WebView2.h>
#include <iostream>

#define WM_TRAYICON (WM_USER + 1)
#define ID_TRAY_EXIT 1001
#define ID_TRAY_SHOW 1002
#define ID_TRAY_TOP  1003

using namespace Microsoft::WRL;

// 全局 WebView2 控制器指针
static ComPtr<ICoreWebView2Controller> g_webviewController;
static ComPtr<ICoreWebView2> g_webviewWindow;
static DesktopPetApp* g_appInstance = nullptr;

DesktopPetApp::DesktopPetApp(HINSTANCE hInstance)
    : m_hInstance(hInstance), m_hWnd(nullptr), m_alwaysOnTop(false) {
    g_appInstance = this;
    ZeroMemory(&m_nid, sizeof(m_nid));
}

DesktopPetApp::~DesktopPetApp() {
    RemoveSystemTray();
}

LRESULT CALLBACK DesktopPetApp::WndProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam) {
    switch (message) {
    case WM_SIZE:
        if (g_webviewController != nullptr) {
            RECT bounds;
            GetClientRect(hWnd, &bounds);
            g_webviewController->put_Bounds(bounds);
        }
        break;

    case WM_TRAYICON:
        if (lParam == WM_RBUTTONUP) {
            POINT curPoint;
            GetCursorPos(&curPoint);
            HMENU hMenu = CreatePopupMenu();
            InsertMenu(hMenu, 0, MF_BYPOSITION | MF_STRING, ID_TRAY_SHOW, L"显示桌宠");
            InsertMenu(hMenu, 1, MF_BYPOSITION | MF_STRING, ID_TRAY_TOP, L"切换窗口置顶");
            InsertMenu(hMenu, 2, MF_SEPARATOR, 0, NULL);
            InsertMenu(hMenu, 3, MF_BYPOSITION | MF_STRING, ID_TRAY_EXIT, L"退出 AI Token Pet");

            SetForegroundWindow(hWnd);
            TrackPopupMenu(hMenu, TPM_BOTTOMALIGN | TPM_LEFTALIGN, curPoint.x, curPoint.y, 0, hWnd, NULL);
            DestroyMenu(hMenu);
        } else if (lParam == WM_LBUTTONDBLCLK) {
            g_appInstance->RestoreFromTray();
        }
        break;

    case WM_COMMAND:
        switch (LOWORD(wParam)) {
        case ID_TRAY_SHOW:
            g_appInstance->RestoreFromTray();
            break;
        case ID_TRAY_TOP:
            g_appInstance->SetAlwaysOnTop(!g_appInstance->m_alwaysOnTop);
            break;
        case ID_TRAY_EXIT:
            DestroyWindow(hWnd);
            break;
        }
        break;

    case WM_DESTROY:
        PostQuitMessage(0);
        break;

    default:
        return DefWindowProc(hWnd, message, wParam, lParam);
    }
    return 0;
}

void DesktopPetApp::SetupSystemTray() {
    m_nid.cbSize = sizeof(NOTIFYICONDATA);
    m_nid.hWnd = m_hWnd;
    m_nid.uID = 1;
    m_nid.uFlags = NIF_ICON | NIF_MESSAGE | NIF_TIP;
    m_nid.uCallbackMessage = WM_TRAYICON;
    m_nid.hIcon = LoadIcon(NULL, IDI_APPLICATION);
    wcscpy_s(m_nid.szTip, L"AI Token Pet · 拟人桌面消费伴侣");
    Shell_NotifyIcon(NIM_ADD, &m_nid);
}

void DesktopPetApp::RemoveSystemTray() {
    Shell_NotifyIcon(NIM_DELETE, &m_nid);
}

void DesktopPetApp::SetAlwaysOnTop(bool top) {
    m_alwaysOnTop = top;
    SetWindowPos(m_hWnd, top ? HWND_TOPMOST : HWND_NOTOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE);
}

void DesktopPetApp::MinimizeToTray() {
    ShowWindow(m_hWnd, SW_HIDE);
}

void DesktopPetApp::RestoreFromTray() {
    ShowWindow(m_hWnd, SW_SHOW);
    SetForegroundWindow(m_hWnd);
}

bool DesktopPetApp::Initialize(int nCmdShow) {
    WNDCLASSEX wcex;
    wcex.cbSize = sizeof(WNDCLASSEX);
    wcex.style = CS_HREDRAW | CS_VREDRAW;
    wcex.lpfnWndProc = WndProc;
    wcex.cbClsExtra = 0;
    wcex.cbWndExtra = 0;
    wcex.hInstance = m_hInstance;
    wcex.hIcon = LoadIcon(NULL, IDI_APPLICATION);
    wcex.hCursor = LoadCursor(NULL, IDC_ARROW);
    wcex.hbrBackground = (HBRUSH)(COLOR_WINDOW + 1);
    wcex.lpszMenuName = NULL;
    wcex.lpszClassName = L"AITokenPetClass";
    wcex.hIconSm = LoadIcon(NULL, IDI_APPLICATION);

    if (!RegisterClassEx(&wcex)) {
        return false;
    }

    // 创建 Windows 11 风格现代窗口
    m_hWnd = CreateWindowEx(
        WS_EX_APPWINDOW,
        L"AITokenPetClass",
        L"AI Token Pet · 拟人桌面消费伴侣 (Native C++)",
        WS_OVERLAPPEDWINDOW,
        CW_USEDEFAULT, CW_USEDEFAULT, 1200, 840,
        NULL, NULL, m_hInstance, NULL
    );

    if (!m_hWnd) return false;

    ShowWindow(m_hWnd, nCmdShow);
    UpdateWindow(m_hWnd);
    SetupSystemTray();

    // 初始化内嵌 WebView2 浏览器引擎渲染动态立绘与 UI
    CreateCoreWebView2EnvironmentWithOptions(nullptr, nullptr, nullptr,
        Callback<ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler>(
            [this](HRESULT result, ICoreWebView2Environment* env) -> HRESULT {
                env->CreateCoreWebView2Controller(m_hWnd,
                    Callback<ICoreWebView2CreateCoreWebView2ControllerCompletedHandler>(
                        [this](HRESULT result, ICoreWebView2Controller* controller) -> HRESULT {
                            if (controller != nullptr) {
                                g_webviewController = controller;
                                g_webviewController->get_CoreWebView2(&g_webviewWindow);
                            }

                            RECT bounds;
                            GetClientRect(m_hWnd, &bounds);
                            g_webviewController->put_Bounds(bounds);

                            // 加载本地嵌入的前端资源包 dist/index.html
                            WCHAR buffer[MAX_PATH];
                            GetModuleFileName(NULL, buffer, MAX_PATH);
                            std::wstring path(buffer);
                            size_t pos = path.find_last_of(L"\\/");
                            std::wstring distPath = path.substr(0, pos) + L"\\dist\\index.html";

                            g_webviewWindow->Navigate(distPath.c_str());
                            return S_OK;
                        }).Get());
                return S_OK;
            }).Get());

    return true;
}

int DesktopPetApp::Run() {
    MSG msg;
    while (GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }
    return (int)msg.wParam;
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    DesktopPetApp app(hInstance);
    if (!app.Initialize(nCmdShow)) {
        return -1;
    }
    return app.Run();
}
