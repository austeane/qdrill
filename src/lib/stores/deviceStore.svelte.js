import { browser } from '$app/environment';
import { on } from 'svelte/events';
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

const DEFAULT_SAFE_AREA_INSETS = { top: 0, right: 0, bottom: 0, left: 0 };

export class DeviceStore {
	type = $state(DEVICE_TYPES.DESKTOP);
	width = $state(0);
	height = $state(0);
	hasTouch = $state(false);
	isIOS = $state(false);
	isAndroid = $state(false);
	safeAreaInsets = $state(DEFAULT_SAFE_AREA_INSETS);
	orientation = $state('portrait');

	refresh() {
		if (!browser) return;

		const viewport = getViewportDimensions();

		this.type = getDeviceType();
		this.width = viewport.width;
		this.height = viewport.height;
		this.hasTouch = isTouchDevice();
		this.isIOS = isIOS();
		this.isAndroid = isAndroid();
		this.safeAreaInsets = getSafeAreaInsets();
		this.orientation = viewport.width > viewport.height ? 'landscape' : 'portrait';
	}

	get isMobile() {
		return this.type === DEVICE_TYPES.MOBILE;
	}

	get isTablet() {
		return this.type === DEVICE_TYPES.TABLET;
	}

	get isDesktop() {
		return this.type === DEVICE_TYPES.DESKTOP;
	}

	get isMobileOrTablet() {
		return this.type === DEVICE_TYPES.MOBILE || this.type === DEVICE_TYPES.TABLET;
	}

	get isLandscape() {
		return this.orientation === 'landscape';
	}

	get isPortrait() {
		return this.orientation === 'portrait';
	}

	isAbove(breakpoint) {
		return this.width >= (BREAKPOINTS[breakpoint] || 0);
	}

	isBelow(breakpoint) {
		return this.width < (BREAKPOINTS[breakpoint] || 9999);
	}

	isBetween(min, max) {
		const minWidth = BREAKPOINTS[min] || 0;
		const maxWidth = BREAKPOINTS[max] || 9999;
		return this.width >= minWidth && this.width < maxWidth;
	}
}

export const device = new DeviceStore();

if (browser) {
	device.refresh();

	const handleResize = throttle(() => device.refresh(), 100);

	const offResize = on(window, 'resize', handleResize);
	const offOrientationChange = on(window, 'orientationchange', handleResize);
	const offVisibilityChange = on(document, 'visibilitychange', () => {
		if (!document.hidden) device.refresh();
	});

	const cleanup = () => {
		offResize();
		offOrientationChange();
		offVisibilityChange();
	};

	if (import.meta.hot) {
		import.meta.hot.dispose(cleanup);
	}
}
