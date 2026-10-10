/*
 * pet_core.h - 桌宠纯逻辑层（平台无关 C89/C99）
 *
 * 只包含：优先级动作状态机、系统空闲睡眠、触摸分区、视线缓动与限幅、
 * 眨眼调度、层绘制参数计算、缩放几何、口型节奏调度器。
 * 不包含任何窗口/绘图 API，因此可以在 Linux 上直接单元测试。
 *
 * 数值来源（与 HANDOVER.md 第 3/4/6 节一致）：
 *   - 424x632 为 rig 坐标；视线偏移限幅 +-3px(x) / +-1.5px(y)，再乘缩放。
 *   - 眨眼 周期 4.6s，闭合保持 0.16s。
 *   - 睡眠：系统空闲 > 90s 进入，空闲 < 1.5s 唤醒（或任意输入唤醒）。
 *   - 触摸：rig 顶部 30% 为摸头(pat)，其余为身体(tap)。
 */
#ifndef PET_CORE_H
#define PET_CORE_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/* ---- 常量 ---------------------------------------------------------- */
#define PET_RIG_W 440
#define PET_RIG_H 704

#define PET_BLINK_PERIOD 4.6
#define PET_BLINK_HOLD 0.16
#define PET_SLEEP_IDLE_SEC 90.0
#define PET_WAKE_IDLE_SEC 1.5
#define PET_GAZE_EASE 0.2
#define PET_GAZE_LIMIT_X 1.0 /* rig px：虹膜只在眼白内移动（440 宽 rig） */
#define PET_GAZE_LIMIT_Y 0.5 /* rig px */
#define PET_HEAD_ZONE 0.30
#define PET_CLICK_TAP_DUR 0.30 /* 鼠标点击身体 */
#define PET_KEY_TAP_DUR 0.35   /* 全局按键反应 */
#define PET_PAT_DUR 0.45
#define PET_PAT_THROTTLE 0.25
#define PET_PAT_EYE_ALPHA 0.55
/* 位移/摆动幅度按 0.55 参考缩放标定（与原 Qt 版一致），绘制时乘 scale/0.55 */
#define PET_HOP_TAP 6.0
#define PET_HOP_PAT 3.0
#define PET_SLEEP_BOB 0.8
#define PET_SWAY_AWAKE 1.6
#define PET_SWAY_SLEEP 0.5
#define PET_SCALE_MIN 0.3
#define PET_SCALE_MAX 3.0
#define PET_SCALE_DEFAULT 0.60
#define PET_SCALE_STEP_UP 1.12
#define PET_SCALE_STEP_DOWN 0.9

/* 口型调度器（HANDOVER §3） */
#define PET_MOUTH_FRAMES 5 /* open,e,i,o,u */
#define PET_MOUTH_SYL_MIN 0.070
#define PET_MOUTH_SYL_MAX 0.160
#define PET_MOUTH_ACCENT_P 0.12
#define PET_MOUTH_ACCENT_MIN 0.170
#define PET_MOUTH_ACCENT_MAX 0.230
#define PET_MOUTH_PAUSE_P 0.70
#define PET_MOUTH_PAUSE_MIN 0.120
#define PET_MOUTH_PAUSE_MAX 0.260
#define PET_MOUTH_XFADE 0.060

/* ---- 图层 --------------------------------------------------------- */
typedef enum {
    PET_MODE_STATIC = 0, /* 固定 */
    PET_MODE_BASE,       /* 底板 */
    PET_MODE_GAZE,       /* 虹膜：随视线偏移 */
    PET_MODE_BLINK,      /* 眼睑：眨眼/摸头半透明 */
    PET_MODE_BROW,       /* 眉毛 */
    PET_MODE_SWAY        /* 发丝/刘海摆动 */
} PetLayerMode;

typedef struct {
    const char *name;     /* 不含扩展名，对应 assets/xiaoxun/layers/<name>.png */
    PetLayerMode mode;
    double sway_phase;    /* 仅 SWAY 使用 */
    double sway_amp;      /* rig px */
} PetLayerSpec;

#define PET_LAYER_COUNT 10
/* z 序：索引越小越靠底（与 HANDOVER §3 一致） */
extern const PetLayerSpec PET_LAYERS[PET_LAYER_COUNT];

/* ---- 动作状态机 ---------------------------------------------------- */
typedef enum {
    PET_ACT_IDLE = 0,
    PET_ACT_SLEEP,
    PET_ACT_TAP,
    PET_ACT_PAT
} PetAction;

typedef struct {
    int priority;
    int interruptible;
    double duration; /* 0 = 不自动过期 */
} PetActionSpec;

extern const PetActionSpec PET_ACTION_SPECS[4];

typedef struct {
    PetAction action;
    double action_entered;
    double action_until; /* 0 = 无过期 */
    double last_pat_trigger;
    double last_activity;
    double next_blink;
    double blink_until;
    double look_x; /* 缓动后的视线，-1..1 */
    double look_y;
    double scale;
} PetState;

/* 层绘制参数（由 pet_layout 计算，平台层只负责把它画出来） */
typedef struct {
    int layer;       /* 索引到 PET_LAYERS */
    int visible;
    double dx;       /* 像素（已乘缩放） */
    double dy;
    double alpha;    /* 0..1 */
} PetLayerDraw;

/* 窗口像素尺寸 */
typedef struct {
    int width;
    int height;
} PetSize;

/* ---- 初始化与输入 ------------------------------------------------- */
void pet_init(PetState *s, double now, double scale);
/* 状态切换：返回 1 表示切换成功。force=1 可越级（被打断/唤醒用）。 */
int pet_request(PetState *s, PetAction target, int force, double now);
void pet_expire(PetState *s, double now);

/* 全局按键（或任何外部输入）：刷新活动时间；睡眠中则唤醒 */
void pet_on_key(PetState *s, double now);
/* 鼠标按下：rel_y 为相对窗口顶部的像素位置。返回命中的动作。 */
PetAction pet_on_press(PetState *s, double now, double rel_y, double pet_h);
/* 鼠标在摸头区域按住拖动：每 PAT_THROTTLE 续一次摸头 */
void pet_on_drag_head(PetState *s, double now, double rel_y, double pet_h);
/* 滚轮缩放（delta>0 放大）。返回是否改变。 */
int pet_on_wheel(PetState *s, int delta, double now);

/* 每帧更新：过期、睡眠判定、眨眼调度、视线缓动。
 * sys_idle_sec：系统空闲秒数（Win32 GetLastInputInfo）；不可用时传负数，回退为本地互动计时
 * target_x/target_y：由 pet_gaze_target 得到的 -1..1 目标 */
void pet_update(PetState *s, double now, double sys_idle_sec,
                double target_x, double target_y);

/* 视线目标：光标相对宠物中心的像素偏移 -> -1..1（公式同 desktop_pet_qt.py） */
double pet_gaze_target_axis(double delta_px, double extent_px, double gain);

/* 计算本帧所有层的绘制参数，返回层数（== PET_LAYER_COUNT） */
int pet_layout(const PetState *s, double now, PetLayerDraw out[PET_LAYER_COUNT]);

/* 缩放 -> 窗口像素尺寸（至少 1x1） */
PetSize pet_window_size(double scale);
double pet_clamp_scale(double scale);
/* 滚轮步进：delta>0 放大 */
double pet_step_scale(double scale, int delta_up);

int pet_is_sleeping(const PetState *s);
int pet_in_head_zone(double rel_y, double pet_h);

/* ---- 口型调度器 ---------------------------------------------------- */
typedef struct {
    uint32_t rng;
    int speaking;
    int syllables_left;   /* 当前词剩余音节 */
    int pending_pause;    /* 词末，下一次换帧前插入闭口停顿 */
    int frame;            /* 当前帧 0..4，-1 = 闭口 */
    int prev_frame;
    double change_at;     /* 上次换帧时刻，用于交叉淡化 */
    double next_at;       /* 下次换帧时刻 */
} PetMouth;

void pet_mouth_init(PetMouth *m, uint32_t seed);
void pet_mouth_start(PetMouth *m, double now);
void pet_mouth_stop(PetMouth *m);
/* 推进口型；返回 0..4 帧索引或 -1（闭口）；alpha 为新帧的交叉淡化系数 0..1 */
int pet_mouth_update(PetMouth *m, double now, double *alpha);

/* 确定性伪随机 [0,1) （xorshift32，便于自检复现） */
double pet_rand01(uint32_t *state);

#ifdef __cplusplus
}
#endif
#endif /* PET_CORE_H */
