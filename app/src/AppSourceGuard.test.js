import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// 防回归守卫：关键状态"声明必须先于使用"（曾因 rebase 冲突解决丢声明导致运行时 ReferenceError）
const appSource = readFileSync(fileURLToPath(new URL('./App.jsx', import.meta.url)), 'utf-8');

describe('App.jsx 源码守卫', () => {
  it('petScale 状态声明存在且先于使用', () => {
    const decl = appSource.indexOf('const [petScale, setPetScale] = useState(');
    const use = appSource.indexOf('Math.round(320 * petScale)');
    expect(decl).toBeGreaterThan(-1);
    expect(use).toBeGreaterThan(-1);
    expect(decl).toBeLessThan(use);
  });

  it('缩放值持久化到 pet_scale_v1', () => {
    expect(appSource).toContain("localStorage.setItem('pet_scale_v1'");
  });
});
