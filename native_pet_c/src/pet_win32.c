/*
 * pet_win32.c - Windows 原生桌宠外壳（C + Win32 + GDI+）。
 *
 * 实现要点（HANDOVER §5 建议路线）：
 *   - WS_POPUP | WS_EX_LAYERED | WS_EX_TOOLWINDOW | WS_EX_TOPMOST：无边框、透明、置顶、不进任务栏；
 *   - 每帧用 GDI+ 把 12 层 PNG 合成到 32bpp PARGB DIB，再 UpdateLayeredWindow(ULW_ALPHA)；
 *   - 行为（状态机/睡眠/触摸/视线/眨眼）全部来自 pet_core.c；
 *   - 点击穿透 = 切换 WS_EX_TRANSPARENT，恢复入口在托盘（托盘图标不受穿透影响）；
 *   - 全局键盘钩子 WH_KEYBOARD_LL 驱动反应（与 Qt 版一致）。
 *
 * 命令行：
 *   AITokenPetC.exe [--assets <素材目录>] [--workspace-url <主工作区地址>]
 * 默认素材目录依次查找：<exe>/../../app/public/characters/deepseek_layers 等。
 *
 * 注意：本文件在 Linux 沙箱中只做交叉编译验证（zig），运行效果需要 Windows 真机确认。
 */
#ifndef UNICODE
#define UNICODE
#endif
#ifndef _UNICODE
#define _UNICODE
#endif
#define WIN32_LEAN_AND_MEAN
#define NOMINMAX

#include <windows.h>
#include <windowsx.h>
#include <shellapi.h>
#include <objidl.h>
#include <gdiplus.h>
#include <stdio.h>
#include <wchar.h>
#include <math.h>
#include <string.h>

#include "../include/pet_core.h"

/* ---- 常量 ---------------------------------------------------------- */
#define WM_TRAY (WM_APP + 1)
#define WM_KEY_WAKE (WM_APP + 2) /* 预留：外部 IPC 唤醒 */
#define TIMER_FRAME 1
#define FRAME_MS 33
#define TRAY_ID 1
#define GAZE_GAIN 2.2
#define GAZE_ORIGIN_Y 0.16

#define IDM_ZOOM_IN 1001
#define IDM_ZOOM_OUT 1002
#define IDM_ZOOM_RESET 1003
#define IDM_OPEN_WS 1004
#define IDM_QUIT 1005
#define IDM_TRAY_SHOW 1010
#define IDM_TRAY_THROUGH 1011
#define IDM_TRAY_QUIT 1012

#define DEFAULT_WS_URL L"http://127.0.0.1:8766/"

/* ---- 全局状态 ------------------------------------------------------ */
static HWND g_hwnd = NULL;
static HINSTANCE g_hinst = NULL;
static PetState g_pet;
static HHOOK g_kbhook = NULL;
static BOOL g_visible = TRUE;
static BOOL g_click_through = FALSE;
static BOOL g_dragging = FALSE;
static POINT g_drag_cursor;
static POINT g_drag_win;

static wchar_t g_assets_dir[MAX_PATH * 2];
static wchar_t g_ws_url[1024];

static GpBitmap *g_layer_img[PET_LAYER_COUNT];
static GpBitmap *g_canvas = NULL;
static GpGraphics *g_gfx = NULL;
static GpImageAttributes *g_attr = NULL;
static HBITMAP g_dib = NULL;
static HDC g_memdc = NULL;
static int g_w = 0, g_h = 0;

static ULONG_PTR g_gdiplus_token = 0;

/* ---- 时间 / 系统输入 ----------------------------------------------- */
static double now_sec(void) {
    return (double)GetTickCount64() / 1000.0;
}

/* 系统空闲秒数（GetLastInputInfo）；失败返回 -1，由核心层回退 */
static double system_idle_sec(void) {
    LASTINPUTINFO li;
    DWORD elapsed;
    li.cbSize = sizeof(li);
    if (!GetLastInputInfo(&li)) return -1.0;
    elapsed = GetTickCount() - li.dwTime; /* DWORD 无符号回绕安全 */
    return (double)elapsed / 1000.0;
}

/* ---- 资源加载 ------------------------------------------------------ */
static BOOL file_exists(const wchar_t *path) {
    DWORD attr = GetFileAttributesW(path);
    return attr != INVALID_FILE_ATTRIBUTES && !(attr & FILE_ATTRIBUTE_DIRECTORY);
}

static void find_assets_dir(void) {
    wchar_t exe[MAX_PATH];
    wchar_t probe[MAX_PATH * 2];
    wchar_t *slash;
    static const wchar_t *rels[] = {
        L"\\..\\..\\app\\public\\characters\\deepseek_layers",
        L"\\..\\app\\public\\characters\\deepseek_layers",
        L"\\assets"};
    size_t i;

    g_assets_dir[0] = L'\0';
    if (!GetModuleFileNameW(NULL, exe, MAX_PATH)) return;
    slash = wcsrchr(exe, L'\\');
    if (slash) *slash = L'\0';
    for (i = 0; i < sizeof(rels) / sizeof(rels[0]); i++) {
        swprintf(probe, sizeof(probe) / sizeof(probe[0]), L"%s%s\\base_rig.png", exe, rels[i]);
        if (file_exists(probe)) {
            swprintf(g_assets_dir, sizeof(g_assets_dir) / sizeof(g_assets_dir[0]), L"%s%s", exe, rels[i]);
            return;
        }
    }
}

static void parse_args(void) {
    int argc = 0, i;
    LPWSTR *argv = CommandLineToArgvW(GetCommandLineW(), &argc);
    wcscpy(g_ws_url, DEFAULT_WS_URL);
    if (argv) {
        for (i = 1; i + 1 < argc; i++) {
            if (wcscmp(argv[i], L"--assets") == 0) {
                wcsncpy(g_assets_dir, argv[i + 1], MAX_PATH * 2 - 1);
                g_assets_dir[MAX_PATH * 2 - 1] = L'\0';
                i++;
            } else if (wcscmp(argv[i], L"--workspace-url") == 0) {
                wcsncpy(g_ws_url, argv[i + 1], 1023);
                g_ws_url[1023] = L'\0';
                i++;
            }
        }
        LocalFree(argv);
    }
    if (g_assets_dir[0] == L'\0') find_assets_dir();
}

static BOOL load_layers(void) {
    size_t i;
    BOOL ok = TRUE;
    for (i = 0; i < PET_LAYER_COUNT; i++) {
        wchar_t path[MAX_PATH * 2];
        wchar_t name[64];
        size_t k, n = strlen(PET_LAYERS[i].name);
        for (k = 0; k < n && k < 63; k++) name[k] = (wchar_t)PET_LAYERS[i].name[k];
        name[k] = L'\0';
        swprintf(path, sizeof(path) / sizeof(path[0]), L"%s\\%s.png", g_assets_dir, name);
        g_layer_img[i] = NULL;
        if (GdipCreateBitmapFromFile(path, &g_layer_img[i]) != Ok) {
            ok = FALSE;
        }
    }
    return ok;
}

/* ---- 画布（PARGB DIB + GDI+ 绘制面）----------------------------- */
static void free_canvas(void) {
    if (g_gfx) { GdipDeleteGraphics(g_gfx); g_gfx = NULL; }
    if (g_canvas) { GdipDisposeImage(g_canvas); g_canvas = NULL; }
    /* 先销毁内存 DC（会自动取消选入的位图），再删除 DIB */
    if (g_memdc) { DeleteDC(g_memdc); g_memdc = NULL; }
    if (g_dib) { DeleteObject(g_dib); g_dib = NULL; }
}

static BOOL build_canvas(int w, int h) {
    BITMAPINFO bmi;
    void *bits = NULL;
    HDC screen;

    free_canvas();
    ZeroMemory(&bmi, sizeof(bmi));
    bmi.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
    bmi.bmiHeader.biWidth = w;
    bmi.bmiHeader.biHeight = -h; /* 自上而下 */
    bmi.bmiHeader.biPlanes = 1;
    bmi.bmiHeader.biBitCount = 32;
    bmi.bmiHeader.biCompression = BI_RGB;

    screen = GetDC(NULL);
    g_dib = CreateDIBSection(screen, &bmi, DIB_RGB_COLORS, &bits, NULL, 0);
    ReleaseDC(NULL, screen);
    if (!g_dib || !bits) return FALSE;
    g_memdc = CreateCompatibleDC(NULL);
    if (!g_memdc) return FALSE;
    SelectObject(g_memdc, g_dib);

    /* GDI+ 直接写入 DIB 内存，保留 alpha（PARGB） */
    if (GdipCreateBitmapFromScan0(w, h, w * 4, PixelFormat32bppPARGB,
                                           (BYTE *)bits, &g_canvas) != Ok)
        return FALSE;
    if (GdipGetImageGraphicsContext(g_canvas, &g_gfx) != Ok) return FALSE;
    /* 每帧 12 层重采样：用双线性兼顾性能与观感（3x 缩放时尤其重要） */
    GdipSetInterpolationMode(g_gfx, InterpolationModeHighQualityBilinear);
    g_w = w;
    g_h = h;
    return TRUE;
}

static void set_alpha_attr(float alpha) {
    ColorMatrix cm;
    int r, c;
    for (r = 0; r < 5; r++)
        for (c = 0; c < 5; c++) cm.m[r][c] = (r == c) ? 1.0f : 0.0f;
    cm.m[3][3] = alpha;
    if (!g_attr) GdipCreateImageAttributes(&g_attr);
    GdipSetImageAttributesColorMatrix(g_attr, ColorAdjustTypeBitmap, TRUE,
                                               &cm, NULL, ColorMatrixFlagsDefault);
}

/* ---- 渲染 ---------------------------------------------------------- */
static void push_to_screen(void) {
    RECT wr;
    POINT dst, src = {0, 0};
    SIZE sz;
    BLENDFUNCTION bf;
    HDC screen;

    GetWindowRect(g_hwnd, &wr);
    dst.x = wr.left;
    dst.y = wr.top;
    sz.cx = g_w;
    sz.cy = g_h;
    bf.BlendOp = AC_SRC_OVER;
    bf.BlendFlags = 0;
    bf.SourceConstantAlpha = 255;
    bf.AlphaFormat = AC_SRC_ALPHA;
    screen = GetDC(NULL);
    UpdateLayeredWindow(g_hwnd, screen, &dst, &sz, g_memdc, &src, 0, &bf, ULW_ALPHA);
    ReleaseDC(NULL, screen);
}

static void render(double now) {
    PetLayerDraw d[PET_LAYER_COUNT];
    int i;

    if (!g_gfx) return;
    pet_layout(&g_pet, now, d);
    GdipGraphicsClear(g_gfx, 0x00000000);
    for (i = 0; i < PET_LAYER_COUNT; i++) {
        GpBitmap *img = g_layer_img[d[i].layer];
        UINT iw = 0, ih = 0;
        if (!d[i].visible || !img) continue;
        GdipGetImageWidth(img, &iw);
        GdipGetImageHeight(img, &ih);
        if (d[i].alpha < 0.999) {
            set_alpha_attr((float)d[i].alpha);
            GdipDrawImageRectRectI(g_gfx, img,
                (INT)lround(d[i].dx), (INT)lround(d[i].dy), g_w, g_h,
                0, 0, (INT)iw, (INT)ih, UnitPixel, g_attr, NULL, NULL);
        } else {
            GdipDrawImageRectRectI(g_gfx, img,
                (INT)lround(d[i].dx), (INT)lround(d[i].dy), g_w, g_h,
                0, 0, (INT)iw, (INT)ih, UnitPixel, NULL, NULL, NULL);
        }
    }
    push_to_screen();
}

/* ---- 窗口位置 / 尺寸 ---------------------------------------------- */
static void clamp_to_work_area(int *x, int *y, int w, int h) {
    RECT wa;
    SystemParametersInfoW(SPI_GETWORKAREA, 0, &wa, 0);
    if (*x + w > wa.right) *x = wa.right - w;
    if (*y + h > wa.bottom) *y = wa.bottom - h;
    if (*x < wa.left) *x = wa.left;
    if (*y < wa.top) *y = wa.top;
}

static void apply_scale(void) {
    RECT wr;
    PetSize sz = pet_window_size(g_pet.scale);
    int x, y;
    GetWindowRect(g_hwnd, &wr);
    x = wr.left;
    y = wr.top;
    clamp_to_work_area(&x, &y, sz.width, sz.height);
    build_canvas(sz.width, sz.height);
    SetWindowPos(g_hwnd, HWND_TOPMOST, x, y, sz.width, sz.height, SWP_NOACTIVATE);
    render(now_sec());
}

static void place_bottom_right(void) {
    RECT wa;
    PetSize sz = pet_window_size(g_pet.scale);
    int x, y;
    SystemParametersInfoW(SPI_GETWORKAREA, 0, &wa, 0);
    x = wa.right - sz.width - 40;
    y = wa.bottom - sz.height - 20;
    clamp_to_work_area(&x, &y, sz.width, sz.height);
    SetWindowPos(g_hwnd, HWND_TOPMOST, x, y, sz.width, sz.height, SWP_NOACTIVATE);
}

/* ---- 托盘 ---------------------------------------------------------- */
static void tray_add(void) {
    NOTIFYICONDATAW nid;
    ZeroMemory(&nid, sizeof(nid));
    nid.cbSize = sizeof(nid);
    nid.hWnd = g_hwnd;
    nid.uID = TRAY_ID;
    nid.uFlags = NIF_ICON | NIF_MESSAGE | NIF_TIP;
    nid.uCallbackMessage = WM_TRAY;
    nid.hIcon = LoadIconW(NULL, IDI_APPLICATION);
    wcsncpy(nid.szTip, L"AI Token Pet 桌面宠物", 127);
    Shell_NotifyIconW(NIM_ADD, &nid);
}

static void tray_remove(void) {
    NOTIFYICONDATAW nid;
    ZeroMemory(&nid, sizeof(nid));
    nid.cbSize = sizeof(nid);
    nid.hWnd = g_hwnd;
    nid.uID = TRAY_ID;
    Shell_NotifyIconW(NIM_DELETE, &nid);
}

static void toggle_visible(void) {
    g_visible = !g_visible;
    ShowWindow(g_hwnd, g_visible ? SW_SHOWNOACTIVATE : SW_HIDE);
}

static void set_click_through(BOOL on) {
    LONG_PTR ex = GetWindowLongPtrW(g_hwnd, GWL_EXSTYLE);
    g_click_through = on;
    if (on) ex |= WS_EX_TRANSPARENT | WS_EX_LAYERED;
    else ex &= ~(LONG_PTR)WS_EX_TRANSPARENT;
    SetWindowLongPtrW(g_hwnd, GWL_EXSTYLE, ex);
}

static void open_workspace(void) {
    ShellExecuteW(g_hwnd, L"open", g_ws_url, NULL, NULL, SW_SHOWNORMAL);
}

static void zoom(int up) {
    double next = pet_step_scale(g_pet.scale, up);
    if (next != g_pet.scale) {
        g_pet.scale = next;
        apply_scale();
    }
}

static void zoom_reset(void) {
    g_pet.scale = PET_SCALE_DEFAULT;
    apply_scale();
}

static void show_context_menu(HWND owner, int tray) {
    HMENU menu = CreatePopupMenu();
    POINT pt;
    int cmd;
    GetCursorPos(&pt);
    if (tray) {
        AppendMenuW(menu, MF_STRING, IDM_TRAY_SHOW, g_visible ? L"隐藏宠物" : L"显示宠物");
        AppendMenuW(menu, MF_STRING | (g_click_through ? MF_CHECKED : 0), IDM_TRAY_THROUGH, L"鼠标穿透");
        AppendMenuW(menu, MF_SEPARATOR, 0, NULL);
        AppendMenuW(menu, MF_STRING, IDM_TRAY_QUIT, L"退出");
    } else {
        AppendMenuW(menu, MF_STRING, IDM_ZOOM_IN, L"放大");
        AppendMenuW(menu, MF_STRING, IDM_ZOOM_OUT, L"缩小");
        AppendMenuW(menu, MF_STRING, IDM_ZOOM_RESET, L"恢复默认大小");
        AppendMenuW(menu, MF_SEPARATOR, 0, NULL);
        AppendMenuW(menu, MF_STRING, IDM_OPEN_WS, L"打开主工作区");
        AppendMenuW(menu, MF_STRING, IDM_QUIT, L"退出桌宠");
    }
    SetForegroundWindow(owner);
    cmd = (int)TrackPopupMenu(menu, TPM_RETURNCMD | TPM_RIGHTBUTTON | TPM_NONOTIFY,
                              pt.x, pt.y, 0, owner, NULL);
    DestroyMenu(menu);
    switch (cmd) {
    case IDM_ZOOM_IN: zoom(1); break;
    case IDM_ZOOM_OUT: zoom(0); break;
    case IDM_ZOOM_RESET: zoom_reset(); break;
    case IDM_OPEN_WS: open_workspace(); break;
    case IDM_QUIT:
    case IDM_TRAY_QUIT: DestroyWindow(g_hwnd); break;
    case IDM_TRAY_SHOW: toggle_visible(); break;
    case IDM_TRAY_THROUGH: set_click_through(!g_click_through); break;
    default: break;
    }
}

/* ---- 全局键盘钩子 -------------------------------------------------- */
static LRESULT CALLBACK kb_hook(int code, WPARAM wp, LPARAM lp) {
    if (code == HC_ACTION && (wp == WM_KEYDOWN || wp == WM_SYSKEYDOWN)) {
        pet_on_key(&g_pet, now_sec());
    }
    return CallNextHookEx(NULL, code, wp, lp);
}

/* ---- 每帧更新 ------------------------------------------------------ */
static void on_frame(void) {
    RECT wr;
    POINT cur;
    double now = now_sec(), tx = 0.0, ty = 0.0;
    double cx, cy;
    int w, h;

    if (!g_visible) return;
    GetWindowRect(g_hwnd, &wr);
    w = wr.right - wr.left;
    h = wr.bottom - wr.top;
    GetCursorPos(&cur);
    cx = wr.left + w / 2.0;
    cy = wr.top + h * GAZE_ORIGIN_Y;
    tx = pet_gaze_target_axis((double)cur.x - cx, (double)w, GAZE_GAIN);
    ty = pet_gaze_target_axis((double)cur.y - cy, (double)h, GAZE_GAIN);
    pet_update(&g_pet, now, system_idle_sec(), tx, ty);
    render(now);
}

/* ---- 窗口过程 ------------------------------------------------------ */
static LRESULT CALLBACK wnd_proc(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp) {
    switch (msg) {
    case WM_TIMER:
        if (wp == TIMER_FRAME) on_frame();
        return 0;

    case WM_LBUTTONDOWN: {
        RECT wr;
        SetCapture(hwnd);
        GetCursorPos(&g_drag_cursor);
        GetWindowRect(hwnd, &wr);
        g_drag_win.x = wr.left;
        g_drag_win.y = wr.top;
        g_dragging = TRUE;
        pet_on_press(&g_pet, now_sec(), (double)GET_Y_LPARAM(lp), (double)g_h);
        render(now_sec());
        return 0;
    }

    case WM_MOUSEMOVE:
        if (g_dragging && (wp & MK_LBUTTON)) {
            POINT cur;
            GetCursorPos(&cur);
            SetWindowPos(hwnd, HWND_TOPMOST,
                         g_drag_win.x + (cur.x - g_drag_cursor.x),
                         g_drag_win.y + (cur.y - g_drag_cursor.y),
                         0, 0, SWP_NOSIZE | SWP_NOACTIVATE);
            pet_on_drag_head(&g_pet, now_sec(), (double)GET_Y_LPARAM(lp), (double)g_h);
        }
        return 0;

    case WM_LBUTTONUP:
        g_dragging = FALSE;
        if (GetCapture() == hwnd) ReleaseCapture();
        return 0;

    case WM_MOUSEWHEEL: {
        int delta = GET_WHEEL_DELTA_WPARAM(wp);
        if (pet_on_wheel(&g_pet, delta, now_sec())) apply_scale();
        return 0;
    }

    case WM_RBUTTONUP:
        show_context_menu(hwnd, 0);
        return 0;

    case WM_TRAY:
        if (lp == WM_LBUTTONUP || lp == WM_LBUTTONDBLCLK) toggle_visible();
        else if (lp == WM_RBUTTONUP || lp == WM_CONTEXTMENU) show_context_menu(hwnd, 1);
        return 0;

    case WM_COMMAND:
        switch (LOWORD(wp)) {
        case IDM_TRAY_SHOW: toggle_visible(); break;
        case IDM_TRAY_THROUGH: set_click_through(!g_click_through); break;
        case IDM_TRAY_QUIT:
        case IDM_QUIT: DestroyWindow(hwnd); break;
        case IDM_OPEN_WS: open_workspace(); break;
        case IDM_ZOOM_IN: zoom(1); break;
        case IDM_ZOOM_OUT: zoom(0); break;
        case IDM_ZOOM_RESET: zoom_reset(); break;
        default: break;
        }
        return 0;

    case WM_KEY_WAKE:
        pet_on_key(&g_pet, now_sec());
        return 0;

    case WM_DESTROY:
        KillTimer(hwnd, TIMER_FRAME);
        tray_remove();
        if (g_kbhook) { UnhookWindowsHookEx(g_kbhook); g_kbhook = NULL; }
        PostQuitMessage(0);
        return 0;

    default:
        break;
    }
    return DefWindowProcW(hwnd, msg, wp, lp);
}

/* ---- 入口 ---------------------------------------------------------- */
static void free_all(void) {
    int i;
    free_canvas();
    if (g_attr) { GdipDisposeImageAttributes(g_attr); g_attr = NULL; }
    for (i = 0; i < PET_LAYER_COUNT; i++) {
        if (g_layer_img[i]) { GdipDisposeImage(g_layer_img[i]); g_layer_img[i] = NULL; }
    }
}

int WINAPI wWinMain(HINSTANCE hinst, HINSTANCE prev, LPWSTR cmdline, int show) {
    WNDCLASSEXW wc;
    GdiplusStartupInput gsi;
    MSG msg;
    PetSize sz;
    msg.wParam = 0;
    (void)prev;
    (void)cmdline;
    (void)show;

    g_hinst = hinst;
    parse_args();
    if (g_assets_dir[0] == L'\0') {
        MessageBoxW(NULL, L"未找到桌宠素材目录，请用 --assets <目录> 指定 deepseek_layers 文件夹。",
                    L"AI Token Pet", MB_ICONERROR);
        return 1;
    }

    gsi.GdiplusVersion = 1;
    gsi.DebugEventCallback = NULL;
    gsi.SuppressBackgroundThread = FALSE;
    gsi.SuppressExternalCodecs = FALSE;
    if (GdiplusStartup(&g_gdiplus_token, &gsi, NULL) != Ok) return 1;
    if (!load_layers()) {
        MessageBoxW(NULL, L"桌宠素材加载失败（缺少 PNG 图层）。", L"AI Token Pet", MB_ICONERROR);
        free_all();
        GdiplusShutdown(g_gdiplus_token);
        return 1;
    }

    pet_init(&g_pet, now_sec(), PET_SCALE_DEFAULT);

    ZeroMemory(&wc, sizeof(wc));
    wc.cbSize = sizeof(wc);
    wc.lpfnWndProc = wnd_proc;
    wc.hInstance = hinst;
    wc.hCursor = LoadCursorW(NULL, IDC_ARROW);
    wc.lpszClassName = L"AITokenPetNativeWindow";
    RegisterClassExW(&wc);

    sz = pet_window_size(g_pet.scale);
    g_hwnd = CreateWindowExW(WS_EX_LAYERED | WS_EX_TOOLWINDOW | WS_EX_TOPMOST,
                             L"AITokenPetNativeWindow", L"AI Token Pet",
                             WS_POPUP, 0, 0, sz.width, sz.height,
                             NULL, NULL, hinst, NULL);
    if (!g_hwnd) return 1;

    build_canvas(sz.width, sz.height);
    place_bottom_right();
    set_alpha_attr(1.0f);
    ShowWindow(g_hwnd, SW_SHOWNOACTIVATE);
    tray_add();
    g_kbhook = SetWindowsHookExW(WH_KEYBOARD_LL, kb_hook, hinst, 0);
    SetTimer(g_hwnd, TIMER_FRAME, FRAME_MS, NULL);
    render(now_sec());

    while (GetMessageW(&msg, NULL, 0, 0) > 0) {
        TranslateMessage(&msg);
        DispatchMessageW(&msg);
    }

    free_all();
    GdiplusShutdown(g_gdiplus_token);
    return (int)msg.wParam;
}
