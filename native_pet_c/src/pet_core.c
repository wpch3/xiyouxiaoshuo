/*
 * pet_core.c - 桌宠纯逻辑层实现（平台无关，无任何 OS API）。
 * 状态机规格移植自 desktop_pet_qt.py（ActionState / tick / paintEvent），
 * 视线限幅与睡眠数值以 HANDOVER.md 为准。
 */
#include "pet_core.h"

#include <math.h>
#include <stddef.h>

/* 层清单：与 app/src/constants/petRig.js、desktop_pet_qt.py 一致 */
const PetLayerSpec PET_LAYERS[PET_LAYER_COUNT] = {
    {"body_base", PET_MODE_BASE, 0.0, 0.0},
    {"eye_open_l", PET_MODE_GAZE, 0.0, 0.0},
    {"eye_open_r", PET_MODE_GAZE, 0.0, 0.0},
    {"eye_closed_l", PET_MODE_BLINK, 0.0, 0.0},
    {"eye_closed_r", PET_MODE_BLINK, 0.0, 0.0},
    {"brow_l", PET_MODE_BROW, 0.0, 0.0},
    {"brow_r", PET_MODE_BROW, 0.0, 0.0},
    {"mouth_closed", PET_MODE_STATIC, 0.0, 0.0}};

/* 动作规格：优先级 / 可中断 / 时长（秒，0=不过期） */
const PetActionSpec PET_ACTION_SPECS[4] = {
    {0, 1, 0.0},  /* IDLE  */
    {0, 1, 0.0},  /* SLEEP */
    {2, 0, 0.4},  /* TAP   */
    {3, 0, 0.45}  /* PAT   */
};

static double clampd(double v, double lo, double hi) {
    return v < lo ? lo : (v > hi ? hi : v);
}

static void set_action(PetState *s, PetAction target, double now, double duration) {
    s->action = target;
    s->action_entered = now;
    s->action_until = duration > 0.0 ? now + duration : 0.0;
}

double pet_clamp_scale(double scale) {
    return clampd(scale, PET_SCALE_MIN, PET_SCALE_MAX);
}

double pet_step_scale(double scale, int delta_up) {
    return pet_clamp_scale(scale * (delta_up ? PET_SCALE_STEP_UP : PET_SCALE_STEP_DOWN));
}

PetSize pet_window_size(double scale) {
    PetSize sz;
    double s = pet_clamp_scale(scale);
    sz.width = (int)(PET_RIG_W * s);
    sz.height = (int)(PET_RIG_H * s);
    if (sz.width < 1) sz.width = 1;
    if (sz.height < 1) sz.height = 1;
    return sz;
}

void pet_init(PetState *s, double now, double scale) {
    s->action = PET_ACT_IDLE;
    s->action_entered = now;
    s->action_until = 0.0;
    s->last_pat_trigger = -1e9;
    s->last_activity = now;
    s->next_blink = now + 2.0;
    s->blink_until = 0.0;
    s->look_x = 0.0;
    s->look_y = 0.0;
    s->scale = pet_clamp_scale(scale);
}

int pet_is_sleeping(const PetState *s) {
    return s->action == PET_ACT_SLEEP;
}

int pet_in_head_zone(double rel_y, double pet_h) {
    return rel_y < pet_h * PET_HEAD_ZONE;
}

int pet_request(PetState *s, PetAction target, int force, double now) {
    PetActionSpec cur, tgt;
    if (target == s->action) return 0;
    cur = PET_ACTION_SPECS[s->action];
    tgt = PET_ACTION_SPECS[target];
    if (!force) {
        /* 不可中断的动作：同级或更低级都不能打断 */
        if (!cur.interruptible && tgt.priority <= cur.priority) return 0;
        /* 任何情况下低优先级不能覆盖高优先级 */
        if (tgt.priority < cur.priority) return 0;
    }
    set_action(s, target, now, tgt.duration);
    return 1;
}

void pet_expire(PetState *s, double now) {
    if (s->action_until > 0.0 && now > s->action_until) {
        set_action(s, PET_ACT_IDLE, now, 0.0);
    }
}

void pet_on_key(PetState *s, double now) {
    s->last_activity = now;
    if (pet_is_sleeping(s)) {
        set_action(s, PET_ACT_IDLE, now, 0.0);
        return;
    }
    set_action(s, PET_ACT_TAP, now, PET_KEY_TAP_DUR);
    s->next_blink = now; /* 敲键时立即眨一次 */
}

PetAction pet_on_press(PetState *s, double now, double rel_y, double pet_h) {
    s->last_activity = now;
    if (pet_is_sleeping(s)) {
        set_action(s, PET_ACT_IDLE, now, 0.0);
        return PET_ACT_IDLE;
    }
    if (pet_in_head_zone(rel_y, pet_h)) {
        set_action(s, PET_ACT_PAT, now, PET_PAT_DUR);
        s->last_pat_trigger = now;
        return PET_ACT_PAT;
    }
    set_action(s, PET_ACT_TAP, now, PET_CLICK_TAP_DUR);
    return PET_ACT_TAP;
}

void pet_on_drag_head(PetState *s, double now, double rel_y, double pet_h) {
    s->last_activity = now;
    if (pet_is_sleeping(s) || !pet_in_head_zone(rel_y, pet_h)) return;
    if (now - s->last_pat_trigger >= PET_PAT_THROTTLE) {
        set_action(s, PET_ACT_PAT, now, PET_PAT_DUR);
        s->last_pat_trigger = now;
    }
}

int pet_on_wheel(PetState *s, int delta, double now) {
    double next;
    s->last_activity = now;
    if (delta == 0) return 0;
    next = pet_step_scale(s->scale, delta > 0);
    if (next == s->scale) return 0;
    s->scale = next;
    return 1;
}

double pet_gaze_target_axis(double delta_px, double extent_px, double gain) {
    double v = delta_px / (extent_px < 1.0 ? 1.0 : extent_px) * gain;
    return clampd(v, -1.0, 1.0);
}

void pet_update(PetState *s, double now, double sys_idle_sec,
                double target_x, double target_y) {
    double idle;
    pet_expire(s, now);

    /* 系统空闲可用（>=0）时以它为准：任何窗口的键鼠操作都算活动；
     * 不可用（<0，如非 Win32）时回退为本宠物最后一次互动时刻。 */
    idle = sys_idle_sec >= 0.0 ? sys_idle_sec : now - s->last_activity;
    if (idle < 0.0) idle = 0.0;

    if (pet_is_sleeping(s)) {
        if (idle < PET_WAKE_IDLE_SEC) set_action(s, PET_ACT_IDLE, now, 0.0);
    } else if (idle > PET_SLEEP_IDLE_SEC) {
        pet_request(s, PET_ACT_SLEEP, 0, now);
    }

    if (!pet_is_sleeping(s) && now > s->next_blink) {
        s->blink_until = now + PET_BLINK_HOLD;
        s->next_blink = now + PET_BLINK_PERIOD;
    }

    /* 视线缓动：目标 -1..1，每帧按 0.2 系数逼近 */
    s->look_x += (clampd(target_x, -1.0, 1.0) - s->look_x) * PET_GAZE_EASE;
    s->look_y += (clampd(target_y, -1.0, 1.0) - s->look_y) * PET_GAZE_EASE;
}

int pet_layout(const PetState *s, double now, PetLayerDraw out[PET_LAYER_COUNT]) {
    int sleeping = pet_is_sleeping(s);
    int blinking = (now < s->blink_until) || sleeping;
    int patting = s->action == PET_ACT_PAT;
    int tapping = s->action == PET_ACT_TAP;
    double sc = pet_clamp_scale(s->scale);
    double ref = sc / PET_SCALE_DEFAULT; /* 0.55 标定的位移换算系数 */
    double gaze_x = clampd(s->look_x, -1.0, 1.0) * PET_GAZE_LIMIT_X * sc;
    double gaze_y = clampd(s->look_y, -1.0, 1.0) * PET_GAZE_LIMIT_Y * sc;
    double hop = 0.0;
    int i;

    if (tapping) hop = -PET_HOP_TAP * ref;
    else if (patting) hop = -PET_HOP_PAT * ref;
    if (sleeping) hop += sin(now * 1.0) * PET_SLEEP_BOB * ref;

    for (i = 0; i < PET_LAYER_COUNT; i++) {
        const PetLayerSpec *spec = &PET_LAYERS[i];
        PetLayerDraw *d = &out[i];
        d->layer = i;
        d->visible = 1;
        d->alpha = 1.0;
        d->dx = 0.0;
        d->dy = hop;
        switch (spec->mode) {
        case PET_MODE_GAZE:
            d->dx = gaze_x;
            d->dy = gaze_y + hop;
            break;
        case PET_MODE_BLINK:
            if (!blinking && !patting) {
                d->visible = 0;
            } else if (patting && !sleeping) {
                d->alpha = PET_PAT_EYE_ALPHA; /* 摸头：半透明眯眼 */
            }
            break;
        case PET_MODE_SWAY: {
            double amp = sleeping ? PET_SWAY_SLEEP : spec->sway_amp;
            double freq = sleeping ? 0.6 : 1.2;
            d->dx = sin(now * freq + spec->sway_phase) * amp * ref;
            break;
        }
        default:
            break;
        }
    }
    return PET_LAYER_COUNT;
}

/* ---- 口型调度器 ---------------------------------------------------- */

double pet_rand01(uint32_t *state) {
    uint32_t x;
    if (*state == 0) *state = 0x9E3779B9u;
    x = *state;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    *state = x;
    return (double)(x >> 8) * (1.0 / 16777216.0);
}

void pet_mouth_init(PetMouth *m, uint32_t seed) {
    m->rng = seed ? seed : 1u;
    m->speaking = 0;
    m->syllables_left = 0;
    m->pending_pause = 0;
    m->frame = -1;
    m->prev_frame = -1;
    m->change_at = 0.0;
    m->next_at = 0.0;
}

void pet_mouth_start(PetMouth *m, double now) {
    m->speaking = 1;
    m->syllables_left = 0;
    m->pending_pause = 0;
    m->next_at = now; /* 立即出第一个音节 */
}

void pet_mouth_stop(PetMouth *m) {
    m->speaking = 0;
    m->pending_pause = 0;
    m->syllables_left = 0;
}

static void mouth_set_frame(PetMouth *m, int frame, double now) {
    if (frame != m->frame) {
        m->prev_frame = m->frame;
        m->frame = frame;
        m->change_at = now;
    }
}

int pet_mouth_update(PetMouth *m, double now, double *alpha) {
    double r;
    if (!m->speaking) {
        mouth_set_frame(m, -1, now);
        if (alpha) *alpha = 0.0;
        return -1;
    }
    if (now >= m->next_at) {
        if (m->pending_pause) {
            /* 词间闭口停顿 120–260ms */
            m->pending_pause = 0;
            mouth_set_frame(m, -1, now);
            m->next_at = now + PET_MOUTH_PAUSE_MIN +
                         pet_rand01(&m->rng) * (PET_MOUTH_PAUSE_MAX - PET_MOUTH_PAUSE_MIN);
        } else {
            double dur;
            int frame;
            if (m->syllables_left <= 0) {
                /* 新词：2–4 个音节 */
                m->syllables_left = 2 + (int)(pet_rand01(&m->rng) * 3.0);
            }
            r = pet_rand01(&m->rng);
            if (r < PET_MOUTH_ACCENT_P) {
                dur = PET_MOUTH_ACCENT_MIN +
                      pet_rand01(&m->rng) * (PET_MOUTH_ACCENT_MAX - PET_MOUTH_ACCENT_MIN);
            } else {
                dur = PET_MOUTH_SYL_MIN +
                      pet_rand01(&m->rng) * (PET_MOUTH_SYL_MAX - PET_MOUTH_SYL_MIN);
            }
            frame = (int)(pet_rand01(&m->rng) * PET_MOUTH_FRAMES);
            if (frame >= PET_MOUTH_FRAMES) frame = PET_MOUTH_FRAMES - 1;
            mouth_set_frame(m, frame, now);
            m->next_at = now + dur;
            m->syllables_left--;
            if (m->syllables_left == 0 && pet_rand01(&m->rng) < PET_MOUTH_PAUSE_P) {
                m->pending_pause = 1;
            }
        }
    }
    if (alpha) {
        double t = (now - m->change_at) / PET_MOUTH_XFADE;
        *alpha = t >= 1.0 ? 1.0 : (t < 0.0 ? 0.0 : t);
    }
    return m->frame;
}
