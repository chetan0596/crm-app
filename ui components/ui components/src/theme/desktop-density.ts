/**
 * Desktop Density System
 * Provides responsive sizing utilities for desktop breakpoints
 */

export const desktopDensityQuery = '@media (min-width: 1280px)';

/**
 * Responsive font size for desktop
 * @param px - Font size in pixels for mobile
 * @returns Object with responsive font sizes
 */
export const desktopFont = (px: number) => ({
  xs: px,
  sm: px,
  md: px,
  lg: px,
  xl: px,
});

/**
 * Responsive size for desktop
 * @param px - Size in pixels for mobile
 * @returns Object with responsive sizes
 */
export const desktopSize = (px: number) => ({
  xs: px,
  sm: px,
  md: px,
  lg: px,
  xl: px,
});

/**
 * Responsive spacing for desktop
 * @param px - Spacing in pixels for mobile
 * @returns Object with responsive spacing
 */
export const desktopSpacing = (px: number) => ({
  xs: px,
  sm: px,
  md: px,
  lg: px,
  xl: px,
});

/**
 * Responsive font size with fallback
 * @param px - Font size in pixels
 * @returns Desktop font size value
 */
export const desktopFontSize = (px: number) => px;

/**
 * Minimum size for desktop
 * @param px - Size in pixels
 * @returns Minimum size value
 */
export const desktopSizeMin = (px: number) => px;

/**
 * Responsive value for desktop
 * @param px - Value in pixels
 * @returns Object with responsive values
 */
export const desktopValue = (px: number) => ({
  xs: px,
  sm: px,
  md: px,
  lg: px,
  xl: px,
});
