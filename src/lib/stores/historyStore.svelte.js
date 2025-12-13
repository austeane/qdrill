import { toast } from '@zerodevx/svelte-toast';

let snapshotGetter = null;
let snapshotApplier = null;

// Allow the sections store to inject a snapshot getter to avoid circular deps
export function setSnapshotGetter(getter) {
	snapshotGetter = getter;
}

// Allow the sections store to inject how to apply snapshots (undo/redo)
export function setSnapshotApplier(applier) {
	snapshotApplier = applier;
}

// Maximum number of history steps to keep
const MAX_HISTORY = 50;

export class HistoryStore {
	commandHistory = $state([]);
	redoStack = $state([]);

	initializeHistory() {
		this.commandHistory = [];
		this.redoStack = [];
	}

	#createSnapshot() {
		if (typeof snapshotGetter !== 'function') return null;

		try {
			return snapshotGetter();
		} catch (error) {
			console.warn('[historyStore] Failed to create snapshot:', error);
			return null;
		}
	}

	addToHistory(type, payload, description) {
		const snapshot = this.#createSnapshot();
		const trimmedHistory = this.commandHistory.slice(
			Math.max(0, this.commandHistory.length - (MAX_HISTORY - 1))
		);

		this.commandHistory = [...trimmedHistory, { type, payload, snapshot, description }];
		this.redoStack = [];
	}

	undo() {
		if (this.commandHistory.length === 0) return;

		const lastCommand = this.commandHistory[this.commandHistory.length - 1];
		const currentSnapshot = this.#createSnapshot();

		if (typeof snapshotApplier === 'function' && lastCommand.snapshot) {
			snapshotApplier(lastCommand.snapshot);
		} else {
			console.warn('[historyStore] Cannot apply snapshot (missing applier or snapshot).');
			return;
		}

		this.redoStack = [
			...this.redoStack,
			{
				type: lastCommand.type,
				payload: lastCommand.payload,
				snapshot: currentSnapshot,
				description: lastCommand.description
			}
		];

		this.commandHistory = this.commandHistory.slice(0, -1);
		toast.push(`Undid: ${lastCommand.description}`);
	}

	redo() {
		if (this.redoStack.length === 0) return;

		const lastCommand = this.redoStack[this.redoStack.length - 1];
		const currentSnapshot = this.#createSnapshot();

		if (typeof snapshotApplier === 'function' && lastCommand.snapshot) {
			snapshotApplier(lastCommand.snapshot);
		} else {
			console.warn('[historyStore] Cannot apply snapshot (missing applier or snapshot).');
			return;
		}

		this.commandHistory = [
			...this.commandHistory,
			{
				type: lastCommand.type,
				payload: lastCommand.payload,
				snapshot: currentSnapshot,
				description: lastCommand.description
			}
		];

		this.redoStack = this.redoStack.slice(0, -1);
		toast.push(`Redid: ${lastCommand.description}`);
	}
}

export const historyStore = new HistoryStore();

const canUndo = $derived(historyStore.commandHistory.length > 0);
const canRedo = $derived(historyStore.redoStack.length > 0);

export function getCanUndo() {
	return canUndo;
}

export function getCanRedo() {
	return canRedo;
}

export function initializeHistory() {
	return historyStore.initializeHistory();
}

export function addToHistory(type, payload, description) {
	return historyStore.addToHistory(type, payload, description);
}

export function undo() {
	return historyStore.undo();
}

export function redo() {
	return historyStore.redo();
}
