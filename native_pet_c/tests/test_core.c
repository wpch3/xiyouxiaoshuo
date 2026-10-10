/*
 * test_core.c - pet_core 纯逻辑自检（可在 Linux/Windows 直接运行，无需 GUI）。
 * 用法：test_core [素材目录]   素材目录可选；给出则校验 18 张拆件文件存在。
 */
#include <stdio.h>
#include <string.h>
#include <math.h>
#include <stdlib.h>

#include "../include/pet_core.h"

static int g_fail = 0;
static int g_total = 0;

#define CHECK(name, cond)                                  \
    do {                                                   \
        int _ok = (cond) ? 1 : 0;                          \
        g_total++;                                         \
        if (!_ok) g_fail++;                                \
        printf("%s %s\n", _ok ? "PASS" : "FAIL", name);    \
    } while (0)

#define NEAR(a, b, eps) (fabs((double)(a) - (double)(b)) <= (eps))

static void test_layer_table(void) {
    static const char *expected[PET_LAYER_COUNT] = {
        "body_base", "eye_open_l", "eye_open_r", "eye_closed_l", "eye_closed_r",
        "brow_l", "brow_r", "mouth_closed"};
    int i, ok = 1;
    for (i = 0; i < PET_LAYER_COUNT; i++) {
        if (strcmp(PET_LAYERS[i].name, expected[i]) != 0) ok = 0;
    }
    CHECK("layer_z_order_matches_handover", ok);
    CHECK("iris_is_gaze_layer", PET_LAYERS[1].mode == PET_MODE_GAZE);
    CHECK("eyelids_is_blink_layer", PET_LAYERS[3].mode == PET_MODE_BLINK);
}

static void test_geometry(void) {
    PetSize a = pet_window_size(0.55);
    PetSize b = pet_window_size(1.0);
    PetSize c = pet_window_size(99.0);
    CHECK("window_size_default_484x774", a.width == 484 && a.height == 774);
    CHECK("window_size_unit_880x1408", b.width == PET_RIG_W && b.height == PET_RIG_H);
    CHECK("scale_clamped_max", NEAR(c.width, PET_RIG_W * PET_SCALE_MAX, 1.0));
    CHECK("scale_clamp_min", NEAR(pet_clamp_scale(0.01), PET_SCALE_MIN, 1e-9));
    CHECK("wheel_up_grows", pet_step_scale(1.0, 1) > 1.0);
    CHECK("wheel_down_shrinks", pet_step_scale(1.0, 0) < 1.0);
}

static void test_state_machine(void) {
    PetState s;
    pet_init(&s, 0.0, PET_SCALE_DEFAULT);
    CHECK("idle_default", s.action == PET_ACT_IDLE);
    CHECK("idle_to_tap", pet_request(&s, PET_ACT_TAP, 0, 0.0) == 1);
    CHECK("tap_blocks_idle_noninterruptible", pet_request(&s, PET_ACT_IDLE, 0, 0.1) == 0);
    CHECK("pat_interrupts_tap", pet_request(&s, PET_ACT_PAT, 0, 0.1) == 1 && s.action == PET_ACT_PAT);
    CHECK("tap_cannot_override_pat", pet_request(&s, PET_ACT_TAP, 0, 0.15) == 0);
    CHECK("force_wake_to_idle", pet_request(&s, PET_ACT_IDLE, 1, 0.2) == 1 && s.action == PET_ACT_IDLE);
    pet_request(&s, PET_ACT_TAP, 0, 1.0);
    pet_expire(&s, 1.0 + PET_ACTION_SPECS[PET_ACT_TAP].duration + 0.01);
    CHECK("tap_expires_to_idle", s.action == PET_ACT_IDLE);
    CHECK("sleep_enter_request", pet_request(&s, PET_ACT_SLEEP, 0, 5.0) == 1);
    CHECK("sleep_interruptible_by_tap", pet_request(&s, PET_ACT_TAP, 0, 5.1) == 1);
}

static void test_sleep_and_wake(void) {
    PetState s;
    pet_init(&s, 0.0, PET_SCALE_DEFAULT);
    /* 系统空闲 100s，且宠物本身 100s 无互动 -> 进入睡眠 */
    pet_update(&s, 100.0, 100.0, 0.0, 0.0);
    CHECK("sleep_after_90s_idle", pet_is_sleeping(&s));
    /* 系统空闲降到 0 -> 唤醒 */
    pet_update(&s, 100.1, 0.0, 0.0, 0.0);
    CHECK("wake_when_system_active", !pet_is_sleeping(&s));
    /* 非 Win32：无系统空闲信息，回退为本地计时，90s 无互动后睡眠 */
    pet_init(&s, 0.0, PET_SCALE_DEFAULT);
    pet_update(&s, 91.0, -1.0, 0.0, 0.0);
    CHECK("fallback_local_idle_sleeps", pet_is_sleeping(&s));
    pet_init(&s, 0.0, PET_SCALE_DEFAULT);
    pet_update(&s, 50.0, -1.0, 0.0, 0.0);
    CHECK("fallback_local_idle_awake_under_90s", !pet_is_sleeping(&s));
    /* 按键唤醒+触发轻点 */
    pet_update(&s, 300.0, 200.0, 0.0, 0.0);
    CHECK("sleep_again", pet_is_sleeping(&s));
    pet_on_key(&s, 300.0);
    CHECK("key_wakes_from_sleep", s.action == PET_ACT_IDLE);
    pet_on_key(&s, 300.1);
    CHECK("key_when_awake_taps", s.action == PET_ACT_TAP);
    /* 睡眠中鼠标按下只唤醒，不触发摸头 */
    pet_init(&s, 0.0, PET_SCALE_DEFAULT);
    pet_update(&s, 95.0, 95.0, 0.0, 0.0);
    CHECK("sleep_for_press_test", pet_is_sleeping(&s));
    pet_on_press(&s, 95.0, 5.0, 300.0);
    CHECK("press_in_sleep_only_wakes", s.action == PET_ACT_IDLE);
}

static void test_touch_zones(void) {
    PetState s;
    double h = 347.0;
    pet_init(&s, 0.0, PET_SCALE_DEFAULT);
    CHECK("head_zone_top_30pct", pet_in_head_zone(h * 0.10, h) && !pet_in_head_zone(h * 0.5, h));
    CHECK("press_head_is_pat", pet_on_press(&s, 1.0, h * 0.15, h) == PET_ACT_PAT);
    pet_init(&s, 0.0, PET_SCALE_DEFAULT);
    CHECK("press_body_is_tap", pet_on_press(&s, 1.0, h * 0.60, h) == PET_ACT_TAP);
    CHECK("tap_click_duration", NEAR(PET_CLICK_TAP_DUR, 0.30, 1e-9));
}

static void test_pat_throttle(void) {
    PetState s;
    double h = 347.0;
    pet_init(&s, 0.0, PET_SCALE_DEFAULT);
    pet_on_press(&s, 10.0, h * 0.1, h);
    CHECK("pat_trigger_recorded", NEAR(s.last_pat_trigger, 10.0, 1e-9));
    pet_on_drag_head(&s, 10.1, h * 0.1, h);
    CHECK("drag_within_throttle_ignored", NEAR(s.last_pat_trigger, 10.0, 1e-9));
    pet_on_drag_head(&s, 10.3, h * 0.1, h);
    CHECK("drag_after_throttle_retriggers", NEAR(s.last_pat_trigger, 10.3, 1e-9) && s.action == PET_ACT_PAT);
}

static void test_gaze_limits(void) {
    PetState s;
    PetLayerDraw d[PET_LAYER_COUNT];
    int i, n;
    double tx;
    pet_init(&s, 0.0, 1.0);
    /* 光标远离：目标钳制在 +-1 */
    tx = pet_gaze_target_axis(10000.0, 424.0, 2.2);
    CHECK("gaze_target_clamped", NEAR(tx, 1.0, 1e-9));
    CHECK("gaze_target_zero_center", NEAR(pet_gaze_target_axis(0.0, 424.0, 2.2), 0.0, 1e-9));
    for (i = 0; i < 400; i++) pet_update(&s, i * 0.033, 0.0, 1.0, 1.0);
    CHECK("gaze_eases_to_target", NEAR(s.look_x, 1.0, 1e-3));
    n = pet_layout(&s, 13.2, d);
    CHECK("layout_count", n == PET_LAYER_COUNT);
    CHECK("gaze_x_limit_rig", NEAR(d[1].dx, PET_GAZE_LIMIT_X, 1e-3));
    CHECK("gaze_y_limit_rig", NEAR(d[1].dy, PET_GAZE_LIMIT_Y, 1e-3));
    /* 缩放 2x 时位移等比放大 */
    pet_init(&s, 0.0, 2.0);
    for (i = 0; i < 400; i++) pet_update(&s, i * 0.033, 0.0, -1.0, -1.0);
    pet_layout(&s, 13.2, d);
    CHECK("gaze_scales_with_zoom", NEAR(d[1].dx, -2.0 * PET_GAZE_LIMIT_X, 1e-3) && NEAR(d[1].dy, -2.0 * PET_GAZE_LIMIT_Y, 1e-3));
}

static void test_blink_schedule(void) {
    PetState s;
    PetLayerDraw d[PET_LAYER_COUNT];
    double t, dt = 0.01;
    int blinks = 0, was = 0;
    pet_init(&s, 0.0, PET_SCALE_DEFAULT);
    for (t = 0.0; t < 46.0; t += dt) {
        int vis;
        pet_update(&s, t, 0.0, 0.0, 0.0);
        pet_layout(&s, t, d);
        vis = d[3].visible;
        if (vis && !was) blinks++;
        was = vis;
    }
    /* 46s / 4.6s 周期 = 10 次眨眼（首次在 2s） */
    CHECK("blink_count_about_10_in_46s", blinks >= 9 && blinks <= 10);
    pet_init(&s, 0.0, PET_SCALE_DEFAULT);
    s.next_blink = 0.0;
    pet_update(&s, 1.0, 0.0, 0.0, 0.0);
    pet_layout(&s, 1.0, d);
    CHECK("eyelids_visible_during_hold", d[3].visible == 1);
    pet_layout(&s, 1.0 + PET_BLINK_HOLD + 0.01, d);
    CHECK("eyelids_hidden_after_hold", d[3].visible == 0);
}

static void test_hop_and_pat_alpha(void) {
    PetState s;
    PetLayerDraw d[PET_LAYER_COUNT];
    double ref;
    pet_init(&s, 0.0, PET_SCALE_DEFAULT);
    pet_on_press(&s, 5.0, 10.0, 347.0);
    pet_layout(&s, 5.05, d);
    ref = PET_SCALE_DEFAULT / PET_SCALE_DEFAULT;
    CHECK("pat_hops_up", NEAR(d[2].dy, -PET_HOP_PAT * ref, 1e-6));
    CHECK("pat_eyelids_half_alpha", d[3].visible && NEAR(d[3].alpha, PET_PAT_EYE_ALPHA, 1e-9));
    pet_init(&s, 0.0, PET_SCALE_DEFAULT);
    pet_on_press(&s, 5.0, 200.0, 347.0);
    pet_layout(&s, 5.05, d);
    CHECK("tap_hops_more_than_pat", NEAR(d[2].dy, -PET_HOP_TAP * ref, 1e-6));
}

static void test_mouth_scheduler(void) {
    PetMouth m;
    double now, dt = 0.0005, alpha = 0.0;
    int bad = 0, syll = 0, pauses = 0, accents = 0;
    double prev_next;
    pet_mouth_init(&m, 12345u);
    pet_mouth_start(&m, 0.0);
    prev_next = m.next_at;
    for (now = 0.0; now < 120.0; now += dt) {
        int f = pet_mouth_update(&m, now, &alpha);
        if (m.next_at != prev_next) {
            double dur = m.next_at - now;
            prev_next = m.next_at;
            if (f == -1) {
                pauses++;
                if (dur < PET_MOUTH_PAUSE_MIN - 1e-6 || dur > PET_MOUTH_PAUSE_MAX + 1e-6) bad++;
            } else {
                syll++;
                if (dur >= PET_MOUTH_ACCENT_MIN - 1e-6 && dur <= PET_MOUTH_ACCENT_MAX + 1e-6) {
                    accents++;
                } else if (dur < PET_MOUTH_SYL_MIN - 1e-6 || dur > PET_MOUTH_SYL_MAX + 1e-6) {
                    bad++;
                }
                if (f < 0 || f >= PET_MOUTH_FRAMES) bad++;
            }
        }
        if (alpha < 0.0 || alpha > 1.0) bad++;
    }
    CHECK("mouth_durations_in_spec", bad == 0);
    CHECK("mouth_has_syllables", syll > 300);
    CHECK("mouth_has_word_pauses", pauses > 20);
    CHECK("mouth_accent_ratio_plausible", accents > 0 && accents < syll / 3);
    pet_mouth_stop(&m);
    pet_mouth_update(&m, 200.0, &alpha);
    CHECK("mouth_closed_when_stopped", m.frame == -1);
}

static void test_rand_range(void) {
    uint32_t st = 42u;
    double sum = 0.0;
    int i, ok = 1;
    for (i = 0; i < 100000; i++) {
        double r = pet_rand01(&st);
        if (r < 0.0 || r >= 1.0) ok = 0;
        sum += r;
    }
    CHECK("rand_in_unit_interval", ok);
    CHECK("rand_mean_near_half", NEAR(sum / 100000.0, 0.5, 0.01));
}

static int check_assets(const char *dir) {
    static const char *names[] = {
        "body_base", "eye_open_l", "eye_open_r", "eye_closed_l", "eye_closed_r",
        "brow_l", "brow_r", "mouth_closed"};
    int i, ok = 1;
    for (i = 0; i < (int)(sizeof names / sizeof names[0]); i++) {
        char path[1024];
        FILE *f;
        snprintf(path, sizeof path, "%s/%s.png", dir, names[i]);
        f = fopen(path, "rb");
        if (!f) {
            printf("  missing %s\n", path);
            ok = 0;
        } else {
            fclose(f);
        }
    }
    CHECK("assets_layers_present", ok);
    return ok;
}

int main(int argc, char **argv) {
    test_layer_table();
    test_geometry();
    test_state_machine();
    test_sleep_and_wake();
    test_touch_zones();
    test_pat_throttle();
    test_gaze_limits();
    test_blink_schedule();
    test_hop_and_pat_alpha();
    test_mouth_scheduler();
    test_rand_range();
    if (argc > 1) check_assets(argv[1]);
    printf("%d/%d passed\n", g_total - g_fail, g_total);
    printf("NATIVE_CORE_SELFTEST %s\n", g_fail == 0 ? "OK" : "BROKEN");
    return g_fail == 0 ? 0 : 1;
}
