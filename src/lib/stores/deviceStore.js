export { device } from './deviceStore.svelte.js';

export function refreshDeviceState() {
	device.refresh();
}
