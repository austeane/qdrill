/**
 * Mobile Detection and Responsive Utilities
 * 
 * This module provides utilities for detecting mobile devices and managing responsive behavior
 * across the entire QDrill application. It includes both CSS-based (via media queries) and
 * JavaScript-based detection for cases where behavior needs to change beyond styling.
 * 
 * Usage across the site:
 * 
 * 1. In Svelte components:
 *    import { isMobile, isTablet, getDeviceType } from '$lib/utils/mobile';
 *    const mobile = isMobile();
 *    
 * 2. For reactive updates:
 *    import { onMount } from 'svelte';
 *    import { isMobile } from '$lib/utils/mobile';
 *    let mobile = false;
 *    onMount(() => {
 *      mobile = isMobile();
 *      const handleResize = () => mobile = isMobile();
 *      window.addEventListener('resize', handleResize);
 *      return () => window.removeEventListener('resize', handleResize);
 *    });
 * 
 * 3. For SSR-safe detection:
 *    import { browser } from '$app/environment';
 *    import { isMobile } from '$lib/utils/mobile';
 *    $: mobile = browser ? isMobile() : false;
 */

// Breakpoint definitions matching Tailwind's default breakpoints
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

// Device type constants
export const DEVICE_TYPES = {
  MOBILE: 'mobile',
  TABLET: 'tablet',
  DESKTOP: 'desktop'
};

/**
 * Check if current viewport width is mobile size
 * @returns {boolean} true if viewport width < 768px (md breakpoint)
 */
export function isMobile() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < BREAKPOINTS.md;
}

/**
 * Check if current viewport width is tablet size
 * @returns {boolean} true if viewport width >= 768px and < 1024px
 */
export function isTablet() {
  if (typeof window === 'undefined') return false;
  const width = window.innerWidth;
  return width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
}

/**
 * Check if current viewport width is desktop size
 * @returns {boolean} true if viewport width >= 1024px
 */
export function isDesktop() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS.lg;
}

/**
 * Get current device type based on viewport width
 * @returns {string} 'mobile' | 'tablet' | 'desktop'
 */
export function getDeviceType() {
  if (typeof window === 'undefined') return DEVICE_TYPES.DESKTOP;
  
  const width = window.innerWidth;
  if (width < BREAKPOINTS.md) return DEVICE_TYPES.MOBILE;
  if (width < BREAKPOINTS.lg) return DEVICE_TYPES.TABLET;
  return DEVICE_TYPES.DESKTOP;
}

/**
 * Check if device has touch capability
 * @returns {boolean} true if device supports touch
 */
export function isTouchDevice() {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Check if running on iOS
 * @returns {boolean} true if iOS device
 */
export function isIOS() {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

/**
 * Check if running on Android
 * @returns {boolean} true if Android device
 */
export function isAndroid() {
  if (typeof window === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
}

/**
 * Get safe area insets for mobile devices (notches, home indicators)
 * @returns {object} { top, right, bottom, left } in pixels
 */
export function getSafeAreaInsets() {
  if (typeof window === 'undefined') return { top: 0, right: 0, bottom: 0, left: 0 };
  
  const computedStyle = window.getComputedStyle(document.documentElement);
  return {
    top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0'),
    right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0'),
    bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
    left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0')
  };
}

/**
 * Create a media query listener with callback
 * @param {string} query - Media query string (e.g., '(min-width: 768px)')
 * @param {function} callback - Function to call when query matches/unmatches
 * @returns {function} Cleanup function to remove listener
 */
export function watchMediaQuery(query, callback) {
  if (typeof window === 'undefined') return () => {};
  
  const mediaQuery = window.matchMedia(query);
  const handler = (e) => callback(e.matches);
  
  // Call immediately with current state
  handler(mediaQuery);
  
  // Listen for changes
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  } else {
    // Fallback for older browsers
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }
}

/**
 * Get viewport dimensions
 * @returns {object} { width, height } in pixels
 */
export function getViewportDimensions() {
  if (typeof window === 'undefined') return { width: 0, height: 0 };
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
}

/**
 * Check if viewport matches a specific breakpoint
 * @param {string} breakpoint - Breakpoint name (sm, md, lg, xl, 2xl)
 * @param {string} operator - Comparison operator ('min', 'max', 'only')
 * @returns {boolean} true if viewport matches the breakpoint condition
 */
export function matchesBreakpoint(breakpoint, operator = 'min') {
  if (typeof window === 'undefined') return false;
  
  const width = window.innerWidth;
  const bp = BREAKPOINTS[breakpoint];
  
  if (!bp && bp !== 0) {
    console.warn(`Invalid breakpoint: ${breakpoint}`);
    return false;
  }
  
  switch (operator) {
    case 'min':
      return width >= bp;
    case 'max':
      return width < bp;
    case 'only':
      const breakpoints = Object.values(BREAKPOINTS).sort((a, b) => a - b);
      const index = breakpoints.indexOf(bp);
      const nextBp = breakpoints[index + 1];
      return width >= bp && (nextBp ? width < nextBp : true);
    default:
      console.warn(`Invalid operator: ${operator}`);
      return false;
  }
}

/**
 * Throttle function execution (useful for resize handlers)
 * @param {function} func - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {function} Throttled function
 */
export function throttle(func, delay = 100) {
  let timeoutId;
  let lastExecTime = 0;
  
  return function (...args) {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}

/**
 * Format touch target size for mobile (minimum 44x44px)
 * @param {number} size - Desired size in pixels
 * @returns {number} Size ensuring minimum touch target
 */
export function ensureTouchTarget(size) {
  return Math.max(44, size);
}