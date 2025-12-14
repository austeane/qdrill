import { device } from './deviceStore.svelte.js';

export { device };

export function refreshDeviceState() {
	device.refresh();
}
