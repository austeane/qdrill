import { writable } from 'svelte/store';

export const feedbackModalVisible = writable(false);
export const feedbackList = writable([]);
