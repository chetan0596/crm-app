import { Icon, addIcon } from '@iconify/react';

/**
 * Icon collection that should be loaded offline
 * Add icons here to prevent flickering
 */
export const allIconNames: string[] = [
  'mingcute:close-line',
  'eva:search-fill',
  'solar:arrow-up-bold',
  'solar:arrow-down-bold',
  'mingcute:add-line',
  'eva:trending-up-fill',
  'eva:trending-down-fill',
  'solar:file-text-bold',
];

/**
 * Icon name type for type safety
 */
export type IconifyName = string;

/**
 * Register icons for offline use
 */
export function registerIcons() {
  // Icons will be registered here when needed
  // For now, this is a placeholder for future icon registration
}
