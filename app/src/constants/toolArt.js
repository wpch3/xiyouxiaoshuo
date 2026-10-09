// 工具插画与鼠标光标：内联 data URI，不依赖静态资源 MIME/代理，杜绝 404/破图。
// 光标 SVG 内在尺寸 32px（浏览器光标尺寸上限友好）。
const hammerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 64 64" fill="none"><defs><linearGradient id="s" x1="11" y1="6" x2="42" y2="23" gradientUnits="userSpaceOnUse"><stop stop-color="#F7FBFF"/><stop offset=".45" stop-color="#9BC8EE"/><stop offset="1" stop-color="#456A91"/></linearGradient><linearGradient id="w" x1="28" y1="20" x2="45" y2="53" gradientUnits="userSpaceOnUse"><stop stop-color="#F1C27D"/><stop offset="1" stop-color="#A76539"/></linearGradient></defs><g transform="rotate(-12 31 30)"><path d="M27 19 42 34 23 54c-2 2-5 2-7 0s-2-5 0-7l11-28Z" fill="url(#w)" stroke="#5D3825" stroke-width="2.5" stroke-linejoin="round"/><path d="m11 8 28 1 10 10-8 9-11-5-23-3 4-12Z" fill="url(#s)" stroke="#244464" stroke-width="2.5" stroke-linejoin="round"/><path d="m9 17 22 2 8 5-6 6-13-5-13-1 2-7Z" fill="#D9ECFC" opacity=".9"/><path d="m35 10 4 1 9 8-4 4-10-9 1-4Z" fill="#fff" opacity=".65"/></g><circle cx="8" cy="8" r="3" fill="#fff" stroke="#1E293B" stroke-width="2"/></svg>`;

const handSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 64 64" fill="none"><defs><linearGradient id="k" x1="19" y1="8" x2="43" y2="51" gradientUnits="userSpaceOnUse"><stop stop-color="#FFF0DF"/><stop offset=".62" stop-color="#F3BFA8"/><stop offset="1" stop-color="#D88978"/></linearGradient><linearGradient id="c" x1="10" y1="42" x2="27" y2="59" gradientUnits="userSpaceOnUse"><stop stop-color="#DDEBFF"/><stop offset="1" stop-color="#7597D7"/></linearGradient></defs><g stroke="#794F59" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M27 10c0-3 2-5 5-5s5 2 5 5v17-6c0-3 2-5 5-5s5 2 5 5v12l3-4c2-2 5-2 7 0 2 2 2 4 1 7l-6 16c-1 3-4 5-8 5H27c-5 0-9-3-11-7L8 39c-2-3-1-6 2-8 3-2 6-1 8 2l5 7V15c0-3 1-5 4-5Z" fill="url(#k)"/><path d="M27 12v20M37 12v15M47 23v13" stroke="#FFF8EF" opacity=".9"/><path d="M12 43 8 50c-1 2 0 5 2 6l10 4 7-12-15-5Z" fill="url(#c)"/></g><circle cx="32" cy="6" r="3" fill="#fff" stroke="#794F59" stroke-width="2"/></svg>`;

const uri = (svg) => `data:image/svg+xml,${encodeURIComponent(svg)}`;

export const TOOL_ART = {
  hammer: uri(hammerSvg),
  pet: uri(handSvg),
};

export const TOOL_CURSORS = {
  hammer: `url("${uri(hammerSvg)}") 6 6, crosshair`,
  pet: `url("${uri(handSvg)}") 14 4, grab`,
};
