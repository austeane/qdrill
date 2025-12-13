export { device } from './deviceStore.svelte';

export function refreshDeviceState() {
	device.refresh();
}
