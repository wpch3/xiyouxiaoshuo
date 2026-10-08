import manifest from '../rig/assetManifest.json';

// 角色立绘路径：使用相对路径（build 时 base 为 './'），保证 pywebview 通过 file:// 打开 dist 时也能加载
export const characterImage = (file) => `${import.meta.env.BASE_URL}characters/${file}`;

// 通过质检、可以用于骨骼渲染和界面展示的素材
export const approvedAsset = (file) => manifest.assets[file] || null;
