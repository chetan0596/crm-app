// Ported from `minimal-shared/utils` (used by Minimal UI Kit).

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

export function hexToRgbChannel(hex) {
  if (!HEX_RE.test(hex)) throw new Error(`Invalid hex color: ${hex}`);
  let value = hex.slice(1);
  if (value.length === 3) value = value.split('').map((c) => c + c).join('');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

export function createPaletteChannel(hexPalette) {
  const channelPalette = {};
  Object.entries(hexPalette).forEach(([key, value]) => {
    channelPalette[`${key}Channel`] = hexToRgbChannel(value);
  });
  return { ...hexPalette, ...channelPalette };
}

export function varAlpha(color, opacity = 1) {
  const unsupported =
    color.startsWith('#') ||
    color.startsWith('rgb') ||
    color.startsWith('rgba') ||
    (!color.includes('var') && color.includes('Channel'));

  if (unsupported) {
    throw new Error(`[Alpha]: Unsupported color format "${color}". Use an RGB channel or a CSS var() channel.`);
  }
  return `rgba(${color} / ${opacity})`;
}

export const pxToRem = (value) => `${value / 16}rem`;
export const remToPx = (value) => Math.round(parseFloat(value) * 16);

export function setFont(fontName) {
  return `"${fontName}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
}

export function mergeClasses(classNames = [], state = {}) {
  const base = classNames.filter(Boolean).join(' ');
  const extra = Object.entries(state).filter(([, v]) => Boolean(v)).map(([k]) => k).join(' ');
  return [base, extra].filter(Boolean).join(' ');
}
