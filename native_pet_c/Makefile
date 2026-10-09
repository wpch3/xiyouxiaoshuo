# native_pet_c - 原生桌宠（C 语言）
#   make test          在 Linux/macOS/Windows(MinGW) 上运行纯逻辑自检（无需 GUI）
#   make win           交叉/本机 MinGW-w64 构建 Windows 桌宠 exe（需 x86_64-w64-mingw32-gcc）
#   make win-zig       用 zig cc 交叉构建（沙箱验证用）
#   make clean

CC      ?= gcc
CFLAGS  ?= -std=c99 -O2 -Wall -Wextra -Werror -Iinclude
ASSETS  ?= ../app/public/characters/deepseek_layers
OUT     := build

.PHONY: all test win win-zig clean

all: test

$(OUT):
	mkdir -p $(OUT)

$(OUT)/test_core: tests/test_core.c src/pet_core.c include/pet_core.h | $(OUT)
	$(CC) $(CFLAGS) tests/test_core.c src/pet_core.c -o $@ -lm

test: $(OUT)/test_core
	./$(OUT)/test_core $(ASSETS)

ZIG_PY   ?= python3
WIN_CC    ?= x86_64-w64-mingw32-gcc
WIN_FLAGS := -std=c99 -O2 -Wall -Wextra -Iinclude -municode -mwindows -DUNICODE -D_UNICODE
WIN_LIBS  := -lgdiplus -lshell32 -luser32 -lgdi32 -lmsimg32

win: | $(OUT)
	$(WIN_CC) $(WIN_FLAGS) src/pet_win32.c src/pet_core.c -o $(OUT)/AITokenPetC.exe $(WIN_LIBS)

win-zig: | $(OUT)
	$(ZIG_PY) -m ziglang cc -target x86_64-windows-gnu -municode -std=c99 -O2 -Wall -Wextra -Iinclude \
	  src/pet_win32.c src/pet_core.c -o $(OUT)/AITokenPetC.exe -Wl,--subsystem,windows $(WIN_LIBS)

clean:
	rm -rf $(OUT)
