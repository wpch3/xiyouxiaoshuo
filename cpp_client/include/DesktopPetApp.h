#pragma once
#include <windows.h>
#include <string>

// AI 桌面宠物 C++ 原生核心控制器
class DesktopPetApp {
public:
    DesktopPetApp(HINSTANCE hInstance);
    ~DesktopPetApp();

    bool Initialize(int nCmdShow);
    int Run();

    // 窗口与交互功能
    void SetAlwaysOnTop(bool top);
    void MinimizeToTray();
    void RestoreFromTray();
    void SetOpacity(BYTE alpha);

private:
    static LRESULT CALLBACK WndProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam);
    void SetupSystemTray();
    void RemoveSystemTray();

    HINSTANCE m_hInstance;
    HWND m_hWnd;
    NOTIFYICONDATA m_nid;
    bool m_alwaysOnTop;
};
