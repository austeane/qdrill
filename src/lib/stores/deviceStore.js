/**
 * Device Store - Reactive device detection for Svelte components
 * 
 * This store provides reactive device type detection that automatically updates
 * when the viewport changes. It's designed to be used across the entire application
 * for responsive behavior that goes beyond CSS media queries.
 * 
 * Usage in Svelte components:
 * 
 * Basic usage:
 *   import { device } from '$lib/stores/deviceStore';
 *   {#if $device.isMobile}
 *     <MobileComponent />
 *   {:else}
 *     <DesktopComponent />
 *   {/if}
 * 
 * With specific device checks:
 *   import { device } from '$lib/stores/deviceStore';
 *   $: showMobileNav = $device.isMobile || $device.isTablet;
 *   $: enableTouch = $device.hasTouch;
 * 
 * For SSR-safe usage in +page.svelte:
 *   import { device } from '$lib/stores/deviceStore';
 *   import { browser } from '$app/environment';
 *   $: currentDevice = browser ? $device : { type: 'desktop', isMobile: false };
 */

import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { 
  getDeviceType, 
  isTouchDevice, 
  isIOS, 
  isAndroid,
  getSafeAreaInsets,
  getViewportDimensions,
  DEVICE_TYPES,
  BREAKPOINTS,
  throttle
} from '$lib/utils/mobile.js';

// Initialize with SSR-safe defaults
const initialState = {
  type: DEVICE_TYPES.DESKTOP,
  width: 0,
  height: 0,
  hasTouch: false,
  isIOS: false,
  isAndroid: false,
  safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 },
  orientation: 'portrait'
};

// Create the base writable store
const deviceState = writable(initialState);

// Helper function to update device state
function updateDeviceState() {
  if (!browser) return;
  
  const viewport = getViewportDimensions();
  
  deviceState.set({
    type: getDeviceType(),
    width: viewport.width,
    height: viewport.height,
    hasTouch: isTouchDevice(),
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    safeAreaInsets: getSafeAreaInsets(),
    orientation: viewport.width > viewport.height ? 'landscape' : 'portrait'
  });
}

// Initialize on client side
if (browser) {
  // Initial update
  updateDeviceState();
  
  // Throttled resize handler
  const handleResize = throttle(updateDeviceState, 100);
  
  // Listen for viewport changes
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);
  
  // Also update on visibility change (for mobile browsers)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      updateDeviceState();
    }
  });
}

// Create derived stores for convenience
export const device = derived(deviceState, ($state) => ({
  ...$state,
  isMobile: $state.type === DEVICE_TYPES.MOBILE,
  isTablet: $state.type === DEVICE_TYPES.TABLET,
  isDesktop: $state.type === DEVICE_TYPES.DESKTOP,
  isMobileOrTablet: $state.type === DEVICE_TYPES.MOBILE || $state.type === DEVICE_TYPES.TABLET,
  isLandscape: $state.orientation === 'landscape',
  isPortrait: $state.orientation === 'portrait',
  // Convenience methods for breakpoint checks
  isAbove: (breakpoint) => $state.width >= (BREAKPOINTS[breakpoint] || 0),
  isBelow: (breakpoint) => $state.width < (BREAKPOINTS[breakpoint] || 9999),
  isBetween: (min, max) => {
    const minWidth = BREAKPOINTS[min] || 0;
    const maxWidth = BREAKPOINTS[max] || 9999;
    return $state.width >= minWidth && $state.width < maxWidth;
  }
}));

// Export individual derived stores for specific use cases
export const isMobileDevice = derived(device, $d => $d.isMobile);
export const isTabletDevice = derived(device, $d => $d.isTablet);
export const isDesktopDevice = derived(device, $d => $d.isDesktop);
export const deviceType = derived(device, $d => $d.type);
export const viewport = derived(device, $d => ({ width: $d.width, height: $d.height }));
export const safeAreas = derived(device, $d => $d.safeAreaInsets);
export const deviceOrientation = derived(device, $d => $d.orientation);

// Export a function to manually trigger an update (useful for testing)
export function refreshDeviceState() {
  updateDeviceState();
}

// Export viewport breakpoint helpers as derived stores
export const breakpoints = {
  xs: derived(device, $d => $d.width >= BREAKPOINTS.xs),
  sm: derived(device, $d => $d.width >= BREAKPOINTS.sm),
  md: derived(device, $d => $d.width >= BREAKPOINTS.md),
  lg: derived(device, $d => $d.width >= BREAKPOINTS.lg),
  xl: derived(device, $d => $d.width >= BREAKPOINTS.xl),
  '2xl': derived(device, $d => $d.width >= BREAKPOINTS['2xl'])
};